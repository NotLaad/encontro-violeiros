-- =====================================================================
-- Encontro dos Violeiros — banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table public.tipos_ingresso (
  id        text primary key,
  nome      text not null,
  descricao text,
  preco     numeric(10,2) not null check (preco >= 0),
  pagante   boolean not null default true,   -- conta como "responsável pagante"
  publico   boolean not null default true,   -- aparece no formulário do site
  ordem     int not null default 0
);

-- AJUSTE AQUI os valores e descrições
insert into public.tipos_ingresso (id, nome, descricao, preco, pagante, publico, ordem) values
  ('adulto',   'Adulto',       null,                         40.00, true,  true,  1),
  ('crianca',  'Criança',      'Até 6 anos, não paga',        0.00, false, true,  3),
  ('cortesia', 'Cortesia',     'Liberada pela organização',   0.00, false, false, 4);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome    text not null,
  papel   text not null check (papel in ('admin', 'portaria'))
);

create table public.pedidos (
  id            uuid primary key default gen_random_uuid(),
  numero        int generated always as identity unique,
  responsavel   text not null check (length(responsavel) between 2 and 120),
  whatsapp      text not null,
  email         text,
  valor_total   numeric(10,2) not null default 0,
  valor_pix     numeric(10,2) not null default 0,
  status        text not null default 'pendente'
                check (status in ('pendente', 'pago', 'cancelado')),
  cortesia      boolean not null default false,
  token         text not null unique default encode(gen_random_bytes(18), 'hex'),
  criado_em     timestamptz not null default now(),
  confirmado_por uuid references public.admins(user_id),
  confirmado_em  timestamptz,
  cancelado_por  uuid references public.admins(user_id),
  cancelado_em   timestamptz,
  observacao     text
);

create table public.participantes (
  id          uuid primary key default gen_random_uuid(),
  numero      int generated always as identity unique,   -- #0001, #0002…
  pedido_id   uuid not null references public.pedidos(id) on delete cascade,
  nome        text not null check (length(nome) between 2 and 120),
  tipo        text not null references public.tipos_ingresso(id),
  valor       numeric(10,2) not null default 0,
  codigo      text not null unique default encode(gen_random_bytes(12), 'hex'), -- vai no QR
  checkin_em  timestamptz,
  checkin_por uuid references public.admins(user_id)
);
create index participantes_pedido_idx on public.participantes(pedido_id);

create table public.patrocinadores (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  descricao text,
  logo_url  text,
  site      text,
  ordem     int not null default 0,
  ativo     boolean not null default true
);

-- ---------------------------------------------------------------------
-- Papel do usuário logado ('admin', 'portaria' ou null)
-- ---------------------------------------------------------------------
create or replace function public.papel_atual()
returns text language sql stable security definer set search_path = public as $$
  select papel from public.admins where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- Segurança por linha (RLS)
-- O público NÃO lê pedidos nem participantes: só passa pelas funções abaixo.
-- ---------------------------------------------------------------------
alter table public.tipos_ingresso enable row level security;
alter table public.admins         enable row level security;
alter table public.pedidos        enable row level security;
alter table public.participantes  enable row level security;
alter table public.patrocinadores enable row level security;

create policy "tipos: leitura pública" on public.tipos_ingresso
  for select using (true);

create policy "patrocinadores: leitura pública" on public.patrocinadores
  for select using (ativo or public.papel_atual() = 'admin');
create policy "patrocinadores: admin edita" on public.patrocinadores
  for all to authenticated
  using (public.papel_atual() = 'admin') with check (public.papel_atual() = 'admin');

create policy "admins: ver a si mesmo" on public.admins
  for select to authenticated using (user_id = auth.uid() or public.papel_atual() = 'admin');

create policy "pedidos: admin lê" on public.pedidos
  for select to authenticated using (public.papel_atual() = 'admin');

create policy "participantes: admin lê" on public.participantes
  for select to authenticated using (public.papel_atual() = 'admin');

-- ---------------------------------------------------------------------
-- Funções públicas
-- ---------------------------------------------------------------------

-- Cria uma inscrição (pedido) com 1 a 10 participantes.
-- O preço é calculado aqui no banco, nunca vem do navegador.
create or replace function public.criar_pedido(
  p_responsavel text, p_whatsapp text, p_email text, p_participantes jsonb
) returns table (ret_token text, ret_numero int, ret_valor_pix numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_pedido   public.pedidos;
  v_item     jsonb;
  v_tipo     public.tipos_ingresso;
  v_total    numeric := 0;
  v_pagantes int := 0;
  v_qtd      int;
  v_pix      numeric;
begin
  p_responsavel := trim(coalesce(p_responsavel, ''));
  p_whatsapp    := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');

  if length(p_responsavel) < 2 then raise exception 'Informe o nome do responsável.'; end if;
  if length(p_whatsapp) not between 10 and 13 then raise exception 'WhatsApp inválido. Use DDD + número.'; end if;

  v_qtd := jsonb_array_length(coalesce(p_participantes, '[]'::jsonb));
  if v_qtd < 1 or v_qtd > 10 then raise exception 'Inscreva de 1 a 10 pessoas por vez.'; end if;

  insert into pedidos (responsavel, whatsapp, email)
  values (p_responsavel, p_whatsapp, nullif(trim(coalesce(p_email, '')), ''))
  returning * into v_pedido;

  for v_item in select * from jsonb_array_elements(p_participantes) loop
    select * into v_tipo from tipos_ingresso t where t.id = v_item->>'tipo' and t.publico;
    if not found then raise exception 'Tipo de ingresso inválido.'; end if;
    if length(trim(coalesce(v_item->>'nome', ''))) < 2 then
      raise exception 'Preencha o nome de todos os participantes.';
    end if;

    insert into participantes (pedido_id, nome, tipo, valor)
    values (v_pedido.id, trim(v_item->>'nome'), v_tipo.id, v_tipo.preco);

    v_total := v_total + v_tipo.preco;
    if v_tipo.pagante then v_pagantes := v_pagantes + 1; end if;
  end loop;

  if v_pagantes = 0 then
    raise exception 'Crianças precisam estar acompanhadas de pelo menos um adulto pagante.';
  end if;

  v_pix := v_total; -- valor exato (a identificação vai no Pix Copia e Cola)

  update pedidos set valor_total = v_total, valor_pix = v_pix where id = v_pedido.id;

  return query select v_pedido.token, v_pedido.numero, v_pix::numeric(10,2);
end $$;

-- Dados do ingresso a partir do link secreto. QR Codes só saem se estiver pago.
create or replace function public.ver_ingresso(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'numero', p.numero,
    'responsavel', p.responsavel,
    'status', p.status,
    'valor_pix', p.valor_pix,
    'cortesia', p.cortesia,
    'participantes', (
      select jsonb_agg(jsonb_build_object(
        'numero', x.numero,
        'nome', x.nome,
        'tipo', t.nome,
        'codigo', case when p.status = 'pago' then x.codigo end,
        'checkin_em', x.checkin_em
      ) order by x.numero)
      from participantes x join tipos_ingresso t on t.id = x.tipo
      where x.pedido_id = p.id
    )
  )
  from pedidos p
  where p.token = p_token and length(p_token) = 36
$$;

-- ---------------------------------------------------------------------
-- Funções da equipe
-- ---------------------------------------------------------------------

create or replace function public.confirmar_pagamento(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.papel_atual() is distinct from 'admin' then raise exception 'Sem permissão.'; end if;
  update pedidos set status = 'pago', confirmado_por = auth.uid(), confirmado_em = now()
  where id = p_pedido and status = 'pendente';
  if not found then raise exception 'Esta inscrição não está pendente.'; end if;
end $$;

create or replace function public.cancelar_pedido(p_pedido uuid, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.papel_atual() is distinct from 'admin' then raise exception 'Sem permissão.'; end if;
  update pedidos set status = 'cancelado', cancelado_por = auth.uid(), cancelado_em = now(),
         observacao = coalesce(p_motivo, observacao)
  where id = p_pedido and status <> 'cancelado';
  if not found then raise exception 'Esta inscrição já está cancelada.'; end if;
end $$;

-- Cortesia: já nasce paga, sem valor. p_nomes = ["Fulano", "Ciclano"]
create or replace function public.criar_cortesia(p_responsavel text, p_whatsapp text, p_nomes jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_pedido public.pedidos;
  v_nome   text;
begin
  if public.papel_atual() is distinct from 'admin' then raise exception 'Sem permissão.'; end if;
  if jsonb_array_length(coalesce(p_nomes, '[]'::jsonb)) < 1 then raise exception 'Informe ao menos um nome.'; end if;

  insert into pedidos (responsavel, whatsapp, status, cortesia, confirmado_por, confirmado_em)
  values (trim(p_responsavel), regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g'),
          'pago', true, auth.uid(), now())
  returning * into v_pedido;

  for v_nome in select trim(value) from jsonb_array_elements_text(p_nomes) loop
    if length(v_nome) >= 2 then
      insert into participantes (pedido_id, nome, tipo, valor) values (v_pedido.id, v_nome, 'cortesia', 0);
    end if;
  end loop;

  return v_pedido.token;
end $$;

-- Ficha de um participante para a portaria
create or replace function public.ficha_participante(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', x.id, 'numero', x.numero, 'nome', x.nome, 'tipo', t.nome,
    'status', p.status, 'pedido', p.numero, 'responsavel', p.responsavel,
    'checkin_em', x.checkin_em, 'checkin_por', a.nome
  )
  from participantes x
  join pedidos p on p.id = x.pedido_id
  join tipos_ingresso t on t.id = x.tipo
  left join admins a on a.user_id = x.checkin_por
  where x.id = p_id
$$;

-- Busca por número (#) para quando a pessoa não tem o QR
create or replace function public.buscar_participante(p_numero int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if public.papel_atual() is null then raise exception 'Sem permissão.'; end if;
  select id into v_id from participantes where numero = p_numero;
  if v_id is null then return jsonb_build_object('resultado', 'nao_encontrado'); end if;
  return public.ficha_participante(v_id) || jsonb_build_object('resultado', 'encontrado');
end $$;

-- Dá baixa na entrada. Pelo QR (p_codigo) ou pelo id após busca por número.
create or replace function public.registrar_entrada(p_codigo text default null, p_participante uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_part   public.participantes;
  v_status text;
begin
  if public.papel_atual() is null then raise exception 'Sem permissão.'; end if;

  select * into v_part from participantes
  where (p_codigo is not null and codigo = lower(trim(p_codigo)))
     or (p_participante is not null and id = p_participante)
  for update;

  if not found then return jsonb_build_object('resultado', 'nao_encontrado'); end if;

  select status into v_status from pedidos where id = v_part.pedido_id;

  if v_status <> 'pago' then
    return public.ficha_participante(v_part.id) || jsonb_build_object('resultado', 'nao_pago');
  end if;

  if v_part.checkin_em is not null then
    return public.ficha_participante(v_part.id) || jsonb_build_object('resultado', 'ja_utilizado');
  end if;

  update participantes set checkin_em = now(), checkin_por = auth.uid() where id = v_part.id;
  return public.ficha_participante(v_part.id) || jsonb_build_object('resultado', 'ok');
end $$;

-- Contagem para a tela da portaria
create or replace function public.resumo_entrada()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if public.papel_atual() is null then raise exception 'Sem permissão.'; end if;
  return (
    select jsonb_build_object(
      'presentes', count(*) filter (where x.checkin_em is not null),
      'esperados', count(*)
    )
    from participantes x join pedidos p on p.id = x.pedido_id
    where p.status = 'pago'
  );
end $$;

-- ---------------------------------------------------------------------
-- Permissões de execução
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.criar_pedido(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.ver_ingresso(text) to anon, authenticated;
grant execute on function public.papel_atual() to anon, authenticated;
grant execute on function public.confirmar_pagamento(uuid) to authenticated;
grant execute on function public.cancelar_pedido(uuid, text) to authenticated;
grant execute on function public.criar_cortesia(text, text, jsonb) to authenticated;
grant execute on function public.buscar_participante(int) to authenticated;
grant execute on function public.registrar_entrada(text, uuid) to authenticated;
grant execute on function public.resumo_entrada() to authenticated;
revoke execute on function public.ficha_participante(uuid) from authenticated;

-- =====================================================================
-- 003: Pix com valor exato + registro de acessos da equipe
-- Rode uma vez no SQL Editor.
-- =====================================================================

-- 1) Sem centavos extras: o Pix passa a ser o valor exato
update public.pedidos set valor_pix = valor_total where status = 'pendente';

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

  update pedidos set valor_total = v_total, valor_pix = v_total where id = v_pedido.id;
  return query select v_pedido.token, v_pedido.numero, v_total::numeric(10,2);
end $$;

-- 3) Registro de acessos da equipe (quem entrou e quando)
create table if not exists public.acessos (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid(),
  momento   timestamptz not null default now(),
  evento    text not null check (evento in ('login', 'saida'))
);
alter table public.acessos enable row level security;
grant select, insert on public.acessos to authenticated;
drop policy if exists "acessos: registrar o próprio" on public.acessos;
create policy "acessos: registrar o próprio" on public.acessos
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "acessos: admin lê" on public.acessos;
create policy "acessos: admin lê" on public.acessos
  for select to authenticated using (public.papel_atual() = 'admin');

-- 4) Controle de envio dos ingressos
alter table public.pedidos add column if not exists ingressos_enviados_em timestamptz;

create or replace function public.marcar_envio(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.papel_atual() is distinct from 'admin' then raise exception 'Sem permissão.'; end if;
  update pedidos set ingressos_enviados_em = now() where id = p_pedido and status = 'pago';
end $$;
revoke execute on function public.marcar_envio(uuid) from public, anon;
grant execute on function public.marcar_envio(uuid) to authenticated;

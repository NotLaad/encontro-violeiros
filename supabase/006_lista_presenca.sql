-- =====================================================================
-- 006: lista de presença para a tela de Entrada (admin e portaria)
-- Rode uma vez no SQL Editor.
-- =====================================================================
create or replace function public.lista_presenca()
returns table (
  id uuid, numero int, nome text, tipo text, codigo text,
  pedido int, responsavel text, checkin_em timestamptz, checkin_por text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.papel_atual() is null then raise exception 'Sem permissão.'; end if;
  return query
    select x.id, x.numero, x.nome, t.nome, x.codigo,
           p.numero, p.responsavel, x.checkin_em, a.nome
    from participantes x
    join pedidos p on p.id = x.pedido_id
    join tipos_ingresso t on t.id = x.tipo
    left join admins a on a.user_id = x.checkin_por
    where p.status = 'pago'
    order by x.nome;
end $$;

revoke execute on function public.lista_presenca() from public, anon;
grant execute on function public.lista_presenca() to authenticated;

-- =====================================================================
-- 004: área da equipe só com e-mail e senha (sem app autenticador)
-- Rode uma vez no SQL Editor. Só é necessário se você já rodou a versão
-- antiga do 003, que exigia o código do autenticador.
-- =====================================================================
create or replace function public.papel_atual()
returns text language sql stable security definer set search_path = public as $$
  select papel from public.admins where user_id = auth.uid()
$$;

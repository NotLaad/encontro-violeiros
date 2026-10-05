-- =====================================================================
-- 005: permite cadastrar patrocinadores e enviar logos pelo painel
-- Rode uma vez no SQL Editor (depois do 002).
-- =====================================================================

-- Pasta pública dos logos (se o 002 já criou, não faz nada)
insert into storage.buckets (id, name, public)
values ('patrocinadores', 'patrocinadores', true)
on conflict (id) do nothing;

-- Só admin da equipe envia, troca ou apaga logos
drop policy if exists "logos: admin envia" on storage.objects;
create policy "logos: admin envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'patrocinadores' and public.papel_atual() = 'admin');

drop policy if exists "logos: admin altera" on storage.objects;
create policy "logos: admin altera" on storage.objects
  for update to authenticated
  using (bucket_id = 'patrocinadores' and public.papel_atual() = 'admin');

drop policy if exists "logos: admin apaga" on storage.objects;
create policy "logos: admin apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'patrocinadores' and public.papel_atual() = 'admin');

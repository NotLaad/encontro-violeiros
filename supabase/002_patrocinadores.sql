-- =====================================================================
-- Complemento: cartões de patrocinadores (rode uma vez no SQL Editor)
-- =====================================================================

alter table public.patrocinadores
  add column if not exists categoria  text,                 -- ex.: 'Restaurante'
  add column if not exists cidade     text,                 -- ex.: 'Pindamonhangaba – SP'
  add column if not exists tags       text[] not null default '{}',  -- ex.: '{Buffet por quilo,Marmitex}'
  add column if not exists endereco   text,                 -- ex.: 'R. Cap. José Martiniano, 283 – Centro'
  add column if not exists maps_url   text,                 -- link do Google Maps (opcional)
  add column if not exists cor_fundo  text not null default '#fbf5e7', -- fundo atrás do logo
  add column if not exists instagram  text,                 -- sem @
  add column if not exists whatsapp   text;                 -- 55 + DDD + número

-- Pasta pública para os logos (Storage > patrocinadores)
insert into storage.buckets (id, name, public)
values ('patrocinadores', 'patrocinadores', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- EXEMPLO de cadastro (tire os dois traços do começo das linhas para usar)
-- ---------------------------------------------------------------------
-- insert into public.patrocinadores
--   (nome, categoria, cidade, descricao, tags, endereco, logo_url, cor_fundo, instagram, whatsapp, ordem)
-- values (
--   'Art Grill',
--   'Restaurante',
--   'Pindamonhangaba – SP',
--   'Buffet por quilo no Centro de Pinda, com mais de 30 pratos quentes e frios todo dia.',
--   '{Buffet por quilo,Marmitex,Delivery}',
--   'R. Cap. José Martiniano Vieira Ferraz, 283 – Centro',
--   'https://SEU-PROJETO.supabase.co/storage/v1/object/public/patrocinadores/artgrill.png',
--   '#f3ece6',
--   'artgrill',
--   '5512999999999',
--   1
-- );

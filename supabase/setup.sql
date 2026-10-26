-- Ejecutar una vez en Supabase > SQL Editor. Crear primero la cuenta desde Authentication > Users.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 100),
  precio integer not null check (precio >= 0),
  precio_anterior integer check (precio_anterior is null or precio_anterior >= 0),
  descripcion text,
  categoria text not null check (categoria in ('conjuntos','bombachas','bodys','ropa-deportiva','sexshop','medias','boxers','promociones')),
  talles text[] not null default '{}',
  colores text[] not null default '{}',
  imagen_url text,
  secciones text[] not null default '{}',
  destacado boolean not null default false,
  nuevo boolean not null default false,
  en_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists secciones text[] not null default '{}';
update public.products set secciones = array_remove(array[
  case when nuevo then 'novedades' end,
  case when destacado then 'mas-vendidos' end,
  case when precio_anterior is not null or categoria = 'promociones' then 'promociones' end
], null) where cardinality(secciones) = 0;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Admins can verify their own access" on public.admin_users;
create policy "Admins can verify their own access" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Public can read available products" on public.products;
create policy "Public can read available products" on public.products
  for select to anon, authenticated using (en_stock = true or exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ));
drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products" on public.products
  for insert to authenticated with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Admins can edit products" on public.products;
create policy "Admins can edit products" on public.products
  for update to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products
  for delete to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 6291456, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 6291456, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are public" on storage.objects;
create policy "Product images are public" on storage.objects
  for select using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images' and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  ) with check (
    bucket_id = 'product-images' and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

-- Catálogo inicial que antes vivía en archivos Markdown.
insert into public.products (titulo, precio, precio_anterior, descripcion, categoria, talles, colores, imagen_url, secciones, destacado, nuevo, en_stock)
select 'Conjunto encaje negro', 24990, null, 'Conjunto de lencería con delicado encaje, disponible en varios talles.', 'conjuntos', array['S','M','L','XL'], array['Negro'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1976&auto=format&fit=crop', array['novedades','mas-vendidos'], true, true, true
where not exists (select 1 from public.products where titulo = 'Conjunto encaje negro');

insert into public.products (titulo, precio, precio_anterior, descripcion, categoria, talles, colores, imagen_url, secciones, destacado, nuevo, en_stock)
select 'Body encaje premium', 32990, 39990, 'Body delicado con encaje floral, ideal para ocasiones especiales.', 'bodys', array['S','M','L','XL'], array['Negro','Nude'], 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1974&auto=format&fit=crop', array['mas-vendidos','seleccion-luma'], true, false, true
where not exists (select 1 from public.products where titulo = 'Body encaje premium');

-- Después de crear el usuario en Supabase Auth, autorizarlo como administrador:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'tu@email.com'
-- on conflict do nothing;

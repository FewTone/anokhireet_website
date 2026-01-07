-- MIGRATION: Product Facet Tables (types, occasions, colors, materials, cities)
-- Safe to run multiple times (IF NOT EXISTS used wherever possible)
-- Prereq: uuid extension
create extension if not exists "uuid-ossp";

-- =========================
-- Base facet tables
-- =========================
create table if not exists product_types (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  image_url text,
  display_order int default 0,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists occasions (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  image_url text,
  display_order int default 0,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists colors (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  hex text, -- optional: store color hex like #FF0000
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists materials (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists cities (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  state text,
  country text,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- =========================
-- Junction tables (many-to-many with products)
-- =========================
create table if not exists product_product_types (
  product_id uuid not null references products(id) on delete cascade,
  type_id uuid not null references product_types(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, type_id)
);

create table if not exists product_occasions (
  product_id uuid not null references products(id) on delete cascade,
  occasion_id uuid not null references occasions(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, occasion_id)
);

create table if not exists product_colors (
  product_id uuid not null references products(id) on delete cascade,
  color_id uuid not null references colors(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, color_id)
);

create table if not exists product_materials (
  product_id uuid not null references products(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, material_id)
);

create table if not exists product_cities (
  product_id uuid not null references products(id) on delete cascade,
  city_id uuid not null references cities(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, city_id)
);

-- =========================
-- Indexes
-- =========================
create index if not exists idx_product_product_types_product_id on product_product_types(product_id);
create index if not exists idx_product_product_types_type_id on product_product_types(type_id);
create index if not exists idx_product_occasions_product_id on product_occasions(product_id);
create index if not exists idx_product_occasions_occasion_id on product_occasions(occasion_id);
create index if not exists idx_product_colors_product_id on product_colors(product_id);
create index if not exists idx_product_colors_color_id on product_colors(color_id);
create index if not exists idx_product_materials_product_id on product_materials(product_id);
create index if not exists idx_product_materials_material_id on product_materials(material_id);
create index if not exists idx_product_cities_product_id on product_cities(product_id);
create index if not exists idx_product_cities_city_id on product_cities(city_id);

-- =========================
-- RLS
-- =========================
alter table if exists product_types enable row level security;
alter table if exists occasions enable row level security;
alter table if exists colors enable row level security;
alter table if exists materials enable row level security;
alter table if exists cities enable row level security;
alter table if exists product_product_types enable row level security;
alter table if exists product_occasions enable row level security;
alter table if exists product_colors enable row level security;
alter table if exists product_materials enable row level security;
alter table if exists product_cities enable row level security;

-- Helper admin predicate reused in policies:
-- exists (select 1 from admins where admins.auth_user_id = auth.uid())

-- Public read for facet dictionaries
drop policy if exists "public read product_types" on product_types;
create policy "public read product_types" on product_types
  for select using (true);
drop policy if exists "public read occasions" on occasions;
create policy "public read occasions" on occasions
  for select using (true);
drop policy if exists "public read colors" on colors;
create policy "public read colors" on colors
  for select using (true);
drop policy if exists "public read materials" on materials;
create policy "public read materials" on materials
  for select using (true);
drop policy if exists "public read cities" on cities;
create policy "public read cities" on cities
  for select using (true);

-- Admin manage facet dictionaries
drop policy if exists "admin manage product_types" on product_types;
create policy "admin manage product_types" on product_types
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));

drop policy if exists "admin manage occasions" on occasions;
create policy "admin manage occasions" on occasions
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));

drop policy if exists "admin manage colors" on colors;
create policy "admin manage colors" on colors
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));

drop policy if exists "admin manage materials" on materials;
create policy "admin manage materials" on materials
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));

drop policy if exists "admin manage cities" on cities;
create policy "admin manage cities" on cities
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));

-- Public read on product<->facet junctions (to allow filtering on website)
drop policy if exists "public read product_product_types" on product_product_types;
create policy "public read product_product_types" on product_product_types
  for select using (true);
drop policy if exists "public read product_occasions" on product_occasions;
create policy "public read product_occasions" on product_occasions
  for select using (true);
drop policy if exists "public read product_colors" on product_colors;
create policy "public read product_colors" on product_colors
  for select using (true);
drop policy if exists "public read product_materials" on product_materials;
create policy "public read product_materials" on product_materials
  for select using (true);
drop policy if exists "public read product_cities" on product_cities;
create policy "public read product_cities" on product_cities
  for select using (true);

-- Admin manage product<->facet junctions
drop policy if exists "admin manage product_product_types" on product_product_types;
create policy "admin manage product_product_types" on product_product_types
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));
drop policy if exists "admin manage product_occasions" on product_occasions;
create policy "admin manage product_occasions" on product_occasions
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));
drop policy if exists "admin manage product_colors" on product_colors;
create policy "admin manage product_colors" on product_colors
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));
drop policy if exists "admin manage product_materials" on product_materials;
create policy "admin manage product_materials" on product_materials
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));
drop policy if exists "admin manage product_cities" on product_cities;
create policy "admin manage product_cities" on product_cities
  for all using (exists (select 1 from admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from admins where auth_user_id = auth.uid()));

-- Optional seed (commented)
-- insert into colors (name, hex) values ('red','#FF0000') on conflict (name) do nothing;
-- insert into materials (name) values ('Cotton') on conflict (name) do nothing;



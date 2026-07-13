-- OMS v2 incremental migration
-- Safe additive migration for runner operating model, market days, batching margins, and settings.

create extension if not exists pgcrypto;

create table if not exists public.runners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runner_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  runner_id uuid references public.runners(id) on delete set null,
  status text not null default 'Assigned' check (status in ('Assigned', 'Shopping', 'At Staging', 'Completed')),
  allocated_budget numeric(12,2) not null default 0,
  actual_spend numeric(12,2) not null default 0,
  shopping_margin numeric(12,2) not null default 0,
  runner_bonus numeric(12,2) not null default 0,
  business_margin numeric(12,2) not null default 0,
  receipt_images text[] not null default '{}',
  unavailable_items text[] not null default '{}',
  suggested_substitutions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  line text not null check (line in ('Weekly Groceries', 'Specialty Items')),
  unit_price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specialty_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  category text not null,
  description text,
  photo text,
  availability text not null default 'In Stock' check (availability in ('In Stock', 'Low Stock', 'Out of Stock')),
  lead_time_days integer not null default 1,
  minimum_quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_batches (
  id text primary key,
  estate text not null,
  market_day text not null check (market_day in ('Weekday', 'Weekend')),
  delivery_window text not null,
  assigned_rider_id uuid references public.users(id) on delete set null,
  dispatch_cost numeric(12,2) not null default 0,
  collected_delivery_fees numeric(12,2) not null default 0,
  delivery_margin numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  runner_assignment_id uuid references public.runner_assignments(id) on delete set null,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_margins (
  order_id text primary key references public.orders(id) on delete cascade,
  shopping_margin numeric(12,2) not null default 0,
  runner_bonus numeric(12,2) not null default 0,
  business_margin numeric(12,2) not null default 0,
  delivery_margin numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  service_fee numeric(12,2) not null default 1200,
  default_delivery_fee numeric(12,2) not null default 1500,
  custom_delivery_fee numeric(12,2) not null default 3500,
  runner_bonus_percentage numeric(5,2) not null default 5,
  market_days jsonb not null default '[{"key":"Weekday","label":"Weekly Groceries","defaultSourcingDay":"Tuesday"},{"key":"Weekend","label":"Specialty Items","defaultSourcingDay":"Saturday"}]'::jsonb,
  delivery_windows text[] not null default '{09:00 - 12:00,12:00 - 15:00,15:00 - 18:00}',
  currency text not null default 'NGN',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists market_day text;
alter table public.orders add column if not exists product_line text;
alter table public.orders add column if not exists assigned_runner_id uuid references public.users(id) on delete set null;
alter table public.orders add column if not exists shopping_budget numeric(12,2) not null default 0;
alter table public.orders add column if not exists actual_spend numeric(12,2) not null default 0;
alter table public.orders add column if not exists shopping_margin numeric(12,2) not null default 0;
alter table public.orders add column if not exists runner_incentive numeric(12,2) not null default 0;
alter table public.orders add column if not exists business_margin numeric(12,2) not null default 0;
alter table public.orders add column if not exists delivery_batch_id text;
alter table public.orders add column if not exists custom_delivery boolean not null default false;
alter table public.orders add column if not exists custom_delivery_reason text;
alter table public.orders add column if not exists custom_delivery_requested_date date;
alter table public.orders add column if not exists custom_delivery_premium_fee numeric(12,2) not null default 0;
alter table public.orders add column if not exists delivery_margin numeric(12,2) not null default 0;
alter table public.orders add column if not exists receipt_images text[] not null default '{}';
alter table public.orders add column if not exists unavailable_items text[] not null default '{}';
alter table public.orders add column if not exists suggested_substitutions text[] not null default '{}';
alter table public.orders add column if not exists status_timeline jsonb not null default '[]'::jsonb;

alter table public.runner_tasks add column if not exists order_number text;
alter table public.runner_tasks add column if not exists market_day text;
alter table public.runner_tasks add column if not exists product_line text;
alter table public.runner_tasks add column if not exists estate text;
alter table public.runner_tasks add column if not exists shopping_list text[] not null default '{}';
alter table public.runner_tasks add column if not exists allocated_budget numeric(12,2) not null default 0;
alter table public.runner_tasks add column if not exists actual_spend numeric(12,2) not null default 0;
alter table public.runner_tasks add column if not exists unavailable_items text[] not null default '{}';
alter table public.runner_tasks add column if not exists suggested_substitutions text[] not null default '{}';
alter table public.runner_tasks add column if not exists receipt_images text[] not null default '{}';
alter table public.runner_tasks add column if not exists shopping_completed_at timestamptz;
alter table public.runner_tasks add column if not exists delivered_to_staging_at timestamptz;

create index if not exists idx_orders_market_day on public.orders(market_day);
create index if not exists idx_orders_product_line on public.orders(product_line);
create index if not exists idx_orders_assigned_runner_id on public.orders(assigned_runner_id);
create index if not exists idx_orders_delivery_batch_id on public.orders(delivery_batch_id);
create index if not exists idx_runner_assignments_order_id on public.runner_assignments(order_id);
create index if not exists idx_delivery_batches_estate_market_day on public.delivery_batches(estate, market_day);

alter table public.runners enable row level security;
alter table public.runner_assignments enable row level security;
alter table public.products enable row level security;
alter table public.specialty_products enable row level security;
alter table public.delivery_batches enable row level security;
alter table public.receipts enable row level security;
alter table public.order_margins enable row level security;
alter table public.business_settings enable row level security;

drop policy if exists "Allow all for service role" on public.runners;
create policy "Allow all for service role" on public.runners for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.runner_assignments;
create policy "Allow all for service role" on public.runner_assignments for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.products;
create policy "Allow all for service role" on public.products for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.specialty_products;
create policy "Allow all for service role" on public.specialty_products for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.delivery_batches;
create policy "Allow all for service role" on public.delivery_batches for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.receipts;
create policy "Allow all for service role" on public.receipts for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.order_margins;
create policy "Allow all for service role" on public.order_margins for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.business_settings;
create policy "Allow all for service role" on public.business_settings for all using (true) with check (true);

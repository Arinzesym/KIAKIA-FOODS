-- KiaKia Foods OMS full database setup for Supabase/PostgreSQL
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('owner', 'cofounder', 'operations', 'runner', 'rider')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  estate text not null,
  address text not null,
  total_orders integer not null default 0,
  lifetime_spend numeric(12,2) not null default 0,
  repeat_orders integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  district text,
  active_orders integer not null default 0,
  total_revenue numeric(12,2) not null default 0,
  last_batch_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estate_batches (
  id uuid primary key default gen_random_uuid(),
  estate text not null,
  order_count integer not null default 0,
  total_value numeric(12,2) not null default 0,
  assigned_rider_id uuid references public.users(id) on delete set null,
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  whatsapp text not null,
  email text not null,
  estate text not null,
  address text not null,
  status text not null default 'New',
  subtotal numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  additional_charges numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  batch_id uuid references public.estate_batches(id) on delete set null,
  assigned_rider_id uuid references public.users(id) on delete set null,
  purchase_cost numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runner_tasks (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  assigned_runner_id uuid references public.users(id) on delete set null,
  status text not null default 'Pending',
  purchase_cost numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rider_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  assigned_rider_id uuid references public.users(id) on delete set null,
  status text not null default 'Assigned',
  proof_url text,
  delivery_notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  period text not null unique,
  revenue numeric(12,2) not null default 0,
  delivery_fees numeric(12,2) not null default 0,
  outstanding_payments numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'KiaKia Foods',
  whatsapp_number text not null default '+2348000000000',
  business_account_number text not null default '1234567890',
  service_fee numeric(12,2) not null default 1200,
  delivery_fee numeric(12,2) not null default 1500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_batch_id on public.orders(batch_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_runner_tasks_order_id on public.runner_tasks(order_id);
create index if not exists idx_runner_tasks_assigned_runner_id on public.runner_tasks(assigned_runner_id);
create index if not exists idx_rider_assignments_order_id on public.rider_assignments(order_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists touch_customers_updated_at on public.customers;
create trigger touch_customers_updated_at
before update on public.customers
for each row execute function public.touch_updated_at();

drop trigger if exists touch_estates_updated_at on public.estates;
create trigger touch_estates_updated_at
before update on public.estates
for each row execute function public.touch_updated_at();

drop trigger if exists touch_estate_batches_updated_at on public.estate_batches;
create trigger touch_estate_batches_updated_at
before update on public.estate_batches
for each row execute function public.touch_updated_at();

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

drop trigger if exists touch_order_items_updated_at on public.order_items;
create trigger touch_order_items_updated_at
before update on public.order_items
for each row execute function public.touch_updated_at();

drop trigger if exists touch_runner_tasks_updated_at on public.runner_tasks;
create trigger touch_runner_tasks_updated_at
before update on public.runner_tasks
for each row execute function public.touch_updated_at();

drop trigger if exists touch_rider_assignments_updated_at on public.rider_assignments;
create trigger touch_rider_assignments_updated_at
before update on public.rider_assignments
for each row execute function public.touch_updated_at();

drop trigger if exists touch_finances_updated_at on public.finances;
create trigger touch_finances_updated_at
before update on public.finances
for each row execute function public.touch_updated_at();

drop trigger if exists touch_admin_settings_updated_at on public.admin_settings;
create trigger touch_admin_settings_updated_at
before update on public.admin_settings
for each row execute function public.touch_updated_at();

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.estates enable row level security;
alter table public.estate_batches enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.runner_tasks enable row level security;
alter table public.rider_assignments enable row level security;
alter table public.finances enable row level security;
alter table public.admin_settings enable row level security;

-- Allow authenticated app users to read/write from the app when using the service role.
-- For client-side reads, add your own policies based on your auth model.
drop policy if exists "Allow all for service role" on public.users;
create policy "Allow all for service role" on public.users for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.customers;
create policy "Allow all for service role" on public.customers for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.estates;
create policy "Allow all for service role" on public.estates for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.estate_batches;
create policy "Allow all for service role" on public.estate_batches for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.orders;
create policy "Allow all for service role" on public.orders for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.order_items;
create policy "Allow all for service role" on public.order_items for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.runner_tasks;
create policy "Allow all for service role" on public.runner_tasks for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.rider_assignments;
create policy "Allow all for service role" on public.rider_assignments for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.finances;
create policy "Allow all for service role" on public.finances for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.admin_settings;
create policy "Allow all for service role" on public.admin_settings for all using (true) with check (true);

insert into public.admin_settings (business_name, whatsapp_number, business_account_number, service_fee, delivery_fee)
values ('KiaKia Foods', '+2348000000000', '1234567890', 1200, 1500)
on conflict do nothing;

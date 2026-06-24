-- KiaKia Foods OMS production schema upgrade
-- Run in Supabase SQL editor.

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
  code text not null unique,
  delivery_zone text not null,
  assigned_riders text[] not null default '{}',
  number_of_orders integer not null default 0,
  daily_deliveries integer not null default 0,
  completed_deliveries integer not null default 0,
  pending_deliveries integer not null default 0,
  failed_deliveries integer not null default 0,
  revenue_generated numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estate_batches (
  id uuid primary key default gen_random_uuid(),
  batch_name text not null,
  estate text not null,
  estate_code text not null,
  delivery_zone text not null,
  order_ids text[] not null default '{}',
  order_count integer not null default 0,
  total_value numeric(12,2) not null default 0,
  assigned_rider_id uuid references public.users(id) on delete set null,
  status text not null default 'Pending' check (status in ('Pending', 'Assigned', 'In Progress', 'Completed')),
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
  status text not null default 'New' check (status in ('New', 'Awaiting Rider', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Completed', 'Failed', 'Cancelled')),
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded')),
  subtotal numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  additional_charges numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  batch_id uuid references public.estate_batches(id) on delete set null,
  assigned_rider_id uuid references public.users(id) on delete set null,
  dispatch_id uuid,
  purchase_cost numeric(12,2) not null default 0,
  delivery_time_minutes integer,
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

create table if not exists public.dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  order_number text not null,
  customer_name text not null,
  estate text not null,
  status text not null default 'Unassigned' check (status in ('Unassigned', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Completed', 'Failed')),
  assigned_rider_id uuid references public.users(id) on delete set null,
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
  status text not null default 'Assigned' check (status in ('Unassigned', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Completed', 'Failed')),
  proof_url text,
  delivery_notes text,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  in_transit_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('New Order', 'Rider Assignment', 'Delivery Started', 'Delivered', 'Failed Delivery', 'Batch Completed')),
  title text not null,
  message text not null,
  order_id text,
  batch_id uuid,
  is_read boolean not null default false,
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
create index if not exists idx_orders_dispatch_id on public.orders(dispatch_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_dispatches_order_id on public.dispatches(order_id);
create index if not exists idx_dispatches_status on public.dispatches(status);
create index if not exists idx_runner_tasks_order_id on public.runner_tasks(order_id);
create index if not exists idx_runner_tasks_assigned_runner_id on public.runner_tasks(assigned_runner_id);
create index if not exists idx_rider_assignments_order_id on public.rider_assignments(order_id);
create index if not exists idx_notifications_order_id on public.notifications(order_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at);

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

drop trigger if exists touch_dispatches_updated_at on public.dispatches;
create trigger touch_dispatches_updated_at
before update on public.dispatches
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
alter table public.dispatches enable row level security;
alter table public.runner_tasks enable row level security;
alter table public.rider_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.finances enable row level security;
alter table public.admin_settings enable row level security;

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

drop policy if exists "Allow all for service role" on public.dispatches;
create policy "Allow all for service role" on public.dispatches for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.runner_tasks;
create policy "Allow all for service role" on public.runner_tasks for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.rider_assignments;
create policy "Allow all for service role" on public.rider_assignments for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.notifications;
create policy "Allow all for service role" on public.notifications for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.finances;
create policy "Allow all for service role" on public.finances for all using (true) with check (true);

drop policy if exists "Allow all for service role" on public.admin_settings;
create policy "Allow all for service role" on public.admin_settings for all using (true) with check (true);

insert into public.admin_settings (business_name, whatsapp_number, business_account_number, service_fee, delivery_fee)
values ('KiaKia Foods', '+2348000000000', '1234567890', 1200, 1500)
on conflict do nothing;

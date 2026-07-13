# KiaKia Foods OMS Database Schema

Production schema for OMS + Dispatch + Estate Management.

## Core Tables

### users
- id: uuid, primary key
- email: text, unique
- password_hash: text
- name: text
- role: text (`owner`, `cofounder`, `operations`, `runner`, `rider`)
- phone: text
- created_at: timestamptz
- updated_at: timestamptz

### customers
- id: uuid, primary key
- name: text
- phone: text
- email: text
- estate: text
- address: text
- total_orders: integer
- lifetime_spend: numeric
- repeat_orders: integer
- notes: text
- created_at: timestamptz
- updated_at: timestamptz

### orders
- id: text, primary key
- customer_id: uuid references customers(id)
- customer_name: text
- phone: text
- whatsapp: text
- email: text
- estate: text
- address: text
- status: text (`New`, `Awaiting Rider`, `Assigned`, `Picked Up`, `In Transit`, `Delivered`, `Completed`, `Failed`, `Cancelled`)
- payment_status: text (`Pending`, `Paid`, `Partially Paid`, `Failed`, `Refunded`)
- subtotal: numeric
- service_fee: numeric
- delivery_fee: numeric
- additional_charges: numeric
- grand_total: numeric
- batch_id: uuid references estate_batches(id)
- assigned_rider_id: uuid references users(id)
- dispatch_id: uuid
- purchase_cost: numeric
- delivery_time_minutes: integer
- notes: text
- created_at: timestamptz
- updated_at: timestamptz

### order_items
- id: uuid, primary key
- order_id: text references orders(id)
- name: text
- quantity: integer
- price: numeric
- total: numeric
- created_at: timestamptz
- updated_at: timestamptz

## Dispatch Module

### dispatches
- id: uuid, primary key
- order_id: text references orders(id)
- order_number: text
- customer_name: text
- estate: text
- status: text (`Unassigned`, `Assigned`, `Picked Up`, `In Transit`, `Delivered`, `Completed`, `Failed`)
- assigned_rider_id: uuid references users(id)
- created_at: timestamptz
- updated_at: timestamptz

### rider_assignments
- id: uuid, primary key
- order_id: text references orders(id)
- assigned_rider_id: uuid references users(id)
- status: text
- proof_url: text
- delivery_notes: text
- accepted_at: timestamptz
- picked_up_at: timestamptz
- in_transit_at: timestamptz
- delivered_at: timestamptz
- completed_at: timestamptz
- updated_at: timestamptz
- created_at: timestamptz

### runner_tasks
- id: uuid, primary key
- order_id: text references orders(id)
- assigned_runner_id: uuid references users(id)
- status: text
- purchase_cost: numeric
- notes: text
- created_at: timestamptz
- updated_at: timestamptz

## Estate Management Module

### estates
- id: uuid, primary key
- name: text, unique
- code: text, unique
- delivery_zone: text
- assigned_riders: text[]
- number_of_orders: integer
- daily_deliveries: integer
- completed_deliveries: integer
- pending_deliveries: integer
- failed_deliveries: integer
- revenue_generated: numeric
- created_at: timestamptz
- updated_at: timestamptz

### estate_batches
- id: uuid, primary key
- batch_name: text
- estate: text
- estate_code: text
- delivery_zone: text
- order_ids: text[]
- order_count: integer
- total_value: numeric
- assigned_rider_id: uuid references users(id)
- status: text (`Pending`, `Assigned`, `In Progress`, `Completed`)
- created_at: timestamptz
- updated_at: timestamptz

## Notifications and Analytics

### notifications
- id: uuid, primary key
- type: text (`New Order`, `Rider Assignment`, `Delivery Started`, `Delivered`, `Failed Delivery`, `Batch Completed`)
- title: text
- message: text
- order_id: text
- batch_id: uuid
- is_read: boolean
- created_at: timestamptz

### finances
- id: uuid, primary key
- period: text
- revenue: numeric
- delivery_fees: numeric
- outstanding_payments: numeric
- profit: numeric
- created_at: timestamptz
- updated_at: timestamptz

### admin_settings
- id: uuid, primary key
- business_name: text
- whatsapp_number: text
- business_account_number: text
- service_fee: numeric
- delivery_fee: numeric
- created_at: timestamptz
- updated_at: timestamptz

## OMS v2 Extensions

### runners
- id: uuid, primary key
- user_id: uuid references users(id)
- phone: text
- active: boolean
- created_at: timestamptz
- updated_at: timestamptz

### runner_assignments
- id: uuid, primary key
- order_id: text references orders(id)
- runner_id: uuid references runners(id)
- status: text (`Assigned`, `Shopping`, `At Staging`, `Completed`)
- allocated_budget: numeric
- actual_spend: numeric
- shopping_margin: numeric
- runner_bonus: numeric
- business_margin: numeric
- receipt_images: text[]
- unavailable_items: text[]
- suggested_substitutions: text[]
- created_at: timestamptz
- updated_at: timestamptz

### products
- id: uuid, primary key
- name: text
- line: text (`Weekly Groceries`, `Specialty Items`)
- unit_price: numeric
- active: boolean

### specialty_products
- id: uuid, primary key
- product_id: uuid references products(id)
- category: text
- description: text
- photo: text
- availability: text (`In Stock`, `Low Stock`, `Out of Stock`)
- lead_time_days: integer
- minimum_quantity: integer

### delivery_batches
- id: text, primary key
- estate: text
- market_day: text (`Weekday`, `Weekend`)
- delivery_window: text
- assigned_rider_id: uuid references users(id)
- dispatch_cost: numeric
- collected_delivery_fees: numeric
- delivery_margin: numeric

### business_settings
- id: uuid, primary key
- service_fee: numeric
- default_delivery_fee: numeric
- custom_delivery_fee: numeric
- runner_bonus_percentage: numeric
- market_days: jsonb
- delivery_windows: text[]
- currency: text

### orders (new columns)
- market_day: text
- product_line: text
- assigned_runner_id: uuid references users(id)
- shopping_budget: numeric
- actual_spend: numeric
- shopping_margin: numeric
- runner_incentive: numeric
- business_margin: numeric
- delivery_batch_id: text
- custom_delivery: boolean
- custom_delivery_reason: text
- custom_delivery_requested_date: date
- custom_delivery_premium_fee: numeric
- delivery_margin: numeric
- receipt_images: text[]
- unavailable_items: text[]
- suggested_substitutions: text[]
- status_timeline: jsonb

### runner_tasks (new columns)
- order_number: text
- market_day: text
- product_line: text
- estate: text
- shopping_list: text[]
- allocated_budget: numeric
- actual_spend: numeric
- unavailable_items: text[]
- suggested_substitutions: text[]
- receipt_images: text[]
- shopping_completed_at: timestamptz
- delivered_to_staging_at: timestamptz

## Notes
- All mutable tables use `updated_at` triggers.
- All domain tables are RLS-enabled with service-role full-access policy baseline.
- Realtime sync in app subscribes to `orders`, `dispatches`, `rider_assignments`, `estate_batches`, and `notifications`.

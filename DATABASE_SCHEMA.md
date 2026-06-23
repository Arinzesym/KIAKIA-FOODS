# KiaKia Foods PostgreSQL Schema

This schema is designed for a production-ready Operations Management System for KiaKia Foods.

## Tables

### users
- id: uuid, primary key
- email: text, unique
- password_hash: text
- name: text
- role: text (`admin`, `operations`, `runner`, `rider`)
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

### estates
- id: uuid, primary key
- name: text
- city: text
- district: text
- active_orders: integer
- total_revenue: numeric
- last_batch_at: timestamptz
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
- status: text
- subtotal: numeric
- service_fee: numeric
- delivery_fee: numeric
- additional_charges: numeric
- grand_total: numeric
- batch_id: uuid references estate_batches(id)
- assigned_rider_id: uuid references users(id)
- purchase_cost: numeric
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

### estate_batches
- id: uuid, primary key
- estate: text
- order_count: integer
- total_value: numeric
- assigned_rider_id: uuid references users(id)
- status: text
- created_at: timestamptz
- updated_at: timestamptz

### runner_tasks
- id: uuid, primary key
- order_id: text references orders(id)
- assigned_runner_id: uuid references users(id)
- status: text
- purchase_cost: numeric
- notes: text
- created_at: timestamptz
- updated_at: timestamptz

### rider_assignments
- id: uuid, primary key
- order_id: text references orders(id)
- assigned_rider_id: uuid references users(id)
- status: text
- proof_url: text
- delivery_notes: text
- updated_at: timestamptz

### finances
- id: uuid, primary key
- period: text
- revenue: numeric
- delivery_fees: numeric
- outstanding_payments: numeric
- profit: numeric
- created_at: timestamptz
- updated_at: timestamptz

## Notes

- Use PostgreSQL and Supabase for the production database.
- Users and roles provide access control.
- Orders and batches drive the estate delivery workflow.
- Runners and riders are managed separately to support sourcing and last-mile operations.

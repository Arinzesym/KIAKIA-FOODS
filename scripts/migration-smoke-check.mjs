#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase variables. Provide SUPABASE_SERVICE_ROLE_KEY and either SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const checks = {
  orders: ['id', 'customer_id', 'status', 'payment_status', 'created_at', 'updated_at'],
  customers: ['id', 'name', 'phone', 'email', 'created_at', 'updated_at'],
  runner_tasks: ['id', 'order_id', 'status', 'assigned_to', 'created_at', 'updated_at'],
  estate_batches: ['id', 'estate', 'status', 'created_at', 'updated_at'],
  rider_assignments: ['id', 'order_id', 'status', 'assigned_rider', 'updated_at'],
  dispatches: ['id', 'order_id', 'status', 'created_at', 'updated_at'],
  estates: ['id', 'name', 'code', 'delivery_zone', 'active'],
  admin_settings: ['id', 'business_name', 'whatsapp_number', 'delivery_fee', 'updated_at'],
  business_settings: ['id', 'service_fee', 'default_delivery_fee', 'runner_bonus_percentage', 'updated_at'],
  products: ['id', 'name', 'line', 'unit_price', 'active', 'created_at'],
  specialty_products: ['id', 'product_id', 'category', 'availability', 'lead_time_days', 'minimum_quantity']
};

const failures = [];
let passedChecks = 0;
let totalChecks = 0;

async function checkTable(tableName) {
  totalChecks += 1;
  const result = await supabase.from(tableName).select('id').limit(1);

  if (result.error) {
    failures.push(`Table check failed for ${tableName}: ${result.error.message}`);
    return false;
  }

  passedChecks += 1;
  return true;
}

async function checkColumn(tableName, columnName) {
  totalChecks += 1;
  const result = await supabase.from(tableName).select(columnName).limit(1);

  if (result.error) {
    failures.push(`Column check failed for ${tableName}.${columnName}: ${result.error.message}`);
    return;
  }

  passedChecks += 1;
}

for (const [tableName, columns] of Object.entries(checks)) {
  const exists = await checkTable(tableName);
  if (!exists) {
    continue;
  }

  for (const columnName of columns) {
    await checkColumn(tableName, columnName);
  }
}

console.log(`Migration smoke-check completed: ${passedChecks}/${totalChecks} checks passed.`);

if (failures.length > 0) {
  console.error('Failures:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log('All required tables/columns were verified successfully.');

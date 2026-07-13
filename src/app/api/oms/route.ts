import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type {
  CustomerProfile,
  DispatchRecord,
  EstateBatch,
  EstateRecord,
  NotificationRecord,
  OrderItem,
  OrderRecord,
  RiderAssignment,
  RunnerTask
} from '@/lib/types';
import { isAdminRole, isDeliveryRole, normalizeRole } from '@/lib/access';
import {
  buildDispatchFallbackUpdate,
  mapDispatchStatusToOrderStatus,
  mapOrderStatusToDispatchStatus
} from '@/lib/dispatchFallback';
import {
  getMissingEstateBatchColumn,
  getMissingOrdersColumn,
  getMissingTableColumn,
  isMissingTableError,
  resolveOptionalTableResult,
  toUuidOrNull
} from '@/lib/omsCompatibility';

type SnapshotResponse = {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  estateBatches: EstateBatch[];
  runnerTasks: RunnerTask[];
  riderAssignments: RiderAssignment[];
  dispatches: DispatchRecord[];
  estates: EstateRecord[];
  notifications: NotificationRecord[];
};

type MutationBody = {
  resource?: 'orders' | 'customers' | 'runnerTasks' | 'estateBatches' | 'riderAssignments' | 'dispatches' | 'estates' | 'notifications';
  action?: 'create' | 'update' | 'updateByOrderId' | 'delete';
  id?: string;
  payload?: Record<string, unknown>;
};

type AppSnapshot = SnapshotResponse;

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }
  return value.map((item) => String(item ?? '')).filter(Boolean);
}

async function selectOrdersWithCompatibility(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const columns = [
    'id',
    'customer_id',
    'customer_name',
    'phone',
    'whatsapp',
    'email',
    'estate',
    'address',
    'status',
    'payment_status',
    'market_day',
    'product_line',
    'assigned_runner_id',
    'shopping_budget',
    'actual_spend',
    'shopping_margin',
    'runner_incentive',
    'business_margin',
    'subtotal',
    'service_fee',
    'delivery_fee',
    'additional_charges',
    'grand_total',
    'batch_id',
    'assigned_rider_id',
    'dispatch_id',
    'purchase_cost',
    'delivery_batch_id',
    'custom_delivery',
    'custom_delivery_reason',
    'custom_delivery_requested_date',
    'custom_delivery_premium_fee',
    'delivery_margin',
    'receipt_images',
    'unavailable_items',
    'suggested_substitutions',
    'status_timeline',
    'notes',
    'delivery_time_minutes',
    'created_at',
    'updated_at'
  ];

  const selectedColumns = [...columns];
  let result = await supabase.from('orders').select(selectedColumns.join(', ')).order('created_at', { ascending: false });

  while (result.error) {
    const missingColumn = getMissingOrdersColumn(result.error);
    if (!missingColumn || !selectedColumns.includes(missingColumn)) {
      break;
    }

    const nextColumns = selectedColumns.filter((column) => column !== missingColumn);
    selectedColumns.splice(0, selectedColumns.length, ...nextColumns);
    result = await supabase.from('orders').select(selectedColumns.join(', ')).order('created_at', { ascending: false });
  }

  return result;
}

async function insertOrderWithCompatibility(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  payload: Record<string, unknown>
) {
  const mutablePayload = { ...payload };
  let result = await supabase.from('orders').insert(mutablePayload);

  while (result.error) {
    const missingColumn = getMissingOrdersColumn(result.error);
    if (!missingColumn || !(missingColumn in mutablePayload)) {
      break;
    }

    delete mutablePayload[missingColumn];
    result = await supabase.from('orders').insert(mutablePayload);
  }

  return result;
}

async function updateOrderWithCompatibility(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  updatePayload: Record<string, unknown>,
  id: string
) {
  const mutablePayload = { ...updatePayload };
  let result = await supabase.from('orders').update(mutablePayload).eq('id', id);

  while (result.error) {
    const missingColumn = getMissingOrdersColumn(result.error);
    if (!missingColumn || !(missingColumn in mutablePayload)) {
      break;
    }

    delete mutablePayload[missingColumn];
    result = await supabase.from('orders').update(mutablePayload).eq('id', id);
  }

  return result;
}

async function selectEstateBatchesWithCompatibility(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const columns = [
    'id',
    'batch_name',
    'estate',
    'estate_code',
    'delivery_zone',
    'order_count',
    'total_value',
    'assigned_rider_id',
    'order_ids',
    'status',
    'created_at',
    'updated_at'
  ];

  let selectedColumns = [...columns];
  let result = await supabase.from('estate_batches').select(selectedColumns.join(', ')).order('created_at', { ascending: false });

  while (result.error) {
    const missingColumn = getMissingEstateBatchColumn(result.error);
    if (!missingColumn || !selectedColumns.includes(missingColumn)) {
      break;
    }

    selectedColumns = selectedColumns.filter((column) => column !== missingColumn);
    if (missingColumn === 'batch_name' && !selectedColumns.includes('name')) {
      selectedColumns.splice(1, 0, 'name');
    }

    result = await supabase.from('estate_batches').select(selectedColumns.join(', ')).order('created_at', { ascending: false });
  }

  return result;
}

async function selectRiderAssignmentsWithCompatibility(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  let selectedColumns = [
    'id',
    'order_id',
    'assigned_rider_id',
    'status',
    'proof_url',
    'delivery_notes',
    'accepted_at',
    'picked_up_at',
    'in_transit_at',
    'delivered_at',
    'completed_at',
    'updated_at'
  ];

  let result = await supabase.from('rider_assignments').select(selectedColumns.join(', ')).order('updated_at', { ascending: false });

  while (result.error) {
    const missingColumn = getMissingTableColumn(result.error, 'rider_assignments');
    if (!missingColumn || !selectedColumns.includes(missingColumn)) {
      break;
    }

    selectedColumns = selectedColumns.filter((column) => column !== missingColumn);
    result = await supabase.from('rider_assignments').select(selectedColumns.join(', ')).order('updated_at', { ascending: false });
  }

  return result;
}

async function selectTableWithColumnCompatibility(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  tableName: string,
  columns: string[],
  orderBy: { column: string; ascending?: boolean },
  limit?: number
) {
  let selectedColumns = [...columns];
  let query = supabase.from(tableName).select(selectedColumns.join(', ')).order(orderBy.column, { ascending: orderBy.ascending ?? true });
  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  let result = await query;

  while (result.error) {
    const missingColumn = getMissingTableColumn(result.error, tableName);
    if (!missingColumn || !selectedColumns.includes(missingColumn)) {
      break;
    }

    selectedColumns = selectedColumns.filter((column) => column !== missingColumn);
    query = supabase.from(tableName).select(selectedColumns.join(', ')).order(orderBy.column, { ascending: orderBy.ascending ?? true });
    if (typeof limit === 'number') {
      query = query.limit(limit);
    }
    result = await query;
  }

  return result;
}

async function insertRiderAssignmentWithCompatibility(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  payload: Record<string, unknown>
) {
  const mutablePayload = { ...payload };
  let result = await supabase.from('rider_assignments').insert(mutablePayload);

  while (result.error) {
    const missingColumn = getMissingTableColumn(result.error, 'rider_assignments');
    if (!missingColumn || !(missingColumn in mutablePayload)) {
      break;
    }
    delete mutablePayload[missingColumn];
    result = await supabase.from('rider_assignments').insert(mutablePayload);
  }

  return result;
}

async function updateRiderAssignmentWithCompatibility(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  payload: Record<string, unknown>,
  filterKey: 'id' | 'order_id',
  filterValue: string
) {
  const mutablePayload = { ...payload };
  let result = await supabase.from('rider_assignments').update(mutablePayload).eq(filterKey, filterValue);

  while (result.error) {
    const missingColumn = getMissingTableColumn(result.error, 'rider_assignments');
    if (!missingColumn || !(missingColumn in mutablePayload)) {
      break;
    }
    delete mutablePayload[missingColumn];
    result = await supabase.from('rider_assignments').update(mutablePayload).eq(filterKey, filterValue);
  }

  return result;
}

function toOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    return {
      id: toText(raw.id) || `I-${index + 1}`,
      name: toText(raw.name),
      quantity: toNumber(raw.quantity),
      price: toNumber(raw.price)
    };
  });
}

function calculateSubtotalFromItems(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.price), 0);
}

function calculateGrandTotalFromParts(subtotal: number, serviceFee: number, deliveryFee: number, additionalCharges: number) {
  return subtotal + serviceFee + deliveryFee + additionalCharges;
}

function getRequestRole() {
  return normalizeRole(cookies().get('auth-role')?.value);
}

function getRequestName() {
  return decodeURIComponent(cookies().get('auth-name')?.value ?? '');
}

function matchesAssignedName(assignee: string, roleLabel: string, authName: string) {
  const normalizedAssignee = assignee.trim().toLowerCase();
  const normalizedRoleLabel = roleLabel.trim().toLowerCase();
  const normalizedAuthName = authName.trim().toLowerCase();

  if (!normalizedAssignee) {
    return true;
  }

  if (normalizedAuthName && normalizedAssignee === normalizedAuthName) {
    return true;
  }

  if (
    normalizedAuthName &&
    (normalizedAssignee.includes(normalizedAuthName) || normalizedAuthName.includes(normalizedAssignee))
  ) {
    return true;
  }

  if (normalizedAuthName) {
    const authTokens = normalizedAuthName.split(/\s+/).filter(Boolean);
    const assigneeTokens = normalizedAssignee.split(/\s+/).filter(Boolean);
    if (authTokens.some((token) => assigneeTokens.includes(token) || normalizedAssignee.includes(token))) {
      return true;
    }
  }

  return normalizedAssignee.includes(normalizedRoleLabel);
}

function scopeSnapshot(snapshot: AppSnapshot, role: ReturnType<typeof normalizeRole>, authName: string): AppSnapshot {
  if (!role || isAdminRole(role)) {
    return snapshot;
  }

  if (!isDeliveryRole(role)) {
    return {
      orders: [],
      customers: [],
      estateBatches: [],
      runnerTasks: [],
      riderAssignments: [],
      dispatches: [],
      estates: [],
      notifications: []
    };
  }

  const riderAssignments = snapshot.riderAssignments.filter((assignment) => matchesAssignedName(assignment.assignedRider, role, authName));
  const scopedRunnerTasks = role === 'runner'
    ? snapshot.runnerTasks.filter((task) => matchesAssignedName(task.assignedTo, role, authName))
    : snapshot.runnerTasks;
  const allowedOrderIds = new Set([
    ...riderAssignments.map((assignment) => assignment.orderId),
    ...scopedRunnerTasks.map((task) => task.orderId)
  ]);

  return {
    orders: snapshot.orders.filter((order) => allowedOrderIds.has(order.id)),
    customers: [],
    estateBatches: snapshot.estateBatches.filter((batch) => matchesAssignedName(batch.assignedRider, role, authName)),
    runnerTasks: scopedRunnerTasks,
    riderAssignments,
    dispatches: snapshot.dispatches.filter((dispatch) => allowedOrderIds.has(dispatch.orderId)),
    estates: snapshot.estates,
    notifications: snapshot.notifications.filter((item) => !item.orderId || allowedOrderIds.has(item.orderId))
  };
}

function canMutateResource(role: ReturnType<typeof normalizeRole>, resource: MutationBody['resource'], action: MutationBody['action']) {
  if (!role || !resource || !action) {
    return false;
  }

  if (['orders', 'customers', 'estateBatches', 'dispatches', 'estates', 'notifications'].includes(resource)) {
    return isAdminRole(role);
  }

  if (resource === 'runnerTasks') {
    return role === 'owner' || role === 'cofounder' || role === 'runner';
  }

  if (resource === 'riderAssignments') {
    return role === 'owner' || role === 'cofounder' || role === 'runner' || role === 'rider';
  }

  return false;
}

async function findUserIdByName(name: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !name.trim()) {
    return null;
  }

  const { data } = await supabase
    .from('users')
    .select('id, name')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();

  return data?.id ? String(data.id) : null;
}

async function upsertCustomerFromOrderLike(payload: Record<string, unknown>, orderGrandTotal: number) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error('Database not configured.');
  }

  const phone = toText(payload.phone);
  if (!phone) {
    return null;
  }

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, total_orders, lifetime_spend, repeat_orders')
    .eq('phone', phone)
    .maybeSingle();

  if (existingCustomer?.id) {
    await supabase
      .from('customers')
      .update({
        name: toText(payload.customerName),
        email: toText(payload.email),
        estate: toText(payload.estate),
        address: toText(payload.address),
        total_orders: toNumber(existingCustomer.total_orders) + 1,
        repeat_orders: toNumber(existingCustomer.repeat_orders) + 1,
        lifetime_spend: toNumber(existingCustomer.lifetime_spend) + orderGrandTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingCustomer.id);

    return String(existingCustomer.id);
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: toText(payload.customerName),
      phone,
      email: toText(payload.email),
      estate: toText(payload.estate),
      address: toText(payload.address),
      total_orders: 1,
      repeat_orders: 1,
      lifetime_spend: orderGrandTotal,
      notes: toText(payload.notes),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return String(data.id);
}

async function loadSnapshot(): Promise<SnapshotResponse> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error('Database not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const ordersResult = await selectOrdersWithCompatibility(supabase);
  const batchesResult = await selectEstateBatchesWithCompatibility(supabase);
  const riderAssignmentsResult = await selectRiderAssignmentsWithCompatibility(supabase);
  const customersResult = await selectTableWithColumnCompatibility(
    supabase,
    'customers',
    ['id', 'name', 'phone', 'email', 'estate', 'address', 'total_orders', 'lifetime_spend', 'repeat_orders', 'notes', 'created_at', 'updated_at'],
    { column: 'created_at', ascending: false }
  );
  const runnerTasksResult = await selectTableWithColumnCompatibility(
    supabase,
    'runner_tasks',
    [
      'id',
      'order_id',
      'order_number',
      'assigned_runner_id',
      'status',
      'market_day',
      'product_line',
      'estate',
      'shopping_list',
      'allocated_budget',
      'actual_spend',
      'unavailable_items',
      'suggested_substitutions',
      'receipt_images',
      'shopping_completed_at',
      'delivered_to_staging_at',
      'purchase_cost',
      'notes',
      'updated_at'
    ],
    { column: 'updated_at', ascending: false }
  );
  const dispatchesResult = await selectTableWithColumnCompatibility(
    supabase,
    'dispatches',
    ['id', 'order_id', 'status', 'assigned_rider_id', 'created_at', 'updated_at'],
    { column: 'created_at', ascending: false }
  );
  const estatesResult = await selectTableWithColumnCompatibility(
    supabase,
    'estates',
    ['id', 'name', 'code', 'delivery_zone', 'assigned_riders', 'number_of_orders', 'daily_deliveries', 'completed_deliveries', 'pending_deliveries', 'failed_deliveries', 'revenue_generated', 'created_at', 'updated_at'],
    { column: 'name', ascending: true }
  );
  const notificationsResult = await selectTableWithColumnCompatibility(
    supabase,
    'notifications',
    ['id', 'type', 'title', 'message', 'order_id', 'batch_id', 'is_read', 'created_at'],
    { column: 'created_at', ascending: false },
    100
  );
  const usersResult = await selectTableWithColumnCompatibility(
    supabase,
    'users',
    ['id', 'name'],
    { column: 'name', ascending: true }
  );

  const orderItemsResult = await supabase
    .from('order_items')
    .select('id, order_id, name, quantity, price')
    .order('created_at', { ascending: true });

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (orderItemsResult.error) throw new Error(orderItemsResult.error.message);
  const customersRows = resolveOptionalTableResult(customersResult, 'customers');
  const batchRows = resolveOptionalTableResult(batchesResult as any, 'estate_batches');
  const runnerTaskRows = resolveOptionalTableResult(runnerTasksResult, 'runner_tasks');
  const riderAssignmentRows = resolveOptionalTableResult(riderAssignmentsResult as any, 'rider_assignments');
  const dispatchRows = resolveOptionalTableResult(dispatchesResult, 'dispatches');
  const estateRows = resolveOptionalTableResult(estatesResult, 'estates');
  const notificationRows = resolveOptionalTableResult(notificationsResult, 'notifications');
  const userRows = resolveOptionalTableResult(usersResult as any, 'users');

  const userNameById = new Map(userRows.map((user: any) => [String(user.id), String(user.name ?? '')]));
  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const row of orderItemsResult.data ?? []) {
    const orderId = String(row.order_id ?? '');
    const current = itemsByOrderId.get(orderId) ?? [];
    current.push({
      id: String(row.id),
      name: String(row.name ?? ''),
      quantity: toNumber(row.quantity),
      price: toNumber(row.price)
    });
    itemsByOrderId.set(orderId, current);
  }

  const orders: OrderRecord[] = (ordersResult.data ?? []).map((row) => {
    const orderRow = row as any;
    const items = itemsByOrderId.get(String(orderRow.id)) ?? [];
    return {
      id: String(orderRow.id),
      orderNumber: String(orderRow.id),
      customerId: String(orderRow.customer_id ?? ''),
      customerName: String(orderRow.customer_name ?? ''),
      phone: String(orderRow.phone ?? ''),
      whatsapp: String(orderRow.whatsapp ?? ''),
      email: String(orderRow.email ?? ''),
      estate: String(orderRow.estate ?? ''),
      address: String(orderRow.address ?? ''),
      status: String(orderRow.status ?? 'New') as OrderRecord['status'],
      paymentStatus: String(orderRow.payment_status ?? 'Pending') as OrderRecord['paymentStatus'],
      marketDay: String(orderRow.market_day ?? 'Weekday') as OrderRecord['marketDay'],
      productLine: String(orderRow.product_line ?? 'Weekly Groceries') as OrderRecord['productLine'],
      assignedRunner: userNameById.get(String(orderRow.assigned_runner_id ?? '')) ?? '',
      shoppingBudget: toNumber(orderRow.shopping_budget),
      actualSpend: toNumber(orderRow.actual_spend),
      shoppingMargin: toNumber(orderRow.shopping_margin),
      runnerIncentive: toNumber(orderRow.runner_incentive),
      businessMargin: toNumber(orderRow.business_margin),
      items,
      quantity: items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
      subtotal: toNumber(orderRow.subtotal),
      serviceFee: toNumber(orderRow.service_fee),
      deliveryFee: toNumber(orderRow.delivery_fee),
      additionalCharges: toNumber(orderRow.additional_charges),
      grandTotal: toNumber(orderRow.grand_total),
      batchId: String(orderRow.batch_id ?? ''),
      assignedRider: userNameById.get(String(orderRow.assigned_rider_id ?? '')) ?? '',
      dispatchId: String(orderRow.dispatch_id ?? ''),
      purchaseCost: toNumber(orderRow.purchase_cost),
      deliveryBatchId: String(orderRow.delivery_batch_id ?? ''),
      customDelivery: Boolean(orderRow.custom_delivery),
      customDeliveryReason: String(orderRow.custom_delivery_reason ?? ''),
      customDeliveryRequestedDate: String(orderRow.custom_delivery_requested_date ?? ''),
      customDeliveryPremiumFee: toNumber(orderRow.custom_delivery_premium_fee),
      deliveryMargin: toNumber(orderRow.delivery_margin),
      receiptImages: toStringArray(orderRow.receipt_images),
      unavailableItems: toStringArray(orderRow.unavailable_items),
      suggestedSubstitutions: toStringArray(orderRow.suggested_substitutions),
      statusTimeline: Array.isArray(orderRow.status_timeline) ? orderRow.status_timeline : [],
      notes: String(orderRow.notes ?? ''),
      deliveryTimeMinutes: toNumber(orderRow.delivery_time_minutes),
      createdAt: String(orderRow.created_at ?? new Date().toISOString()),
      updatedAt: String(orderRow.updated_at ?? new Date().toISOString())
    };
  });

  const orderById = new Map(orders.map((order) => [order.id, order]));

  const customers: CustomerProfile[] = customersRows.map((row) => {
    const customerRow = row as any;
    return {
      id: String(customerRow.id),
      name: String(customerRow.name ?? ''),
      phone: String(customerRow.phone ?? ''),
      email: String(customerRow.email ?? ''),
      estate: String(customerRow.estate ?? ''),
      address: String(customerRow.address ?? ''),
      totalOrders: toNumber(customerRow.total_orders),
      lifetimeSpend: toNumber(customerRow.lifetime_spend),
      repeatOrders: toNumber(customerRow.repeat_orders),
      lastOrderDate: String(customerRow.updated_at ?? customerRow.created_at ?? new Date().toISOString()),
      notes: String(customerRow.notes ?? '')
    };
  });

  const estateBatches: EstateBatch[] = batchRows.map((row) => {
    const batchRow = row as any;
    return {
      id: String(batchRow.id),
      name: String(batchRow.batch_name ?? batchRow.name ?? batchRow.id ?? ''),
      estate: String(batchRow.estate ?? ''),
      estateCode: String(batchRow.estate_code ?? ''),
      deliveryZone: String(batchRow.delivery_zone ?? ''),
      orderIds: toStringArray(batchRow.order_ids),
      orders: toNumber(batchRow.order_count),
      totalValue: toNumber(batchRow.total_value),
      assignedRider: userNameById.get(String(batchRow.assigned_rider_id ?? '')) ?? '',
      status: String(batchRow.status ?? 'Pending') as EstateBatch['status'],
      createdAt: String(batchRow.created_at ?? new Date().toISOString()),
      updatedAt: String(batchRow.updated_at ?? new Date().toISOString())
    };
  });

  const runnerTasks: RunnerTask[] = runnerTaskRows.map((row) => {
    const taskRow = row as any;
    return {
      id: String(taskRow.id),
      orderId: String(taskRow.order_id ?? ''),
      orderNumber: String(taskRow.order_number ?? taskRow.order_id ?? ''),
      task: `Source items for ${String(taskRow.order_number ?? taskRow.order_id ?? '')}`,
      status: String(taskRow.status ?? 'Pending'),
      assignedTo: userNameById.get(String(taskRow.assigned_runner_id ?? '')) ?? '',
      marketDay: String(taskRow.market_day ?? 'Weekday') as RunnerTask['marketDay'],
      productLine: String(taskRow.product_line ?? 'Weekly Groceries') as RunnerTask['productLine'],
      estate: String(taskRow.estate ?? ''),
      shoppingList: toStringArray(taskRow.shopping_list),
      allocatedBudget: toNumber(taskRow.allocated_budget),
      actualSpend: toNumber(taskRow.actual_spend),
      unavailableItems: toStringArray(taskRow.unavailable_items),
      suggestedSubstitutions: toStringArray(taskRow.suggested_substitutions),
      receiptImages: toStringArray(taskRow.receipt_images),
      shoppingCompletedAt: String(taskRow.shopping_completed_at ?? ''),
      deliveredToStagingAt: String(taskRow.delivered_to_staging_at ?? ''),
      purchaseCost: toNumber(taskRow.purchase_cost),
      notes: String(taskRow.notes ?? ''),
      updatedAt: String(taskRow.updated_at ?? new Date().toISOString())
    };
  });

  const riderAssignments: RiderAssignment[] = riderAssignmentRows.map((row) => {
    const assignmentRow = row as any;
    const order = orderById.get(String(assignmentRow.order_id ?? ''));
    return {
      id: String(assignmentRow.id),
      orderId: String(assignmentRow.order_id ?? ''),
      orderNumber: order?.orderNumber ?? String(assignmentRow.order_id ?? ''),
      customerName: order?.customerName ?? '',
      phone: order?.phone ?? '',
      address: order?.address ?? '',
      estate: order?.estate ?? '',
      status: String(assignmentRow.status ?? 'Assigned') as RiderAssignment['status'],
      assignedRider: userNameById.get(String(assignmentRow.assigned_rider_id ?? '')) ?? '',
      proofUrl: String(assignmentRow.proof_url ?? ''),
      notes: String(assignmentRow.delivery_notes ?? ''),
      acceptedAt: String(assignmentRow.accepted_at ?? ''),
      pickedUpAt: String(assignmentRow.picked_up_at ?? ''),
      inTransitAt: String(assignmentRow.in_transit_at ?? ''),
      deliveredAt: String(assignmentRow.delivered_at ?? ''),
      completedAt: String(assignmentRow.completed_at ?? ''),
      updatedAt: String(assignmentRow.updated_at ?? new Date().toISOString())
    };
  });

  const dispatchesFromTable: DispatchRecord[] = dispatchRows.map((row) => {
    const dispatchRow = row as any;
    const order = orderById.get(String(dispatchRow.order_id ?? ''));
    return {
      id: String(dispatchRow.id),
      orderId: String(dispatchRow.order_id ?? ''),
      orderNumber: order?.orderNumber ?? String(dispatchRow.order_id ?? ''),
      customerName: order?.customerName ?? '',
      estate: order?.estate ?? '',
      status: String(dispatchRow.status ?? 'Unassigned') as DispatchRecord['status'],
      assignedRider: userNameById.get(String(dispatchRow.assigned_rider_id ?? '')) ?? '',
      createdAt: String(dispatchRow.created_at ?? new Date().toISOString()),
      updatedAt: String(dispatchRow.updated_at ?? new Date().toISOString())
    };
  });

  const syntheticDispatches: DispatchRecord[] = orders.map((order) => ({
    id: order.dispatchId || `virtual-${order.id}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    estate: order.estate,
    status: mapOrderStatusToDispatchStatus(order.status),
    assignedRider: order.assignedRider,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  }));

  const dispatches = dispatchesFromTable.length > 0 ? dispatchesFromTable : syntheticDispatches;

  const estates: EstateRecord[] = estateRows.map((row) => {
    const estateRow = row as any;
    return {
      id: String(estateRow.id),
      name: String(estateRow.name ?? ''),
      code: String(estateRow.code ?? ''),
      deliveryZone: String(estateRow.delivery_zone ?? ''),
      assignedRiders: toStringArray(estateRow.assigned_riders),
      numberOfOrders: toNumber(estateRow.number_of_orders),
      dailyDeliveries: toNumber(estateRow.daily_deliveries),
      completedDeliveries: toNumber(estateRow.completed_deliveries),
      pendingDeliveries: toNumber(estateRow.pending_deliveries),
      failedDeliveries: toNumber(estateRow.failed_deliveries),
      revenueGenerated: toNumber(estateRow.revenue_generated),
      createdAt: String(estateRow.created_at ?? new Date().toISOString()),
      updatedAt: String(estateRow.updated_at ?? new Date().toISOString())
    };
  });

  const notifications: NotificationRecord[] = notificationRows.map((row) => {
    const notificationRow = row as any;
    return {
      id: String(notificationRow.id),
      type: String(notificationRow.type ?? 'New Order') as NotificationRecord['type'],
      title: String(notificationRow.title ?? ''),
      message: String(notificationRow.message ?? ''),
      orderId: String(notificationRow.order_id ?? ''),
      batchId: String(notificationRow.batch_id ?? ''),
      read: Boolean(notificationRow.is_read),
      createdAt: String(notificationRow.created_at ?? new Date().toISOString())
    };
  });

  return {
    orders,
    customers,
    estateBatches,
    runnerTasks,
    riderAssignments,
    dispatches,
    estates,
    notifications
  };
}

export async function GET() {
  try {
    const snapshot = await loadSnapshot();
    const role = getRequestRole();
    const authName = getRequestName();
    return NextResponse.json(scopeSnapshot(snapshot, role, authName));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load OMS data.' },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MutationBody;
    const role = getRequestRole();
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
    }

    const resource = body.resource;
    const action = body.action;
    const id = body.id ?? '';
    const payload = body.payload ?? {};

    if (!resource || !action) {
      return NextResponse.json({ error: 'resource and action are required.' }, { status: 400 });
    }

    if (!canMutateResource(role, resource, action)) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }

    if (resource === 'orders' && action === 'create') {
      const parsedItems = toOrderItems(payload.items);
      const serviceFee = toNumber(payload.serviceFee);
      const deliveryFee = toNumber(payload.deliveryFee);
      const additionalCharges = toNumber(payload.additionalCharges);
      const subtotal = calculateSubtotalFromItems(parsedItems);
      const grandTotal = calculateGrandTotalFromParts(subtotal, serviceFee, deliveryFee, additionalCharges);
      const customerId = await upsertCustomerFromOrderLike(payload, grandTotal);
      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const assignedRunnerId = await findUserIdByName(toText(payload.assignedRunner));
      const orderId = toText(payload.id);
      const now = new Date().toISOString();

      const orderInsertPayload: Record<string, unknown> = {
        id: orderId,
        customer_id: customerId,
        customer_name: toText(payload.customerName),
        phone: toText(payload.phone),
        whatsapp: toText(payload.whatsapp),
        email: toText(payload.email),
        estate: toText(payload.estate),
        address: toText(payload.address),
        status: toText(payload.status) || 'New',
        payment_status: toText(payload.paymentStatus) || 'Pending',
        market_day: toText(payload.marketDay) || 'Weekday',
        product_line: toText(payload.productLine) || 'Weekly Groceries',
        assigned_runner_id: assignedRunnerId,
        shopping_budget: toNumber(payload.shoppingBudget),
        actual_spend: toNumber(payload.actualSpend),
        shopping_margin: toNumber(payload.shoppingMargin),
        runner_incentive: toNumber(payload.runnerIncentive),
        business_margin: toNumber(payload.businessMargin),
        subtotal,
        service_fee: serviceFee,
        delivery_fee: deliveryFee,
        additional_charges: additionalCharges,
        grand_total: grandTotal,
        batch_id: toUuidOrNull(payload.batchId),
        assigned_rider_id: assignedRiderId,
        dispatch_id: toUuidOrNull(payload.dispatchId),
        purchase_cost: toNumber(payload.purchaseCost),
        delivery_batch_id: toText(payload.deliveryBatchId),
        custom_delivery: Boolean(payload.customDelivery),
        custom_delivery_reason: toText(payload.customDeliveryReason),
        custom_delivery_requested_date: toText(payload.customDeliveryRequestedDate) || null,
        custom_delivery_premium_fee: toNumber(payload.customDeliveryPremiumFee),
        delivery_margin: toNumber(payload.deliveryMargin),
        receipt_images: toStringArray(payload.receiptImages),
        unavailable_items: toStringArray(payload.unavailableItems),
        suggested_substitutions: toStringArray(payload.suggestedSubstitutions),
        status_timeline: Array.isArray(payload.statusTimeline) ? payload.statusTimeline : [],
        notes: toText(payload.notes),
        delivery_time_minutes: toNumber(payload.deliveryTimeMinutes),
        created_at: toText(payload.createdAt) || now,
        updated_at: toText(payload.updatedAt) || now
      };

      const { error: orderError } = await insertOrderWithCompatibility(supabase, orderInsertPayload);

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 500 });
      }

      if (parsedItems.length > 0) {
        const { error: itemError } = await supabase.from('order_items').insert(parsedItems.map((item) => ({
          order_id: orderId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
          created_at: now,
          updated_at: now
        })));

        if (itemError) {
          return NextResponse.json({ error: itemError.message }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'orders' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Order id is required.' }, { status: 400 });
      }

      const updatePayload: Record<string, unknown> = {
        updated_at: toText(payload.updatedAt) || new Date().toISOString()
      };

      if ('status' in payload) updatePayload.status = toText(payload.status);
      if ('paymentStatus' in payload) updatePayload.payment_status = toText(payload.paymentStatus);
      if ('notes' in payload) updatePayload.notes = toText(payload.notes);
      if ('purchaseCost' in payload) updatePayload.purchase_cost = toNumber(payload.purchaseCost);
      if ('batchId' in payload) updatePayload.batch_id = toUuidOrNull(payload.batchId);
      if ('dispatchId' in payload) updatePayload.dispatch_id = toUuidOrNull(payload.dispatchId);
      if ('deliveryTimeMinutes' in payload) updatePayload.delivery_time_minutes = toNumber(payload.deliveryTimeMinutes);
      if ('marketDay' in payload) updatePayload.market_day = toText(payload.marketDay);
      if ('productLine' in payload) updatePayload.product_line = toText(payload.productLine);
      if ('shoppingBudget' in payload) updatePayload.shopping_budget = toNumber(payload.shoppingBudget);
      if ('actualSpend' in payload) updatePayload.actual_spend = toNumber(payload.actualSpend);
      if ('shoppingMargin' in payload) updatePayload.shopping_margin = toNumber(payload.shoppingMargin);
      if ('runnerIncentive' in payload) updatePayload.runner_incentive = toNumber(payload.runnerIncentive);
      if ('businessMargin' in payload) updatePayload.business_margin = toNumber(payload.businessMargin);
      if ('deliveryBatchId' in payload) updatePayload.delivery_batch_id = toText(payload.deliveryBatchId);
      if ('customDelivery' in payload) updatePayload.custom_delivery = Boolean(payload.customDelivery);
      if ('customDeliveryReason' in payload) updatePayload.custom_delivery_reason = toText(payload.customDeliveryReason);
      if ('customDeliveryRequestedDate' in payload) updatePayload.custom_delivery_requested_date = toText(payload.customDeliveryRequestedDate) || null;
      if ('customDeliveryPremiumFee' in payload) updatePayload.custom_delivery_premium_fee = toNumber(payload.customDeliveryPremiumFee);
      if ('deliveryMargin' in payload) updatePayload.delivery_margin = toNumber(payload.deliveryMargin);
      if ('receiptImages' in payload) updatePayload.receipt_images = toStringArray(payload.receiptImages);
      if ('unavailableItems' in payload) updatePayload.unavailable_items = toStringArray(payload.unavailableItems);
      if ('suggestedSubstitutions' in payload) updatePayload.suggested_substitutions = toStringArray(payload.suggestedSubstitutions);
      if ('statusTimeline' in payload) updatePayload.status_timeline = Array.isArray(payload.statusTimeline) ? payload.statusTimeline : [];

      if ('assignedRider' in payload) {
        updatePayload.assigned_rider_id = await findUserIdByName(toText(payload.assignedRider));
      }
      if ('assignedRunner' in payload) {
        updatePayload.assigned_runner_id = await findUserIdByName(toText(payload.assignedRunner));
      }

      const needsTotalRecalculation =
        'items' in payload ||
        'serviceFee' in payload ||
        'deliveryFee' in payload ||
        'additionalCharges' in payload ||
        'subtotal' in payload ||
        'grandTotal' in payload;

      if (needsTotalRecalculation) {
        const { data: existingOrder, error: existingOrderError } = await supabase
          .from('orders')
          .select('subtotal, service_fee, delivery_fee, additional_charges')
          .eq('id', id)
          .maybeSingle();

        if (existingOrderError) {
          return NextResponse.json({ error: existingOrderError.message }, { status: 500 });
        }

        const itemsForTotals = 'items' in payload ? toOrderItems(payload.items) : null;
        const subtotal = itemsForTotals
          ? calculateSubtotalFromItems(itemsForTotals)
          : ('subtotal' in payload ? toNumber(payload.subtotal) : toNumber(existingOrder?.subtotal));

        const serviceFee = 'serviceFee' in payload ? toNumber(payload.serviceFee) : toNumber(existingOrder?.service_fee);
        const deliveryFee = 'deliveryFee' in payload ? toNumber(payload.deliveryFee) : toNumber(existingOrder?.delivery_fee);
        const additionalCharges = 'additionalCharges' in payload
          ? toNumber(payload.additionalCharges)
          : toNumber(existingOrder?.additional_charges);

        updatePayload.subtotal = subtotal;
        updatePayload.service_fee = serviceFee;
        updatePayload.delivery_fee = deliveryFee;
        updatePayload.additional_charges = additionalCharges;
        updatePayload.grand_total = calculateGrandTotalFromParts(subtotal, serviceFee, deliveryFee, additionalCharges);
      }

      const { error: updateError } = await updateOrderWithCompatibility(supabase, updatePayload, id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if ('items' in payload) {
        const now = new Date().toISOString();
        const items = toOrderItems(payload.items);
        const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', id);
        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        if (items.length > 0) {
          const { error: insertError } = await supabase.from('order_items').insert(
            items.map((item) => ({
              order_id: id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
              created_at: now,
              updated_at: now
            }))
          );

          if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'orders' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Order id is required.' }, { status: 400 });
      }

      const { error: deleteError } = await supabase.from('orders').delete().eq('id', id);
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'customers' && action === 'create') {
      const now = new Date().toISOString();
      const { error } = await supabase.from('customers').insert({
        name: toText(payload.name),
        phone: toText(payload.phone),
        email: toText(payload.email),
        estate: toText(payload.estate),
        address: toText(payload.address),
        total_orders: toNumber(payload.totalOrders),
        lifetime_spend: toNumber(payload.lifetimeSpend),
        repeat_orders: toNumber(payload.repeatOrders),
        notes: toText(payload.notes),
        created_at: now,
        updated_at: now
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'customers' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Customer id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'runnerTasks' && action === 'create') {
      const assignedRunnerId = await findUserIdByName(toText(payload.assignedTo));
      const now = new Date().toISOString();
      const { error } = await supabase.from('runner_tasks').insert({
        id: toUuidOrNull(payload.id) || undefined,
        order_id: toText(payload.orderId),
        order_number: toText(payload.orderNumber),
        assigned_runner_id: assignedRunnerId,
        status: toText(payload.status) || 'Pending',
        market_day: toText(payload.marketDay) || 'Weekday',
        product_line: toText(payload.productLine) || 'Weekly Groceries',
        estate: toText(payload.estate),
        shopping_list: toStringArray(payload.shoppingList),
        allocated_budget: toNumber(payload.allocatedBudget),
        actual_spend: toNumber(payload.actualSpend),
        unavailable_items: toStringArray(payload.unavailableItems),
        suggested_substitutions: toStringArray(payload.suggestedSubstitutions),
        receipt_images: toStringArray(payload.receiptImages),
        shopping_completed_at: toText(payload.shoppingCompletedAt) || null,
        delivered_to_staging_at: toText(payload.deliveredToStagingAt) || null,
        purchase_cost: toNumber(payload.purchaseCost),
        notes: toText(payload.notes),
        created_at: now,
        updated_at: now
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'runnerTasks' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Runner task id is required.' }, { status: 400 });
      }

      const assignedRunnerId = await findUserIdByName(toText(payload.assignedTo));
      const { error } = await supabase
        .from('runner_tasks')
        .update({
          order_number: toText(payload.orderNumber),
          status: toText(payload.status),
          market_day: toText(payload.marketDay),
          product_line: toText(payload.productLine),
          estate: toText(payload.estate),
          shopping_list: toStringArray(payload.shoppingList),
          allocated_budget: toNumber(payload.allocatedBudget),
          actual_spend: toNumber(payload.actualSpend),
          unavailable_items: toStringArray(payload.unavailableItems),
          suggested_substitutions: toStringArray(payload.suggestedSubstitutions),
          receipt_images: toStringArray(payload.receiptImages),
          shopping_completed_at: toText(payload.shoppingCompletedAt) || null,
          delivered_to_staging_at: toText(payload.deliveredToStagingAt) || null,
          purchase_cost: toNumber(payload.purchaseCost),
          notes: toText(payload.notes),
          assigned_runner_id: assignedRunnerId,
          updated_at: toText(payload.updatedAt) || new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'runnerTasks' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Runner task id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('runner_tasks').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'riderAssignments' && action === 'create') {
      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const { error } = await insertRiderAssignmentWithCompatibility(supabase, {
        id: toUuidOrNull(payload.id) || undefined,
        order_id: toText(payload.orderId),
        assigned_rider_id: assignedRiderId,
        status: toText(payload.status) || 'Assigned',
        proof_url: toText(payload.proofUrl),
        delivery_notes: toText(payload.notes),
        accepted_at: toText(payload.acceptedAt) || null,
        picked_up_at: toText(payload.pickedUpAt) || null,
        in_transit_at: toText(payload.inTransitAt) || null,
        delivered_at: toText(payload.deliveredAt) || null,
        completed_at: toText(payload.completedAt) || null,
        updated_at: toText(payload.updatedAt) || new Date().toISOString()
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'riderAssignments' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Rider assignment id is required.' }, { status: 400 });
      }

      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const { error } = await updateRiderAssignmentWithCompatibility(
        supabase,
        {
          status: toText(payload.status),
          delivery_notes: toText(payload.notes),
          proof_url: toText(payload.proofUrl),
          assigned_rider_id: assignedRiderId,
          accepted_at: toText(payload.acceptedAt) || null,
          picked_up_at: toText(payload.pickedUpAt) || null,
          in_transit_at: toText(payload.inTransitAt) || null,
          delivered_at: toText(payload.deliveredAt) || null,
          completed_at: toText(payload.completedAt) || null,
          updated_at: toText(payload.updatedAt) || new Date().toISOString()
        },
        'id',
        id
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'riderAssignments' && action === 'updateByOrderId') {
      if (!id) {
        return NextResponse.json({ error: 'Order id is required for rider assignment update.' }, { status: 400 });
      }

      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const { error } = await updateRiderAssignmentWithCompatibility(
        supabase,
        {
          status: toText(payload.status),
          delivery_notes: toText(payload.notes),
          proof_url: toText(payload.proofUrl),
          assigned_rider_id: assignedRiderId,
          accepted_at: toText(payload.acceptedAt) || null,
          picked_up_at: toText(payload.pickedUpAt) || null,
          in_transit_at: toText(payload.inTransitAt) || null,
          delivered_at: toText(payload.deliveredAt) || null,
          completed_at: toText(payload.completedAt) || null,
          updated_at: toText(payload.updatedAt) || new Date().toISOString()
        },
        'order_id',
        id
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'riderAssignments' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Rider assignment id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('rider_assignments').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'estateBatches' && action === 'create') {
      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const now = new Date().toISOString();
      const createPayload = {
        id: toUuidOrNull(payload.id) || undefined,
        batch_name: toText(payload.name),
        estate: toText(payload.estate),
        estate_code: toText(payload.estateCode),
        delivery_zone: toText(payload.deliveryZone),
        order_count: toNumber(payload.orders),
        total_value: toNumber(payload.totalValue),
        assigned_rider_id: assignedRiderId,
        order_ids: toStringArray(payload.orderIds),
        status: toText(payload.status) || 'Pending',
        created_at: now,
        updated_at: now
      };

      let { error } = await supabase.from('estate_batches').insert(createPayload);
      if (error && getMissingEstateBatchColumn(error) === 'batch_name') {
        const { batch_name, ...legacyCreatePayload } = createPayload;
        void batch_name;
        ({ error } = await supabase.from('estate_batches').insert({ ...legacyCreatePayload, name: toText(payload.name) }));
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'estateBatches' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Batch id is required.' }, { status: 400 });
      }

      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const updatePayload = {
        batch_name: toText(payload.name),
        estate: toText(payload.estate),
        estate_code: toText(payload.estateCode),
        delivery_zone: toText(payload.deliveryZone),
        order_count: toNumber(payload.orders),
        total_value: toNumber(payload.totalValue),
        status: toText(payload.status),
        assigned_rider_id: assignedRiderId,
        order_ids: toStringArray(payload.orderIds),
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('estate_batches')
        .update(updatePayload)
        .eq('id', id);

      if (error && getMissingEstateBatchColumn(error) === 'batch_name') {
        const { batch_name, ...legacyUpdatePayload } = updatePayload;
        void batch_name;
        ({ error } = await supabase
          .from('estate_batches')
          .update({ ...legacyUpdatePayload, name: toText(payload.name) })
          .eq('id', id));
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'estateBatches' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Batch id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('estate_batches').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'dispatches' && action === 'create') {
      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      const now = new Date().toISOString();
      let { error } = await supabase.from('dispatches').insert({
        id: toUuidOrNull(payload.id) || undefined,
        order_id: toText(payload.orderId),
        order_number: toText(payload.orderNumber),
        customer_name: toText(payload.customerName),
        estate: toText(payload.estate),
        status: toText(payload.status) || 'Unassigned',
        assigned_rider_id: assignedRiderId,
        created_at: toText(payload.createdAt) || now,
        updated_at: toText(payload.updatedAt) || now
      });

      if (error && isMissingTableError(error, 'dispatches')) {
        const orderId = toText(payload.orderId);
        if (!orderId) {
          return NextResponse.json({ error: 'Order id is required when dispatch table is unavailable.' }, { status: 400 });
        }

        const fallbackUpdate = buildDispatchFallbackUpdate(
          toText(payload.status) || 'Unassigned',
          toText(payload.updatedAt) || now,
          assignedRiderId
        );

        const fallbackResult = await updateOrderWithCompatibility(supabase, fallbackUpdate, orderId);
        error = fallbackResult.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'dispatches' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Dispatch id is required.' }, { status: 400 });
      }

      const assignedRiderId = await findUserIdByName(toText(payload.assignedRider));
      let { error } = await supabase
        .from('dispatches')
        .update({
          status: toText(payload.status),
          assigned_rider_id: assignedRiderId,
          updated_at: toText(payload.updatedAt) || new Date().toISOString()
        })
        .eq('id', id);

      if (error && isMissingTableError(error, 'dispatches')) {
        const orderId = toText(payload.orderId);
        if (!orderId) {
          return NextResponse.json({ error: 'Order id is required when dispatch table is unavailable.' }, { status: 400 });
        }

        const fallbackUpdate = buildDispatchFallbackUpdate(
          toText(payload.status) || 'Unassigned',
          toText(payload.updatedAt) || new Date().toISOString(),
          assignedRiderId
        );

        const fallbackResult = await updateOrderWithCompatibility(supabase, fallbackUpdate, orderId);
        error = fallbackResult.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'dispatches' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Dispatch id is required.' }, { status: 400 });
      }

      let { error } = await supabase.from('dispatches').delete().eq('id', id);
      if (error && isMissingTableError(error, 'dispatches')) {
        error = null;
      }
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'estates' && action === 'create') {
      const now = new Date().toISOString();
      const { error } = await supabase.from('estates').insert({
        id: toUuidOrNull(payload.id) || undefined,
        name: toText(payload.name),
        code: toText(payload.code),
        delivery_zone: toText(payload.deliveryZone),
        assigned_riders: toStringArray(payload.assignedRiders),
        number_of_orders: toNumber(payload.numberOfOrders),
        daily_deliveries: toNumber(payload.dailyDeliveries),
        completed_deliveries: toNumber(payload.completedDeliveries),
        pending_deliveries: toNumber(payload.pendingDeliveries),
        failed_deliveries: toNumber(payload.failedDeliveries),
        revenue_generated: toNumber(payload.revenueGenerated),
        created_at: now,
        updated_at: now
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'estates' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Estate id is required.' }, { status: 400 });
      }

      const { error } = await supabase
        .from('estates')
        .update({
          name: toText(payload.name),
          code: toText(payload.code),
          delivery_zone: toText(payload.deliveryZone),
          assigned_riders: toStringArray(payload.assignedRiders),
          number_of_orders: toNumber(payload.numberOfOrders),
          daily_deliveries: toNumber(payload.dailyDeliveries),
          completed_deliveries: toNumber(payload.completedDeliveries),
          pending_deliveries: toNumber(payload.pendingDeliveries),
          failed_deliveries: toNumber(payload.failedDeliveries),
          revenue_generated: toNumber(payload.revenueGenerated),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'estates' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Estate id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('estates').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'notifications' && action === 'create') {
      const { error } = await supabase.from('notifications').insert({
        id: toUuidOrNull(payload.id) || undefined,
        type: toText(payload.type),
        title: toText(payload.title),
        message: toText(payload.message),
        order_id: toText(payload.orderId) || null,
        batch_id: toUuidOrNull(payload.batchId),
        is_read: Boolean(payload.read),
        created_at: toText(payload.createdAt) || new Date().toISOString()
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (resource === 'notifications' && action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 });
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          type: toText(payload.type) || undefined,
          title: toText(payload.title) || undefined,
          message: toText(payload.message) || undefined,
          is_read: 'read' in payload ? Boolean(payload.read) : undefined
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'notifications' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported mutation request.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process mutation.' },
      { status: 500 }
    );
  }
}

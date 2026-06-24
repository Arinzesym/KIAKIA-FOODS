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
  const allowedOrderIds = new Set(riderAssignments.map((assignment) => assignment.orderId));

  return {
    orders: snapshot.orders.filter((order) => allowedOrderIds.has(order.id)),
    customers: [],
    estateBatches: snapshot.estateBatches.filter((batch) => matchesAssignedName(batch.assignedRider, role, authName)),
    runnerTasks: snapshot.runnerTasks,
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

  if (['orders', 'customers', 'runnerTasks', 'estateBatches', 'dispatches', 'estates', 'notifications'].includes(resource)) {
    return isAdminRole(role);
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

  const [
    ordersResult,
    orderItemsResult,
    customersResult,
    batchesResult,
    runnerTasksResult,
    riderAssignmentsResult,
    dispatchesResult,
    estatesResult,
    notificationsResult,
    usersResult
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, customer_id, customer_name, phone, whatsapp, email, estate, address, status, payment_status, subtotal, service_fee, delivery_fee, additional_charges, grand_total, batch_id, assigned_rider_id, dispatch_id, purchase_cost, notes, delivery_time_minutes, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('order_items')
      .select('id, order_id, name, quantity, price')
      .order('created_at', { ascending: true }),
    supabase
      .from('customers')
      .select('id, name, phone, email, estate, address, total_orders, lifetime_spend, repeat_orders, notes, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('estate_batches')
      .select('id, name, estate, estate_code, delivery_zone, order_count, total_value, assigned_rider_id, order_ids, status, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('runner_tasks')
      .select('id, order_id, assigned_runner_id, status, purchase_cost, notes, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('rider_assignments')
      .select('id, order_id, assigned_rider_id, status, proof_url, delivery_notes, accepted_at, picked_up_at, in_transit_at, delivered_at, completed_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('dispatches')
      .select('id, order_id, status, assigned_rider_id, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('estates')
      .select('id, name, code, delivery_zone, assigned_riders, number_of_orders, daily_deliveries, completed_deliveries, pending_deliveries, failed_deliveries, revenue_generated, created_at, updated_at')
      .order('name', { ascending: true }),
    supabase
      .from('notifications')
      .select('id, type, title, message, order_id, batch_id, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('users')
      .select('id, name')
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (orderItemsResult.error) throw new Error(orderItemsResult.error.message);
  if (customersResult.error) throw new Error(customersResult.error.message);
  if (batchesResult.error) throw new Error(batchesResult.error.message);
  if (runnerTasksResult.error) throw new Error(runnerTasksResult.error.message);
  if (riderAssignmentsResult.error) throw new Error(riderAssignmentsResult.error.message);
  if (dispatchesResult.error) throw new Error(dispatchesResult.error.message);
  if (estatesResult.error) throw new Error(estatesResult.error.message);
  if (notificationsResult.error) throw new Error(notificationsResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const userNameById = new Map((usersResult.data ?? []).map((user) => [String(user.id), String(user.name ?? '')]));
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
    const items = itemsByOrderId.get(String(row.id)) ?? [];
    return {
      id: String(row.id),
      orderNumber: String(row.id),
      customerId: String(row.customer_id ?? ''),
      customerName: String(row.customer_name ?? ''),
      phone: String(row.phone ?? ''),
      whatsapp: String(row.whatsapp ?? ''),
      email: String(row.email ?? ''),
      estate: String(row.estate ?? ''),
      address: String(row.address ?? ''),
      status: String(row.status ?? 'New') as OrderRecord['status'],
      paymentStatus: String(row.payment_status ?? 'Pending') as OrderRecord['paymentStatus'],
      items,
      quantity: items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
      subtotal: toNumber(row.subtotal),
      serviceFee: toNumber(row.service_fee),
      deliveryFee: toNumber(row.delivery_fee),
      additionalCharges: toNumber(row.additional_charges),
      grandTotal: toNumber(row.grand_total),
      batchId: String(row.batch_id ?? ''),
      assignedRider: userNameById.get(String(row.assigned_rider_id ?? '')) ?? '',
      dispatchId: String(row.dispatch_id ?? ''),
      purchaseCost: toNumber(row.purchase_cost),
      notes: String(row.notes ?? ''),
      deliveryTimeMinutes: toNumber(row.delivery_time_minutes),
      createdAt: String(row.created_at ?? new Date().toISOString()),
      updatedAt: String(row.updated_at ?? new Date().toISOString())
    };
  });

  const orderById = new Map(orders.map((order) => [order.id, order]));

  const customers: CustomerProfile[] = (customersResult.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    estate: String(row.estate ?? ''),
    address: String(row.address ?? ''),
    totalOrders: toNumber(row.total_orders),
    lifetimeSpend: toNumber(row.lifetime_spend),
    repeatOrders: toNumber(row.repeat_orders),
    lastOrderDate: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    notes: String(row.notes ?? '')
  }));

  const estateBatches: EstateBatch[] = (batchesResult.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? row.id ?? ''),
    estate: String(row.estate ?? ''),
    estateCode: String(row.estate_code ?? ''),
    deliveryZone: String(row.delivery_zone ?? ''),
    orderIds: toStringArray(row.order_ids),
    orders: toNumber(row.order_count),
    totalValue: toNumber(row.total_value),
    assignedRider: userNameById.get(String(row.assigned_rider_id ?? '')) ?? '',
    status: String(row.status ?? 'Pending') as EstateBatch['status'],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString())
  }));

  const runnerTasks: RunnerTask[] = (runnerTasksResult.data ?? []).map((row) => ({
    id: String(row.id),
    orderId: String(row.order_id ?? ''),
    task: `Source items for ${String(row.order_id ?? '')}`,
    status: String(row.status ?? 'Pending'),
    assignedTo: userNameById.get(String(row.assigned_runner_id ?? '')) ?? '',
    purchaseCost: toNumber(row.purchase_cost),
    notes: String(row.notes ?? ''),
    updatedAt: String(row.updated_at ?? new Date().toISOString())
  }));

  const riderAssignments: RiderAssignment[] = (riderAssignmentsResult.data ?? []).map((row) => {
    const order = orderById.get(String(row.order_id ?? ''));
    return {
      id: String(row.id),
      orderId: String(row.order_id ?? ''),
      orderNumber: order?.orderNumber ?? String(row.order_id ?? ''),
      customerName: order?.customerName ?? '',
      phone: order?.phone ?? '',
      address: order?.address ?? '',
      estate: order?.estate ?? '',
      status: String(row.status ?? 'Assigned') as RiderAssignment['status'],
      assignedRider: userNameById.get(String(row.assigned_rider_id ?? '')) ?? '',
      proofUrl: String(row.proof_url ?? ''),
      notes: String(row.delivery_notes ?? ''),
      acceptedAt: String(row.accepted_at ?? ''),
      pickedUpAt: String(row.picked_up_at ?? ''),
      inTransitAt: String(row.in_transit_at ?? ''),
      deliveredAt: String(row.delivered_at ?? ''),
      completedAt: String(row.completed_at ?? ''),
      updatedAt: String(row.updated_at ?? new Date().toISOString())
    };
  });

  const dispatches: DispatchRecord[] = (dispatchesResult.data ?? []).map((row) => {
    const order = orderById.get(String(row.order_id ?? ''));
    return {
      id: String(row.id),
      orderId: String(row.order_id ?? ''),
      orderNumber: order?.orderNumber ?? String(row.order_id ?? ''),
      customerName: order?.customerName ?? '',
      estate: order?.estate ?? '',
      status: String(row.status ?? 'Unassigned') as DispatchRecord['status'],
      assignedRider: userNameById.get(String(row.assigned_rider_id ?? '')) ?? '',
      createdAt: String(row.created_at ?? new Date().toISOString()),
      updatedAt: String(row.updated_at ?? new Date().toISOString())
    };
  });

  const estates: EstateRecord[] = (estatesResult.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    code: String(row.code ?? ''),
    deliveryZone: String(row.delivery_zone ?? ''),
    assignedRiders: toStringArray(row.assigned_riders),
    numberOfOrders: toNumber(row.number_of_orders),
    dailyDeliveries: toNumber(row.daily_deliveries),
    completedDeliveries: toNumber(row.completed_deliveries),
    pendingDeliveries: toNumber(row.pending_deliveries),
    failedDeliveries: toNumber(row.failed_deliveries),
    revenueGenerated: toNumber(row.revenue_generated),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString())
  }));

  const notifications: NotificationRecord[] = (notificationsResult.data ?? []).map((row) => ({
    id: String(row.id),
    type: String(row.type ?? 'New Order') as NotificationRecord['type'],
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    orderId: String(row.order_id ?? ''),
    batchId: String(row.batch_id ?? ''),
    read: Boolean(row.is_read),
    createdAt: String(row.created_at ?? new Date().toISOString())
  }));

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
      const orderId = toText(payload.id);
      const now = new Date().toISOString();

      const { error: orderError } = await supabase.from('orders').insert({
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
        subtotal,
        service_fee: serviceFee,
        delivery_fee: deliveryFee,
        additional_charges: additionalCharges,
        grand_total: grandTotal,
        batch_id: toText(payload.batchId) || null,
        assigned_rider_id: assignedRiderId,
        dispatch_id: toText(payload.dispatchId) || null,
        purchase_cost: toNumber(payload.purchaseCost),
        notes: toText(payload.notes),
        delivery_time_minutes: toNumber(payload.deliveryTimeMinutes),
        created_at: toText(payload.createdAt) || now,
        updated_at: toText(payload.updatedAt) || now
      });

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
      if ('batchId' in payload) updatePayload.batch_id = toText(payload.batchId) || null;
      if ('dispatchId' in payload) updatePayload.dispatch_id = toText(payload.dispatchId) || null;
      if ('deliveryTimeMinutes' in payload) updatePayload.delivery_time_minutes = toNumber(payload.deliveryTimeMinutes);

      if ('assignedRider' in payload) {
        updatePayload.assigned_rider_id = await findUserIdByName(toText(payload.assignedRider));
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

      const { error: updateError } = await supabase.from('orders').update(updatePayload).eq('id', id);
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
        id: toText(payload.id) || undefined,
        order_id: toText(payload.orderId),
        assigned_runner_id: assignedRunnerId,
        status: toText(payload.status) || 'Pending',
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
          status: toText(payload.status),
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
      const { error } = await supabase.from('rider_assignments').insert({
        id: toText(payload.id) || undefined,
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
      const { error } = await supabase
        .from('rider_assignments')
        .update({
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
        })
        .eq('id', id);

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
      const { error } = await supabase
        .from('rider_assignments')
        .update({
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
        })
        .eq('order_id', id);

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
      const { error } = await supabase.from('estate_batches').insert({
        id: toText(payload.id) || undefined,
        name: toText(payload.name),
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
      });

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
      const { error } = await supabase
        .from('estate_batches')
        .update({
          name: toText(payload.name),
          estate: toText(payload.estate),
          estate_code: toText(payload.estateCode),
          delivery_zone: toText(payload.deliveryZone),
          order_count: toNumber(payload.orders),
          total_value: toNumber(payload.totalValue),
          status: toText(payload.status),
          assigned_rider_id: assignedRiderId,
          order_ids: toStringArray(payload.orderIds),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

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
      const { error } = await supabase.from('dispatches').insert({
        id: toText(payload.id) || undefined,
        order_id: toText(payload.orderId),
        status: toText(payload.status) || 'Unassigned',
        assigned_rider_id: assignedRiderId,
        created_at: toText(payload.createdAt) || now,
        updated_at: toText(payload.updatedAt) || now
      });

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
      const { error } = await supabase
        .from('dispatches')
        .update({
          status: toText(payload.status),
          assigned_rider_id: assignedRiderId,
          updated_at: toText(payload.updatedAt) || new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'dispatches' && action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Dispatch id is required.' }, { status: 400 });
      }

      const { error } = await supabase.from('dispatches').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (resource === 'estates' && action === 'create') {
      const now = new Date().toISOString();
      const { error } = await supabase.from('estates').insert({
        id: toText(payload.id) || undefined,
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
        id: toText(payload.id) || undefined,
        type: toText(payload.type),
        title: toText(payload.title),
        message: toText(payload.message),
        order_id: toText(payload.orderId) || null,
        batch_id: toText(payload.batchId) || null,
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOMSStore } from '@/lib/StoreContext';
import type { DispatchStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { calculateShoppingBudgetMetrics } from '@/lib/marginEngine';
import { loadBusinessSettings } from '@/lib/businessSettings';

type DeliveryPortalProps = {
  heading: string;
  roleLabel: 'Runner' | 'Rider';
};

function getCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return '';
  }

  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
  return value ? decodeURIComponent(value) : '';
}

function matchesDeliveryAssignment(assignedRider: string, roleLabel: string, authName: string) {
  const normalizedAssignee = assignedRider.trim().toLowerCase();
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

function mapRunnerTaskStatusToDispatchStatus(status: string): DispatchStatus {
  if (status === 'In Progress') return 'Picked Up';
  if (status === 'Completed') return 'Completed';
  if (status === 'Cancelled') return 'Failed';
  return 'Assigned';
}

function normalizePhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

function buildGoogleMapsUrl(address: string, estate: string) {
  const query = encodeURIComponent(`${address}, ${estate}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function getRunnerStage(status: string) {
  if (status === 'At Staging') return 4;
  if (status === 'Completed') return 3;
  if (status === 'In Progress') return 2;
  return 1;
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1280;
  const ratio = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    return '';
  }

  context.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

const statusButtons: Array<{ label: string; status: DispatchStatus }> = [
  { label: 'Accept', status: 'Assigned' },
  { label: 'Mark Picked Up', status: 'Picked Up' },
  { label: 'Mark In Transit', status: 'In Transit' },
  { label: 'Mark Delivered', status: 'Delivered' },
  { label: 'Complete', status: 'Completed' }
];

export function DeliveryPortal({ heading, roleLabel }: DeliveryPortalProps) {
  const { riderAssignments, runnerTasks, orders, updateDispatchStatus, dispatches, createNotification, updateRunnerTask, updateOrder } = useOMSStore();
  const [authName, setAuthName] = useState('');
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [unavailableItems, setUnavailableItems] = useState<Record<string, string>>({});
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const [actualSpendMap, setActualSpendMap] = useState<Record<string, string>>({});
  const [uploadingReceiptTaskId, setUploadingReceiptTaskId] = useState<string | null>(null);
  const settings = loadBusinessSettings();

  useEffect(() => {
    setAuthName(getCookieValue('auth-name'));
  }, []);

  const visibleAssignments = useMemo(
    () => riderAssignments.filter((assignment) => matchesDeliveryAssignment(assignment.assignedRider, roleLabel, authName)),
    [authName, riderAssignments, roleLabel]
  );

  const fallbackAssignments = useMemo(() => {
    const matchedTasks = runnerTasks.filter((task) => matchesDeliveryAssignment(task.assignedTo, roleLabel, authName));
    return matchedTasks.map((task) => {
      const order = orders.find((item) => item.id === task.orderId);
      return {
        id: `task-${task.id}`,
        orderId: task.orderId,
        orderNumber: order?.orderNumber ?? task.orderId,
        customerName: order?.customerName ?? 'Customer',
        phone: order?.phone ?? '',
        address: order?.address ?? '',
        estate: order?.estate ?? '',
        status: mapRunnerTaskStatusToDispatchStatus(task.status),
        assignedRider: task.assignedTo,
        proofUrl: '',
        notes: task.notes,
        acceptedAt: '',
        pickedUpAt: '',
        inTransitAt: '',
        deliveredAt: '',
        completedAt: '',
        updatedAt: task.updatedAt
      };
    });
  }, [authName, orders, roleLabel, runnerTasks]);

  const assignmentsToRender = visibleAssignments.length > 0 ? visibleAssignments : fallbackAssignments;

  const visibleRunnerTasks = useMemo(
    () => runnerTasks.filter((task) => matchesDeliveryAssignment(task.assignedTo, roleLabel, authName)),
    [authName, roleLabel, runnerTasks]
  );

  const deliveriesToday = useMemo(() => {
    const today = new Date().toDateString();
    return assignmentsToRender.filter((assignment) => {
      const order = orders.find((item) => item.id === assignment.orderId);
      return order ? new Date(order.createdAt).toDateString() === today : false;
    });
  }, [assignmentsToRender, orders]);

  const pendingDeliveries = assignmentsToRender.filter((assignment) => !['Completed', 'Failed'].includes(assignment.status)).length;
  const completedDeliveries = assignmentsToRender.filter((assignment) => assignment.status === 'Completed').length;

  const revenueDelivered = assignmentsToRender
    .filter((assignment) => assignment.status === 'Completed')
    .reduce((sum, assignment) => {
      const order = orders.find((item) => item.id === assignment.orderId);
      return sum + (order?.grandTotal ?? 0);
    }, 0);

  const successRate = assignmentsToRender.length === 0 ? 0 : Math.round((completedDeliveries / assignmentsToRender.length) * 100);

  const applyRunnerUpdates = (taskId: string, status: string) => {
    const task = runnerTasks.find((item) => item.id === taskId);
    if (!task) {
      setMessage('Runner task not found.');
      return;
    }

    const receiptUrl = (receiptUrls[taskId] || '').trim();
    const unavailable = (unavailableItems[taskId] || '').split(',').map((item) => item.trim()).filter(Boolean);
    const substitutes = (substitutions[taskId] || '').split(',').map((item) => item.trim()).filter(Boolean);
    const actualSpendInput = Number(actualSpendMap[taskId] ?? task.actualSpend ?? task.purchaseCost ?? 0);
    const metrics = calculateShoppingBudgetMetrics(task.allocatedBudget ?? actualSpendInput, actualSpendInput, settings.runnerBonusPercentage);
    const now = new Date().toISOString();

    updateRunnerTask(taskId, {
      status,
      actualSpend: metrics.actualSpend,
      purchaseCost: metrics.actualSpend,
      unavailableItems: unavailable,
      suggestedSubstitutions: substitutes,
      receiptImages: receiptUrl ? [receiptUrl] : task.receiptImages,
      shoppingCompletedAt: status === 'Completed' ? now : task.shoppingCompletedAt,
      deliveredToStagingAt: status === 'At Staging' ? now : task.deliveredToStagingAt,
      updatedAt: now,
      notes: localNotes[taskId] ?? task.notes
    });

    updateOrder(task.orderId, {
      actualSpend: metrics.actualSpend,
      shoppingMargin: metrics.shoppingMargin,
      runnerIncentive: metrics.runnerBonus,
      businessMargin: metrics.businessMargin,
      receiptImages: receiptUrl ? [receiptUrl] : undefined,
      unavailableItems: unavailable,
      suggestedSubstitutions: substitutes,
      status: status === 'Completed' ? 'AT_STAGING' : 'SHOPPING',
      updatedAt: now
    });

    createNotification('Rider Assignment', 'Runner update', `${task.orderId} updated by runner (${status}).`, { orderId: task.orderId });
    setMessage(`Runner task updated to ${status}.`);
    window.setTimeout(() => setMessage(''), 3200);
  };

  const handleReceiptFileChange = async (taskId: string, file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingReceiptTaskId(taskId);
    try {
      const compressedImage = await compressImage(file);
      if (compressedImage) {
        setReceiptUrls((prev) => ({ ...prev, [taskId]: compressedImage }));
        setMessage('Receipt prepared and compressed for upload.');
        window.setTimeout(() => setMessage(''), 3200);
      }
    } finally {
      setUploadingReceiptTaskId(null);
    }
  };

  if (roleLabel === 'Runner') {
    const runnerPending = visibleRunnerTasks.filter((task) => task.status !== 'Completed' && task.status !== 'At Staging').length;
    const runnerSpend = visibleRunnerTasks.reduce((sum, task) => sum + Number(task.actualSpend ?? task.purchaseCost ?? 0), 0);

    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">{heading}</p>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Today&apos;s Assignments</h1>
          <p className="mt-2 text-brand-100">Track budgets, upload receipts, and mark staging completion.</p>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-800">{message}</div> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{visibleRunnerTasks.length}</p><p className="text-sm text-slate-600">Assigned Orders</p></div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{runnerPending}</p><p className="text-sm text-slate-600">Pending Shopping</p></div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{formatCurrency(runnerSpend)}</p><p className="text-sm text-slate-600">Actual Spend</p></div>
        </div>

        <div className="space-y-4">
          {visibleRunnerTasks.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              <p className="text-lg font-semibold">No assigned shopping tasks</p>
              <p className="text-sm">Tasks will appear after admin assignment.</p>
            </div>
          ) : (
            visibleRunnerTasks.map((task) => {
              const order = orders.find((item) => item.id === task.orderId);
              const metrics = calculateShoppingBudgetMetrics(
                Number(task.allocatedBudget ?? order?.shoppingBudget ?? 0),
                Number(actualSpendMap[task.id] ?? task.actualSpend ?? task.purchaseCost ?? 0),
                settings.runnerBonusPercentage
              );

              return (
                <div key={task.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">{task.marketDay ?? order?.marketDay ?? 'Weekday'} / {task.productLine ?? order?.productLine ?? 'Weekly Groceries'}</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{task.orderNumber ?? task.orderId}</p>
                      <p className="text-sm text-slate-600">{task.estate ?? order?.estate ?? 'Estate pending'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{task.status}</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progress</p>
                    <div className="mt-2 flex items-center gap-2">
                      {['Assigned', 'Shopping', 'Completed', 'At Staging'].map((label, index) => {
                        const active = getRunnerStage(task.status) >= index + 1;
                        return (
                          <div key={label} className="flex flex-1 items-center gap-2">
                            <span className={`h-2 w-full rounded-full ${active ? 'bg-brand-600' : 'bg-slate-200'}`} />
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-600">{task.status === 'Pending' ? 'Assigned' : task.status}</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Customer Notes</p>
                    <p className="mt-2 text-sm text-slate-700">{order?.notes || task.notes || 'No notes added yet.'}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shopping List</p>
                    <div className="mt-2 grid gap-2">
                      {(task.shoppingList?.length ? task.shoppingList : order?.items?.map((item) => `${item.name} x ${item.quantity}`) ?? []).map((line) => (
                        <div key={`${task.id}-${line}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">Allocated: <strong>{formatCurrency(metrics.allocatedBudget)}</strong></div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">Actual: <strong>{formatCurrency(metrics.actualSpend)}</strong></div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">Business Margin: <strong>{formatCurrency(metrics.businessMargin)}</strong></div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      value={actualSpendMap[task.id] ?? String(task.actualSpend ?? task.purchaseCost ?? 0)}
                      onChange={(event) => setActualSpendMap((prev) => ({ ...prev, [task.id]: event.target.value }))}
                      placeholder="Actual spend"
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={receiptUrls[task.id] ?? task.receiptImages?.[0] ?? ''}
                      onChange={(event) => setReceiptUrls((prev) => ({ ...prev, [task.id]: event.target.value }))}
                      placeholder="Receipt image URL"
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={unavailableItems[task.id] ?? ''}
                      onChange={(event) => setUnavailableItems((prev) => ({ ...prev, [task.id]: event.target.value }))}
                      placeholder="Unavailable items (comma separated)"
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={substitutions[task.id] ?? ''}
                      onChange={(event) => setSubstitutions((prev) => ({ ...prev, [task.id]: event.target.value }))}
                      placeholder="Suggested substitutions (comma separated)"
                      className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    />
                  </div>

                  <textarea
                    value={localNotes[task.id] ?? task.notes}
                    onChange={(event) => setLocalNotes((prev) => ({ ...prev, [task.id]: event.target.value }))}
                    placeholder="Runner note"
                    className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => applyRunnerUpdates(task.id, 'In Progress')}
                      className="min-h-12 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Start Shopping
                    </button>
                    <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleReceiptFileChange(task.id, file);
                          event.currentTarget.value = '';
                        }}
                      />
                      {uploadingReceiptTaskId === task.id ? 'Compressing Receipt...' : 'Upload Receipt'}
                    </label>
                    <button
                      type="button"
                      onClick={() => applyRunnerUpdates(task.id, 'In Progress')}
                      className="min-h-12 rounded-2xl bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Submit Actual Spend
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRunnerUpdates(task.id, 'Completed')}
                      className="min-h-12 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700"
                    >
                      Complete Shopping
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRunnerUpdates(task.id, 'At Staging')}
                      className="min-h-12 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Mark Delivered To Staging
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const updateStatus = (orderId: string, nextStatus: DispatchStatus, riderName: string) => {
    const dispatch = dispatches.find((item) => item.orderId === orderId);
    if (!dispatch) {
      setMessage('Dispatch record not found for this order.');
      return;
    }

    const proofUrl = proofUrls[orderId] ?? '';
    const notes = localNotes[orderId] ?? '';

    updateDispatchStatus(dispatch.id, nextStatus, { assignedRider: riderName });

    if (nextStatus === 'In Transit') {
      createNotification('Delivery Started', 'Delivery started', `${dispatch.orderNumber} is now in transit.`, { orderId });
    }

    if (nextStatus === 'Delivered' || nextStatus === 'Completed') {
      createNotification('Delivered', 'Delivery completed', `${dispatch.orderNumber} was delivered by ${riderName}.`, { orderId });
    }

    if (nextStatus === 'Failed') {
      createNotification('Failed Delivery', 'Delivery failed', `${dispatch.orderNumber} delivery failed.`, { orderId });
    }

    if (proofUrl || notes) {
      updateDispatchStatus(dispatch.id, nextStatus, { assignedRider: riderName });
    }

    setMessage(`Order ${dispatch.orderNumber} updated to ${nextStatus}.`);
    window.setTimeout(() => setMessage(''), 3200);
  };

  const rejectOrder = (orderId: string, riderName: string) => {
    const dispatch = dispatches.find((item) => item.orderId === orderId);
    if (!dispatch) {
      setMessage('Dispatch record not found for this order.');
      return;
    }
    updateDispatchStatus(dispatch.id, 'Failed', { assignedRider: riderName });
    createNotification('Failed Delivery', 'Rider rejected order', `${dispatch.orderNumber} was rejected in rider portal.`, { orderId });
    setMessage(`Order ${dispatch.orderNumber} rejected.`);
    window.setTimeout(() => setMessage(''), 3200);
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">{heading}</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Assigned deliveries</h1>
        <p className="mt-2 text-brand-100">Manage delivery lifecycle in real time.</p>
      </div>

      {message ? (
        <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{deliveriesToday.length}</p><p className="text-sm text-slate-600">Today&apos;s Deliveries</p></div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{pendingDeliveries}</p><p className="text-sm text-slate-600">Pending Deliveries</p></div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{completedDeliveries}</p><p className="text-sm text-slate-600">Completed Deliveries</p></div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{formatCurrency(revenueDelivered)}</p><p className="text-sm text-slate-600">Revenue Delivered</p></div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-bold text-slate-950">{successRate}%</p><p className="text-sm text-slate-600">Success Rate</p></div>
      </div>

      <div className="space-y-4">
        {assignmentsToRender.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p className="text-lg font-semibold">No assigned deliveries found</p>
            <p className="text-sm">Check back once dispatch assigns deliveries.</p>
          </div>
        ) : (
          assignmentsToRender.map((assignment) => {
            const order = orders.find((item) => item.id === assignment.orderId);
            const orderTotal = order?.grandTotal ?? 0;
            const rider = assignment.assignedRider || authName || roleLabel;
            const normalizedPhone = normalizePhoneForWhatsApp(assignment.phone || order?.phone || '');
            const whatsappChat = normalizedPhone ? `https://wa.me/${normalizedPhone}` : '#';
            const mapsUrl = buildGoogleMapsUrl(assignment.address || order?.address || '', assignment.estate || order?.estate || '');

            return (
              <div key={assignment.id} className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedAssignment(expandedAssignment === assignment.id ? null : assignment.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-brand-600">{assignment.status}</p>
                    <p className="mt-2 font-bold text-slate-950">{assignment.customerName}</p>
                    <p className="text-sm text-slate-600">{assignment.orderNumber} • {assignment.estate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{formatCurrency(orderTotal)}</p>
                    <p className="text-xs text-slate-500">{expandedAssignment === assignment.id ? 'Hide' : 'Open'}</p>
                  </div>
                </button>

                {expandedAssignment === assignment.id ? (
                  <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer</p>
                        <p className="mt-2 font-semibold text-slate-950">{assignment.customerName}</p>
                        <p className="text-sm text-slate-600">{assignment.phone}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Address</p>
                        <p className="mt-2 font-semibold text-slate-950">{assignment.address}</p>
                        <p className="mt-1 text-xs text-slate-500">{assignment.estate}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timing</p>
                        <p className="mt-2 text-sm text-slate-700">Accepted: {assignment.acceptedAt ? new Date(assignment.acceptedAt).toLocaleTimeString() : '-'}</p>
                        <p className="text-sm text-slate-700">Delivered: {assignment.deliveredAt ? new Date(assignment.deliveredAt).toLocaleTimeString() : '-'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delivery Notes</p>
                      <p className="mt-2 text-sm text-slate-700">{localNotes[assignment.orderId] ?? assignment.notes ?? order?.notes ?? 'No delivery notes yet.'}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <a href={normalizedPhone ? `tel:${normalizedPhone}` : '#'} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">Call Customer</a>
                      <a href={whatsappChat} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700">Open WhatsApp Chat</a>
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">Open Navigation</a>
                      <button type="button" onClick={() => updateStatus(assignment.orderId, 'Delivered', rider)} className="min-h-12 rounded-2xl bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700">Mark Delivered</button>
                      <button type="button" disabled className="min-h-12 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-500" title="Future-ready endpoint not connected yet">Upload Delivery Proof</button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={proofUrls[assignment.orderId] ?? assignment.proofUrl ?? ''}
                        onChange={(event) => setProofUrls((prev) => ({ ...prev, [assignment.orderId]: event.target.value }))}
                        placeholder="Paste proof URL"
                        className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={localNotes[assignment.orderId] ?? assignment.notes ?? ''}
                        onChange={(event) => setLocalNotes((prev) => ({ ...prev, [assignment.orderId]: event.target.value }))}
                        placeholder="Add delivery notes"
                        className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                      />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                      {statusButtons.map((item) => (
                        <button
                          key={item.status}
                          type="button"
                          onClick={() => updateStatus(assignment.orderId, item.status, rider)}
                          className={`min-h-11 rounded-2xl px-3 py-2 text-xs font-bold transition ${
                            assignment.status === item.status
                              ? 'bg-brand-600 text-white'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => rejectOrder(assignment.orderId, rider)}
                        className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

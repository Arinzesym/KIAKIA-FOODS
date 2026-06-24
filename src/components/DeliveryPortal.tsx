'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOMSStore } from '@/lib/StoreContext';
import type { DispatchStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

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

  return normalizedAssignee.includes(normalizedRoleLabel);
}

const statusButtons: Array<{ label: string; status: DispatchStatus }> = [
  { label: 'Accept', status: 'Assigned' },
  { label: 'Mark Picked Up', status: 'Picked Up' },
  { label: 'Mark In Transit', status: 'In Transit' },
  { label: 'Mark Delivered', status: 'Delivered' },
  { label: 'Complete', status: 'Completed' }
];

export function DeliveryPortal({ heading, roleLabel }: DeliveryPortalProps) {
  const { riderAssignments, orders, updateDispatchStatus, dispatches, createNotification } = useOMSStore();
  const [authName, setAuthName] = useState('');
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    setAuthName(getCookieValue('auth-name'));
  }, []);

  const visibleAssignments = useMemo(
    () => riderAssignments.filter((assignment) => matchesDeliveryAssignment(assignment.assignedRider, roleLabel, authName)),
    [authName, riderAssignments, roleLabel]
  );

  const deliveriesToday = useMemo(() => {
    const today = new Date().toDateString();
    return visibleAssignments.filter((assignment) => {
      const order = orders.find((item) => item.id === assignment.orderId);
      return order ? new Date(order.createdAt).toDateString() === today : false;
    });
  }, [orders, visibleAssignments]);

  const pendingDeliveries = visibleAssignments.filter((assignment) => !['Completed', 'Failed'].includes(assignment.status)).length;
  const completedDeliveries = visibleAssignments.filter((assignment) => assignment.status === 'Completed').length;

  const revenueDelivered = visibleAssignments
    .filter((assignment) => assignment.status === 'Completed')
    .reduce((sum, assignment) => {
      const order = orders.find((item) => item.id === assignment.orderId);
      return sum + (order?.grandTotal ?? 0);
    }, 0);

  const successRate = visibleAssignments.length === 0 ? 0 : Math.round((completedDeliveries / visibleAssignments.length) * 100);

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
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">{heading}</p>
        <h1 className="mt-4 text-3xl font-bold">Assigned deliveries</h1>
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
        {visibleAssignments.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p className="text-lg font-semibold">No assigned deliveries found</p>
            <p className="text-sm">Check back once dispatch assigns deliveries.</p>
          </div>
        ) : (
          visibleAssignments.map((assignment) => {
            const order = orders.find((item) => item.id === assignment.orderId);
            const orderTotal = order?.grandTotal ?? 0;
            const rider = assignment.assignedRider || authName || roleLabel;

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
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer</p>
                        <p className="mt-2 font-semibold text-slate-950">{assignment.customerName}</p>
                        <p className="text-sm text-slate-600">{assignment.phone}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Address</p>
                        <p className="mt-2 font-semibold text-slate-950">{assignment.address}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timing</p>
                        <p className="mt-2 text-sm text-slate-700">Accepted: {assignment.acceptedAt ? new Date(assignment.acceptedAt).toLocaleTimeString() : '-'}</p>
                        <p className="text-sm text-slate-700">Delivered: {assignment.deliveredAt ? new Date(assignment.deliveredAt).toLocaleTimeString() : '-'}</p>
                      </div>
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOMSStore } from '@/lib/StoreContext';

const deliveryStatuses = ['Assigned', 'Picked Up', 'Delivered', 'Delayed', 'Cancelled'] as const;

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

export function DeliveryPortal({ heading, roleLabel }: DeliveryPortalProps) {
  const { riderAssignments, updateRiderAssignment } = useOMSStore();
  const [authName, setAuthName] = useState('');
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAuthName(getCookieValue('auth-name'));
  }, []);

  const visibleAssignments = useMemo(
    () => riderAssignments.filter((assignment) => matchesDeliveryAssignment(assignment.assignedRider, roleLabel, authName)),
    [authName, riderAssignments, roleLabel]
  );

  const handleStatusChange = (assignmentId: string, nextStatus: typeof deliveryStatuses[number]) => {
    updateRiderAssignment(assignmentId, { status: nextStatus, updatedAt: new Date().toISOString() });
    setMessage(`Delivery status updated to ${nextStatus}.`);
    window.setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">{heading}</p>
        <h1 className="mt-4 text-3xl font-bold">Assigned deliveries</h1>
        <p className="mt-2 text-brand-100">View your deliveries and update delivery status from the field.</p>
      </div>

      {message ? (
        <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-950">{visibleAssignments.length}</p>
          <p className="text-sm text-slate-600">Visible deliveries</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-950">{visibleAssignments.filter((assignment) => assignment.status === 'Delivered').length}</p>
          <p className="text-sm text-slate-600">Delivered</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-950">{roleLabel}</p>
          <p className="text-sm text-slate-600">Portal access</p>
        </div>
      </div>

      <div className="space-y-4">
        {visibleAssignments.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p className="text-lg font-semibold">No assigned deliveries found</p>
            <p className="text-sm">Check back once dispatch assigns deliveries to your role.</p>
          </div>
        ) : (
          visibleAssignments.map((assignment) => (
            <div key={assignment.id} className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedAssignment(expandedAssignment === assignment.id ? null : assignment.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-brand-600">{assignment.status}</p>
                  <p className="mt-2 font-bold text-slate-950">{assignment.customerName}</p>
                  <p className="text-sm text-slate-600">{assignment.orderId} • {assignment.estate}</p>
                </div>
                <div className="text-2xl text-slate-400">{expandedAssignment === assignment.id ? '▼' : '▶'}</div>
              </button>

              {expandedAssignment === assignment.id ? (
                <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer</p>
                      <p className="mt-2 font-semibold text-slate-950">{assignment.customerName}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estate</p>
                      <p className="mt-2 font-semibold text-slate-950">{assignment.estate}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Assigned to</p>
                      <p className="mt-2 font-semibold text-slate-950">{assignment.assignedRider}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">Notes</p>
                    <p className="mt-2">{assignment.notes || 'No notes provided.'}</p>
                    {assignment.proofUrl ? (
                      <a href={assignment.proofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-brand-600 hover:text-brand-700">
                        View proof of delivery
                      </a>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick status update</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {deliveryStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(assignment.id, status)}
                          className={`rounded-2xl px-3 py-2 text-xs font-bold transition ${
                            assignment.status === status
                              ? 'bg-brand-600 text-white'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { RiderAssignmentPanel } from '@/components/admin';

export default function AdminRidersPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Delivery riders</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Monitor rider assignments and delivery proof</h1>
        <p className="mt-3 text-slate-600">Assign deliveries, update status, and store proof of delivery photos for every route.</p>
      </div>
      <RiderAssignmentPanel />
    </div>
  );
}

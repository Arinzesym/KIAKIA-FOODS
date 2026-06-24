'use client';

import { DispatchBoard } from '@/components/admin';

export default function AdminDispatchPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Dispatch board</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Dispatch management workflow</h1>
        <p className="mt-3 text-slate-600">Move deliveries across Unassigned, Assigned, Picked Up, In Transit, Delivered, Completed, and Failed in real time.</p>
      </div>
      <DispatchBoard />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { DispatchBoard } from '@/components/admin';

export default function AdminDispatchPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Dispatch board</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Dispatch management workflow</h1>
        <p className="mt-3 text-slate-600">Assign each order to a runner directly from its dispatch card, add task notes, then track movement across Unassigned, Assigned, Picked Up, In Transit, Delivered, Completed, and Failed in real time.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/runners" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Open Runner Tasks</Link>
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to Orders</Link>
        </div>
      </div>
      <DispatchBoard />
    </div>
  );
}

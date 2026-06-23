'use client';

import { FinanceSummaryPanel } from '@/components/admin';

export default function AdminFinancePage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Finance dashboard</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Revenue, delivery fees, and profit performance</h1>
        <p className="mt-3 text-slate-600">Track collections, outstanding payments, and the profit picture for each estate and delivery cycle.</p>
      </div>
      <FinanceSummaryPanel />
    </div>
  );
}

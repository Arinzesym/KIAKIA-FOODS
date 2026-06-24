'use client';

import { EstateBatchingPanel, EstatePerformance } from '@/components/admin';

export default function EstateBatchingPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Estate batching</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Estate management and batching</h1>
        <p className="mt-3 text-slate-600">Monitor estate metrics, group orders by estate, and assign riders to delivery batches.</p>
      </div>
      <EstatePerformance />
      <EstateBatchingPanel />
    </div>
  );
}

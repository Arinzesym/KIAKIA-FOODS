'use client';

import { ExportReportsPanel } from '@/components/admin';

export default function AdminReportsPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Reporting</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Export daily and weekly business reports</h1>
        <p className="mt-3 text-slate-600">Download operational summaries, revenue reports, and estate delivery status logs with one click.</p>
      </div>
      <ExportReportsPanel />
    </div>
  );
}

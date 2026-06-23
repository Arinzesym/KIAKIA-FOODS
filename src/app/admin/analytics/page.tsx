'use client';

import { AnalyticsSummaryPanel, RevenueChart, EstatePerformance } from '@/components/admin';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Analytics dashboard</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Fast insights for orders, estates, and customer value</h1>
        <p className="mt-3 text-slate-600">Use charts, estates performance, and customer analytics to keep operations focused and profitable.</p>
      </div>
      <AnalyticsSummaryPanel />
      <RevenueChart />
      <EstatePerformance />
    </div>
  );
}

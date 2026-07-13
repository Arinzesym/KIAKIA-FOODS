'use client';

import dynamic from 'next/dynamic';

const AdminStatsGrid = dynamic(() => import('@/components/admin').then((mod) => mod.AdminStatsGrid));
const RevenueChart = dynamic(() => import('@/components/admin').then((mod) => mod.RevenueChart), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-3xl bg-white" />
});
const EstatePerformance = dynamic(() => import('@/components/admin').then((mod) => mod.EstatePerformance), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-3xl bg-white" />
});
const LeadsPanel = dynamic(() => import('@/components/admin').then((mod) => mod.LeadsPanel));

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Admin dashboard</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Operations, orders, and insights.</h1>
        <p className="mt-3 text-slate-600">Track revenue, customer growth, orders, and estate performance with business-ready analytics.</p>
      </div>

      <AdminStatsGrid />
      <RevenueChart />
      <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <EstatePerformance />
        <LeadsPanel />
      </div>
    </div>
  );
}

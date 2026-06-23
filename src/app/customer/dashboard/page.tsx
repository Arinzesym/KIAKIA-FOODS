'use client';

import { DashboardStats, OrderBuilder, OrderHistoryTable } from '@/components/customer';

const customerSummary = {
  totalOrders: 28,
  totalSpend: 1825000,
  activeOrders: 2,
  savedLists: 6
};

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-950">Customer dashboard</h1>
          <p className="mt-3 text-slate-600">Manage your favorites, shopping lists, and quick reorder workflows from one dashboard.</p>
        </div>
        <div className="rounded-3xl bg-brand-600 p-8 text-white shadow-lg shadow-brand-500/20">
          <h2 className="text-2xl font-semibold">WhatsApp Order Ready</h2>
          <p className="mt-3 text-slate-100">Orders are converted into a formatted WhatsApp message and sent directly to KiaKia Foods operations.</p>
        </div>
      </div>

      <DashboardStats summary={customerSummary} />
      <OrderBuilder />
      <OrderHistoryTable />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useOMSStore } from '@/lib/StoreContext';
import { AdminOrderTable } from '@/components/admin';
import { downloadCsv, exportOrdersAsCsv } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function AdminOrdersPage() {
  const { orders } = useOMSStore();

  const handleExport = () => {
    const csv = exportOrdersAsCsv(orders);
    downloadCsv('kiakia-orders.csv', csv);
  };

  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Order management</h1>
          <p className="mt-3 text-slate-600">Create, assign, and update order statuses for every KiaKia Foods delivery.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Export all orders
          </Button>
          <Link href="/admin/orders/create" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
            Create order
          </Link>
        </div>
      </div>
      <AdminOrderTable />
    </div>
  );
}

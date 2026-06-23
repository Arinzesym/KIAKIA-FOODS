'use client';

import { AdminCustomerTable } from '@/components/admin';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">Customer directory</h1>
        <p className="mt-3 text-slate-600">Search customers, view order history, and manage estate records.</p>
      </div>
      <AdminCustomerTable />
    </div>
  );
}

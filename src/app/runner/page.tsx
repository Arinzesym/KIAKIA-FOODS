'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useOMSStore } from '@/lib/StoreContext';
import { formatCurrency } from '@/lib/utils';

const visibleStatuses = ['New', 'Confirmed', 'Market Sourcing', 'Purchased', 'At Dispatch Point'] as const;

export default function RunnerPage() {
  const { orders, runnerTasks } = useOMSStore();
  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      const matchSearch = [order.id, order.customerName, order.estate, order.address].some((field) =>
        field.toLowerCase().includes(search.toLowerCase())
      );
      return visibleStatuses.includes(order.status as typeof visibleStatuses[number]) && matchSearch;
    }),
    [orders, search]
  );

  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Runner portal</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Orders you can source and deliver</h1>
        <p className="mt-3 text-slate-600">See the latest orders created in the system with status details, WhatsApp links, and runner task notes.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_0.25fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Visible orders</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Orders ready for runner review</h2>
            </div>
            <div className="rounded-3xl bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700">{filteredOrders.length} orders</div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order ID, customer, estate"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="mt-6 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">No runner orders found.</div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-brand-600">{order.status}</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{order.id}</p>
                      <p className="mt-1 text-sm text-slate-600">{order.customerName} • {order.estate}</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="text-2xl font-semibold text-slate-950">{formatCurrency(order.grandTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Payments</p>
                      <p className="mt-2 text-slate-900">Service ₦{order.serviceFee.toLocaleString()}</p>
                      <p className="text-slate-900">Delivery ₦{order.deliveryFee.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Address</p>
                      <p className="mt-2 text-slate-900">{order.address}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">WhatsApp</p>
                      <a
                        href={`https://wa.me/${order.whatsapp.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Open chat
                      </a>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">{order.estate}</span>
                    <Link href={`/admin/orders`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                      View full order details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Runner tasks</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Market sourcing notes</h2>
          <div className="mt-6 space-y-4">
            {runnerTasks.map((task) => (
              <div key={task.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{task.task}</p>
                <p className="mt-1 text-sm text-slate-600">{task.assignedTo}</p>
                <p className="mt-2 text-sm text-slate-600">{task.notes}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-brand-700">{task.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

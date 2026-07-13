'use client';

import { useMemo } from 'react';
import { EstateBatchingPanel, EstatePerformance } from '@/components/admin';
import { useOMSStore } from '@/lib/StoreContext';
import { loadBusinessSettings } from '@/lib/businessSettings';
import { calculateDeliveryMetrics } from '@/lib/marginEngine';
import { formatCurrency } from '@/lib/utils';

export default function EstateBatchingPage() {
  const { orders } = useOMSStore();
  const settings = loadBusinessSettings();

  const autoBatches = useMemo(() => {
    const windows = settings.deliveryWindows.length > 0 ? settings.deliveryWindows : ['12:00 - 15:00'];
    const groups = new Map<string, { key: string; estate: string; marketDay: string; deliveryWindow: string; orders: typeof orders }>();

    orders.forEach((order, index) => {
      const marketDay = order.marketDay ?? 'Weekday';
      const deliveryWindow = windows[index % windows.length];
      const key = `${order.estate}__${marketDay}__${deliveryWindow}`;
      const current = groups.get(key) ?? { key, estate: order.estate, marketDay, deliveryWindow, orders: [] };
      current.orders.push(order);
      groups.set(key, current);
    });

    return Array.from(groups.values()).map((group) => {
      const collectedDeliveryFees = group.orders.reduce((sum, order) => sum + Number(order.deliveryFee ?? 0), 0);
      const dispatchCost = Math.round(collectedDeliveryFees * 0.72);
      const margin = calculateDeliveryMetrics(collectedDeliveryFees, dispatchCost);
      return {
        ...group,
        collectedDeliveryFees,
        dispatchCost,
        deliveryMargin: margin.deliveryMargin
      };
    });
  }, [orders, settings.deliveryWindows]);

  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Estate batching</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Estate management and batching</h1>
        <p className="mt-3 text-slate-600">Monitor estate metrics, group orders by estate, and assign riders to delivery batches.</p>
      </div>
      <EstatePerformance />

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Delivery batches</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Auto-grouped by Estate + Market Day + Window</h2>
            <p className="mt-2 text-sm text-slate-600">Dispatch cost and delivery margins are calculated automatically, then can be adjusted manually.</p>
          </div>
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Estate</th>
                <th className="px-4 py-3">Market Day</th>
                <th className="px-4 py-3">Delivery Window</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Fees Collected</th>
                <th className="px-4 py-3">Dispatch Cost</th>
                <th className="px-4 py-3">Delivery Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {autoBatches.map((batch) => (
                <tr key={batch.key}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{batch.estate}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.marketDay}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.deliveryWindow}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.orders.length}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(batch.collectedDeliveryFees)}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(batch.dispatchCost)}</td>
                  <td className={`px-4 py-3 font-semibold ${batch.deliveryMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(batch.deliveryMargin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3 lg:hidden">
          {autoBatches.map((batch) => (
            <article key={batch.key} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{batch.estate}</p>
                  <p className="text-xs text-slate-500">{batch.marketDay} • {batch.deliveryWindow}</p>
                </div>
                <p className="text-xs font-semibold text-slate-700">{batch.orders.length} orders</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2 text-slate-700">Fees<br /><strong>{formatCurrency(batch.collectedDeliveryFees)}</strong></div>
                <div className="rounded-xl bg-slate-50 p-2 text-slate-700">Cost<br /><strong>{formatCurrency(batch.dispatchCost)}</strong></div>
                <div className={`rounded-xl p-2 ${batch.deliveryMargin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>Margin<br /><strong>{formatCurrency(batch.deliveryMargin)}</strong></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <EstateBatchingPanel />
    </div>
  );
}

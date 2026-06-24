'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useOMSStore } from '@/lib/StoreContext';
import { downloadCsv, exportOrdersAsCsv, formatCurrency } from '@/lib/utils';

const visibleStatuses = ['New', 'Confirmed', 'Market Sourcing', 'Purchased', 'At Dispatch Point', 'Out For Delivery', 'Delivered'] as const;

export default function RunnerPage() {
  const { orders, runnerTasks, updateOrder } = useOMSStore();
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      const matchSearch = [order.id, order.customerName, order.estate, order.address].some((field) =>
        field.toLowerCase().includes(search.toLowerCase())
      );
      return visibleStatuses.includes(order.status as typeof visibleStatuses[number]) && matchSearch;
    }),
    [orders, search]
  );

  const handleExportOrders = () => {
    const csv = exportOrdersAsCsv(orders);
    downloadCsv('kiakia-full-orders.csv', csv);
    setSuccessMessage('Orders list downloaded successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleStatusChange = (orderId: string, nextStatus: typeof visibleStatuses[number]) => {
    updateOrder(orderId, { status: nextStatus, updatedAt: new Date().toISOString() });
    setSuccessMessage(`Order status updated to: ${nextStatus}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-700',
      'Confirmed': 'bg-blue-100 text-blue-700',
      'Market Sourcing': 'bg-yellow-100 text-yellow-700',
      'Purchased': 'bg-orange-100 text-orange-700',
      'At Dispatch Point': 'bg-purple-100 text-purple-700',
      'Out For Delivery': 'bg-green-100 text-green-700',
      'Delivered': 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">Runner Portal</p>
        <h1 className="mt-4 text-3xl font-bold">Market Delivery Operations</h1>
        <p className="mt-2 text-brand-100">Update order statuses, download lists, and manage deliveries on the go</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportOrders}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            ⬇️ Download Full List
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-2xl bg-green-100 p-4 text-green-700 font-semibold">
          ✓ {successMessage}
        </div>
      )}

      {/* Search Bar */}
      <div className="sticky top-20 z-30 rounded-3xl bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="🔍 Search order ID, customer, or estate"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Orders Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-950">{filteredOrders.length}</p>
          <p className="text-sm text-slate-600">Total Orders</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-950">{filteredOrders.filter(o => o.status === 'Purchased').length}</p>
          <p className="text-sm text-slate-600">Purchased</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-950">{filteredOrders.filter(o => o.status === 'Out For Delivery').length}</p>
          <p className="text-sm text-slate-600">Out for Delivery</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p className="text-lg font-semibold">No orders found</p>
            <p className="text-sm">Try adjusting your search filters</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Order Header - Clickable */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-5 text-left hover:bg-slate-50 transition flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="font-bold text-slate-950">{order.id}</p>
                  </div>
                  <p className="text-sm text-slate-600">{order.customerName} • {order.estate}</p>
                  <p className="text-sm font-semibold text-slate-950 mt-2">{formatCurrency(order.grandTotal)}</p>
                </div>
                <div className="text-2xl text-slate-400">{expandedOrder === order.id ? '▼' : '▶'}</div>
              </button>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-slate-200 p-5 space-y-4 bg-slate-50">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Customer Details</p>
                    <div className="bg-white rounded-2xl p-3 space-y-1">
                      <p className="text-sm"><span className="font-semibold">Name:</span> {order.customerName}</p>
                      <p className="text-sm"><span className="font-semibold">Phone:</span> {order.phone}</p>
                      <p className="text-sm"><span className="font-semibold">Address:</span> {order.address}</p>
                      <p className="text-sm"><span className="font-semibold">Estate:</span> {order.estate}</p>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Breakdown</p>
                    <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee:</span>
                        <span className="font-semibold">₦{order.serviceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-semibold">₦{order.deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-brand-700">
                        <span>Total:</span>
                        <span>{formatCurrency(order.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Action */}
                  <a
                    href={`https://wa.me/${order.whatsapp.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full block rounded-2xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-700"
                  >
                    💬 Open WhatsApp Chat
                  </a>

                  {/* Status Update */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Quick Status Update</p>
                    <div className="grid grid-cols-2 gap-2">
                      {visibleStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(order.id, status)}
                          className={`rounded-2xl px-3 py-2 text-xs font-bold transition ${
                            order.status === status
                              ? 'bg-brand-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStatusChange(order.id, 'Purchased')}
                      className="rounded-2xl bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-200"
                    >
                      ✓ Purchased
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, 'Out For Delivery')}
                      className="rounded-2xl bg-green-100 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-200"
                    >
                      🚗 Out for Delivery
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Runner Tasks Sidebar */}
      {runnerTasks.length > 0 && (
        <div className="rounded-3xl bg-blue-50 p-6 border-2 border-blue-200">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-600 font-bold">📋 Your Tasks</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">Market Sourcing Notes</h2>
          <div className="mt-4 space-y-3">
            {runnerTasks.map((task) => (
              <div key={task.id} className="rounded-2xl bg-white p-4 border border-blue-200">
                <p className="font-bold text-slate-950">{task.task}</p>
                <p className="text-sm text-slate-600 mt-1">{task.notes}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Assigned to: {task.assignedTo}</span>
                  <span className={`px-3 py-1 rounded-full font-bold ${
                    task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

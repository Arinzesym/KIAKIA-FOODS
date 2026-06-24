'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { useOMSStore } from '@/lib/StoreContext';
import { formatCurrency, buildWhatsAppLink, generateWhatsAppMessage } from '@/lib/utils';
import { dispatchStatuses, orderStatusMap, orderStatuses, paymentStatuses } from '@/lib/mockData';
import { isAdminRole, normalizeRole, type AuthRole } from '@/lib/access';
import type { DispatchStatus, EstateBatch, OrderRecord } from '@/lib/types';

function useAuthRole() {
  const [role, setRole] = useState<AuthRole>('');

  useEffect(() => {
    const authRole = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth-role='))
      ?.split('=')[1];
    setRole(normalizeRole(authRole));
  }, []);

  return role;
}

function StatusBadge({ status }: { status: string }) {
  const className = orderStatusMap[status as keyof typeof orderStatusMap] ?? 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function DispatchBadge({ status }: { status: string }) {
  const classNameMap: Record<string, string> = {
    Unassigned: 'bg-slate-100 text-slate-700',
    Assigned: 'bg-blue-100 text-blue-700',
    'Picked Up': 'bg-cyan-100 text-cyan-700',
    'In Transit': 'bg-orange-100 text-orange-700',
    Delivered: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-emerald-200 text-emerald-800',
    Failed: 'bg-rose-100 text-rose-700'
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classNameMap[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}

function getDateBucket(dateText: string) {
  const now = new Date();
  const date = new Date(dateText);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) return 'This Month';
  return 'Older';
}

function exportCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AdminStatsGrid() {
  const { orders, customers, estateBatches, dispatches, notifications } = useOMSStore();

  const revenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);
  const failed = orders.filter((order) => order.status === 'Failed').length;

  const stats = [
    { label: 'Orders', value: orders.length.toLocaleString() },
    { label: 'Dispatch Queue', value: dispatches.length.toLocaleString() },
    { label: 'Customers', value: customers.length.toLocaleString() },
    { label: 'Estate Batches', value: estateBatches.length.toLocaleString() },
    { label: 'Unread Alerts', value: notifications.filter((item) => !item.read).length.toLocaleString() },
    { label: 'Revenue', value: formatCurrency(revenue) },
    { label: 'Failures', value: failed.toLocaleString() }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

export function LeadsPanel() {
  const { notifications, markNotificationRead } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Live alerts</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Operational notifications</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No notifications yet.</div>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markNotificationRead(notification.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                notification.read ? 'border-slate-200 bg-white' : 'border-emerald-300 bg-emerald-50'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{notification.type}</p>
              <p className="mt-1 font-semibold text-slate-950">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export function AdminOrderTable() {
  const { orders, updateOrder, deleteOrder, sendToDispatch, createNotification } = useOMSStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const role = useAuthRole();

  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      const query = search.toLowerCase();
      const matchesSearch = [
        order.orderNumber,
        order.customerName,
        order.phone,
        order.estate,
        order.assignedRider,
        order.status
      ].some((field) => field.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      const dateBucket = getDateBucket(order.createdAt);
      const matchesDate = dateFilter === 'All' || dateBucket === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    }),
    [orders, search, statusFilter, dateFilter]
  );

  const showFlash = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteOrder = (orderId: string) => {
    const confirmed = window.confirm(`Delete order ${orderId}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    deleteOrder(orderId);
    showFlash(`Order ${orderId} deleted.`, 'success');
  };

  const handleSendDispatch = (order: OrderRecord) => {
    if (!isAdminRole(role)) {
      showFlash('You do not have permission to dispatch orders.', 'error');
      return;
    }

    sendToDispatch(order.id, order.assignedRider);
    createNotification('Rider Assignment', 'Order moved to dispatch', `${order.orderNumber} sent to dispatch queue.`, { orderId: order.id });
    showFlash(`${order.orderNumber} moved to dispatch queue.`, 'success');
  };

  const handleWhatsApp = (order: OrderRecord) => {
    const whatsappMessage = generateWhatsAppMessage({
      name: order.customerName,
      phone: order.phone,
      estate: order.estate,
      address: order.address,
      items: order.items,
      serviceFee: order.serviceFee,
      deliveryFee: order.deliveryFee,
      additionalCharges: order.additionalCharges,
      orderId: order.orderNumber
    });

    const result = buildWhatsAppLink(order.whatsapp || order.phone, whatsappMessage);
    if (!result.ok || !result.url) {
      showFlash(result.error ?? 'Invalid WhatsApp number.', 'error');
      return;
    }

    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  const handleExport = () => {
    exportCsv('orders-export.csv', [
      ['Order Number', 'Customer', 'Phone', 'Estate', 'Status', 'Payment Status', 'Rider', 'Total', 'Created At', 'Updated At'],
      ...filteredOrders.map((order) => [
        order.orderNumber,
        order.customerName,
        order.phone,
        order.estate,
        order.status,
        order.paymentStatus,
        order.assignedRider,
        order.grandTotal.toString(),
        order.createdAt,
        order.updatedAt
      ])
    ]);
  };

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Order Management</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Global order search and control</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>Export filtered</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order, customer, phone, estate, rider"
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
        >
          <option value="All">All statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
        >
          {['All', 'Today', 'Yesterday', 'This Week', 'This Month'].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {message ? (
        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {message}
        </div>
      ) : null}

      <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Estate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{order.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{order.customerName}</p>
                  <p className="text-xs text-slate-500">{order.phone}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{order.estate}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3">
                  <select
                    value={order.paymentStatus}
                    onChange={(event) => updateOrder(order.id, { paymentStatus: event.target.value as OrderRecord['paymentStatus'], updatedAt: new Date().toISOString() })}
                    className="min-h-10 rounded-xl border border-slate-200 px-2 text-xs"
                  >
                    {paymentStatuses.map((paymentStatus) => (
                      <option key={paymentStatus} value={paymentStatus}>{paymentStatus}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{order.assignedRider || 'Unassigned'}</td>
                <td className="px-4 py-3 text-slate-900">{formatCurrency(order.grandTotal)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleWhatsApp(order)} className="rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">Message Customer</button>
                    <button type="button" onClick={() => handleSendDispatch(order)} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">Send to Dispatch</button>
                    <Link href={`/admin/orders/${order.id}`} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">Details</Link>
                    <button type="button" onClick={() => handleDeleteOrder(order.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No orders found for this filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-3 lg:hidden">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">No orders found for this filter.</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{order.orderNumber}</p>
                  <p className="mt-1 font-semibold text-slate-950">{order.customerName}</p>
                  <p className="text-sm text-slate-600">{order.phone}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{order.estate} • {formatCurrency(order.grandTotal)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleWhatsApp(order)} className="min-h-11 rounded-xl bg-green-50 px-2 text-xs font-semibold text-green-700">Message</button>
                <button type="button" onClick={() => handleSendDispatch(order)} className="min-h-11 rounded-xl bg-brand-50 px-2 text-xs font-semibold text-brand-700">Dispatch</button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function DispatchBoard() {
  const { dispatches, updateDispatchStatus } = useOMSStore();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const columns: DispatchStatus[] = ['Unassigned', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Completed', 'Failed'];

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Dispatch management</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Dispatch board</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-4 2xl:grid-cols-7">
        {columns.map((column) => {
          const items = dispatches.filter((dispatch) => dispatch.status === column);
          return (
            <div
              key={column}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggingId) {
                  return;
                }
                updateDispatchStatus(draggingId, column);
                setDraggingId(null);
              }}
              className="min-h-[240px] rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <DispatchBadge status={column} />
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((dispatch) => (
                  <article
                    key={dispatch.id}
                    draggable
                    onDragStart={() => setDraggingId(dispatch.id)}
                    className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-600">{dispatch.orderNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{dispatch.customerName}</p>
                    <p className="text-xs text-slate-600">{dispatch.estate}</p>
                    <p className="mt-2 text-xs text-slate-500">{dispatch.assignedRider || 'Unassigned'}</p>
                  </article>
                ))}
                {items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">Drop here</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function useAnalytics() {
  const { orders, dispatches, riderAssignments, estates } = useOMSStore();

  return useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isInRange = (dateText: string, start: Date) => new Date(dateText).getTime() >= start.getTime();

    const todayOrders = orders.filter((order) => isInRange(order.createdAt, startOfToday));
    const weekOrders = orders.filter((order) => isInRange(order.createdAt, startOfWeek));
    const monthOrders = orders.filter((order) => isInRange(order.createdAt, startOfMonth));

    const revenueToday = todayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const revenueWeek = weekOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const revenueMonth = monthOrders.reduce((sum, order) => sum + order.grandTotal, 0);

    const completed = orders.filter((order) => order.status === 'Completed').length;
    const failed = orders.filter((order) => order.status === 'Failed').length;
    const successRate = orders.length ? (completed / orders.length) * 100 : 0;
    const failedRate = orders.length ? (failed / orders.length) * 100 : 0;

    const riderMap = new Map<string, number>();
    riderAssignments.forEach((assignment) => {
      if (assignment.status === 'Completed') {
        riderMap.set(assignment.assignedRider, (riderMap.get(assignment.assignedRider) ?? 0) + 1);
      }
    });

    const estateMap = new Map<string, number>();
    estates.forEach((estate) => {
      estateMap.set(estate.name, estate.completedDeliveries);
    });

    const bestRider = Array.from(riderMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
    const bestEstate = Array.from(estateMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    const averageDeliveryTime = orders
      .filter((order) => order.deliveryTimeMinutes && order.deliveryTimeMinutes > 0)
      .reduce((sum, order, _, arr) => sum + (order.deliveryTimeMinutes ?? 0) / arr.length, 0);

    const dailyOrderSeries = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      const label = day.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOrders = orders.filter((order) => {
        const d = new Date(order.createdAt);
        return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
      });
      return {
        label,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.grandTotal, 0)
      };
    });

    const riderPerformance = Array.from(riderMap.entries()).map(([rider, deliveries]) => ({ rider, deliveries }));
    const estatePerformance = estates.map((estate) => ({ estate: estate.name, completed: estate.completedDeliveries, failed: estate.failedDeliveries }));
    const dispatchByStatus = dispatchStatuses.map((status) => ({ status, count: dispatches.filter((item) => item.status === status).length }));

    return {
      ordersToday: todayOrders.length,
      ordersWeek: weekOrders.length,
      ordersMonth: monthOrders.length,
      revenueToday,
      revenueWeek,
      revenueMonth,
      successRate,
      failedRate,
      averageDeliveryTime,
      bestRider,
      bestEstate,
      dailyOrderSeries,
      riderPerformance,
      estatePerformance,
      dispatchByStatus
    };
  }, [dispatches, estates, orders, riderAssignments]);
}

export function AnalyticsSummaryPanel() {
  const analytics = useAnalytics();

  const stats = [
    { label: 'Orders Today', value: analytics.ordersToday.toLocaleString() },
    { label: 'Orders This Week', value: analytics.ordersWeek.toLocaleString() },
    { label: 'Orders This Month', value: analytics.ordersMonth.toLocaleString() },
    { label: 'Revenue Today', value: formatCurrency(analytics.revenueToday) },
    { label: 'Revenue This Week', value: formatCurrency(analytics.revenueWeek) },
    { label: 'Revenue This Month', value: formatCurrency(analytics.revenueMonth) },
    { label: 'Avg Delivery Time', value: `${Math.round(analytics.averageDeliveryTime || 0)} mins` },
    { label: 'Best Rider', value: analytics.bestRider },
    { label: 'Best Estate', value: analytics.bestEstate },
    { label: 'Success Rate', value: `${analytics.successRate.toFixed(1)}%` },
    { label: 'Failed Delivery Rate', value: `${analytics.failedRate.toFixed(1)}%` }
  ];

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RevenueChart() {
  const analytics = useAnalytics();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Daily Orders & Revenue Trend</p>
        <h2 className="text-2xl font-semibold text-slate-950">Performance trend</h2>
      </div>
      <div className="mt-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.dailyOrderSeries} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#475569" />
            <YAxis yAxisId="left" stroke="#475569" allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#475569" tickFormatter={(value) => `₦${Math.round(Number(value) / 1000)}k`} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#16a34a" strokeWidth={3} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function EstatePerformance() {
  const analytics = useAnalytics();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-950">Estate and Rider Performance</h2>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-2xl border border-slate-200 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.estatePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="estate" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#16a34a" name="Completed" />
              <Bar dataKey="failed" fill="#e11d48" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-80 rounded-2xl border border-slate-200 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.riderPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="rider" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" fill="#0ea5e9" name="Completed Deliveries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export function EstateBatchingPanel() {
  const { estateBatches, orders, addEstateBatch, updateEstateBatch, deleteEstateBatch, createNotification } = useOMSStore();
  const role = useAuthRole();
  const canEdit = isAdminRole(role);

  const [form, setForm] = useState({
    id: '',
    name: '',
    estate: '',
    estateCode: '',
    deliveryZone: '',
    assignedRider: '',
    status: 'Pending' as EstateBatch['status']
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingId, setEditingId] = useState('');
  const [notice, setNotice] = useState('');

  const clearForm = () => {
    setForm({ id: '', name: '', estate: '', estateCode: '', deliveryZone: '', assignedRider: '', status: 'Pending' });
    setSelectedOrders([]);
    setEditingId('');
  };

  const submitForm = () => {
    if (!form.name.trim() || !form.estate.trim() || !form.estateCode.trim() || !form.deliveryZone.trim()) {
      setNotice('Fill batch name, estate, code, and delivery zone.');
      return;
    }

    const now = new Date().toISOString();
    const selected = orders.filter((order) => selectedOrders.includes(order.id));
    const totalValue = selected.reduce((sum, order) => sum + order.grandTotal, 0);

    const payload: EstateBatch = {
      id: editingId || form.id || `B-${Date.now()}`,
      name: form.name,
      estate: form.estate,
      estateCode: form.estateCode,
      deliveryZone: form.deliveryZone,
      orderIds: selectedOrders,
      orders: selectedOrders.length,
      totalValue,
      assignedRider: form.assignedRider,
      status: form.status,
      createdAt: now,
      updatedAt: now
    };

    if (editingId) {
      updateEstateBatch(editingId, payload);
      setNotice(`Batch ${payload.name} updated.`);
    } else {
      addEstateBatch(payload);
      setNotice(`Batch ${payload.name} created.`);
    }

    if (payload.status === 'Completed') {
      createNotification('Batch Completed', 'Estate batch completed', `${payload.name} in ${payload.estate} marked as completed.`, { batchId: payload.id });
    }

    clearForm();
  };

  const startEdit = (batch: EstateBatch) => {
    setForm({
      id: batch.id,
      name: batch.name,
      estate: batch.estate,
      estateCode: batch.estateCode,
      deliveryZone: batch.deliveryZone,
      assignedRider: batch.assignedRider,
      status: batch.status
    });
    setSelectedOrders(batch.orderIds);
    setEditingId(batch.id);
  };

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Estate Batching</p>
        <h2 className="text-2xl font-semibold text-slate-950">Create, edit, assign, and complete batches</h2>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Batch name (e.g. Batch A)" className="min-h-11 rounded-2xl border border-slate-200 px-4" />
        <input value={form.estate} onChange={(event) => setForm((prev) => ({ ...prev, estate: event.target.value }))} placeholder="Estate" className="min-h-11 rounded-2xl border border-slate-200 px-4" />
        <input value={form.estateCode} onChange={(event) => setForm((prev) => ({ ...prev, estateCode: event.target.value }))} placeholder="Estate code" className="min-h-11 rounded-2xl border border-slate-200 px-4" />
        <input value={form.deliveryZone} onChange={(event) => setForm((prev) => ({ ...prev, deliveryZone: event.target.value }))} placeholder="Delivery zone" className="min-h-11 rounded-2xl border border-slate-200 px-4" />
        <input value={form.assignedRider} onChange={(event) => setForm((prev) => ({ ...prev, assignedRider: event.target.value }))} placeholder="Assigned rider" className="min-h-11 rounded-2xl border border-slate-200 px-4" />
        <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as EstateBatch['status'] }))} className="min-h-11 rounded-2xl border border-slate-200 px-4">
          {['Pending', 'Assigned', 'In Progress', 'Completed'].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Select orders for batch</p>
        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <label key={order.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selectedOrders.includes(order.id)}
                onChange={(event) => {
                  setSelectedOrders((current) => {
                    if (event.target.checked) {
                      return [...current, order.id];
                    }
                    return current.filter((id) => id !== order.id);
                  });
                }}
              />
              <span>{order.orderNumber} • {order.estate}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={submitForm} disabled={!canEdit}>{editingId ? 'Update Batch' : 'Create Batch'}</Button>
        {editingId ? <Button variant="secondary" onClick={clearForm}>Cancel Edit</Button> : null}
      </div>

      {notice ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Estate</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {estateBatches.map((batch) => (
              <tr key={batch.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{batch.name}</td>
                <td className="px-4 py-3 text-slate-600">{batch.estate} ({batch.estateCode})</td>
                <td className="px-4 py-3 text-slate-600">{batch.deliveryZone}</td>
                <td className="px-4 py-3 text-slate-600">{batch.orders}</td>
                <td className="px-4 py-3 text-slate-600">{batch.assignedRider || 'Unassigned'}</td>
                <td className="px-4 py-3 text-slate-600">{batch.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(batch)} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">Edit</button>
                    <button type="button" onClick={() => deleteEstateBatch(batch.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {estateBatches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No estate batches yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RunnerTaskPanel() {
  const { runnerTasks, deleteRunnerTask, updateRunnerTask } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-950">Runner Task Management</h2>
      <div className="mt-6 space-y-3">
        {runnerTasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{task.task}</p>
                <p className="text-sm text-slate-600">{task.orderId} • {task.assignedTo}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={task.status}
                  onChange={(event) => updateRunnerTask(task.id, { status: event.target.value, updatedAt: new Date().toISOString() })}
                  className="min-h-10 rounded-xl border border-slate-200 px-2 text-xs"
                >
                  {['Pending', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button type="button" onClick={() => deleteRunnerTask(task.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RiderAssignmentPanel() {
  const { riderAssignments, updateRiderAssignment, deleteRiderAssignment } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-950">Rider Assignments</h2>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {riderAssignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{assignment.orderNumber}</td>
                <td className="px-4 py-3 text-slate-600">{assignment.assignedRider}</td>
                <td className="px-4 py-3">
                  <select
                    value={assignment.status}
                    onChange={(event) => updateRiderAssignment(assignment.id, { status: event.target.value as DispatchStatus, updatedAt: new Date().toISOString() })}
                    className="min-h-10 rounded-xl border border-slate-200 px-2 text-xs"
                  >
                    {dispatchStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{assignment.proofUrl ? <a href={assignment.proofUrl} className="text-brand-700 underline">View</a> : 'Pending'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => deleteRiderAssignment(assignment.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FinanceSummaryPanel() {
  const analytics = useAnalytics();

  const cards = [
    { label: 'Revenue Today', value: formatCurrency(analytics.revenueToday) },
    { label: 'Revenue Week', value: formatCurrency(analytics.revenueWeek) },
    { label: 'Revenue Month', value: formatCurrency(analytics.revenueMonth) },
    { label: 'Success Rate', value: `${analytics.successRate.toFixed(1)}%` }
  ];

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExportReportsPanel() {
  const { orders, dispatches, estates } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-950">Exports</h2>
      <p className="mt-2 text-slate-600">Download operational reports for compliance and leadership review.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button
          variant="secondary"
          onClick={() => exportCsv('orders-report.csv', [
            ['Order Number', 'Customer', 'Estate', 'Status', 'Rider', 'Total'],
            ...orders.map((order) => [order.orderNumber, order.customerName, order.estate, order.status, order.assignedRider, String(order.grandTotal)])
          ])}
        >
          Export Orders
        </Button>
        <Button
          variant="secondary"
          onClick={() => exportCsv('dispatch-report.csv', [
            ['Dispatch', 'Order', 'Customer', 'Estate', 'Status', 'Rider', 'Updated'],
            ...dispatches.map((dispatch) => [dispatch.id, dispatch.orderNumber, dispatch.customerName, dispatch.estate, dispatch.status, dispatch.assignedRider, dispatch.updatedAt])
          ])}
        >
          Export Dispatches
        </Button>
        <Button
          variant="secondary"
          onClick={() => exportCsv('estates-report.csv', [
            ['Estate', 'Code', 'Zone', 'Orders', 'Completed', 'Failed', 'Revenue'],
            ...estates.map((estate) => [estate.name, estate.code, estate.deliveryZone, String(estate.numberOfOrders), String(estate.completedDeliveries), String(estate.failedDeliveries), String(estate.revenueGenerated)])
          ])}
        >
          Export Estates
        </Button>
      </div>
    </section>
  );
}

export function AdminCustomerTable() {
  const { customers, deleteCustomer } = useOMSStore();
  const role = useAuthRole();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-950">Customer Directory</h2>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Estate</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{customer.name}</td>
                <td className="px-4 py-3 text-slate-600">{customer.phone}</td>
                <td className="px-4 py-3 text-slate-600">{customer.estate}</td>
                <td className="px-4 py-3 text-slate-600">{customer.totalOrders}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(customer.lifetimeSpend)}</td>
                <td className="px-4 py-3">
                  {role === 'owner' ? (
                    <button type="button" onClick={() => deleteCustomer(customer.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
                  ) : (
                    <span className="text-xs text-slate-500">Restricted</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

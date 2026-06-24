'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { Button } from '@/components/ui/Button';
import { downloadCsv, exportOrdersAsCsv, exportRunnerTasksAsCsv, exportRiderAssignmentsAsCsv, formatCurrency } from '@/lib/utils';
import { useOMSStore } from '@/lib/StoreContext';
import { orderStatusMap } from '@/lib/mockData';

function StatusBadge({ status }: { status: string }) {
  const className = orderStatusMap[status as keyof typeof orderStatusMap] ?? 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

export function AdminStatsGrid() {
  const { orders, customers, estateBatches } = useOMSStore();
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalBatches = estateBatches.length;
  const revenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);

  const stats = [
    { label: 'Active orders', value: totalOrders },
    { label: 'Registered customers', value: totalCustomers },
    { label: 'Estate batches', value: totalBatches },
    { label: 'Total revenue', value: revenue }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{stat.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export function LeadsPanel() {
  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Customer leads</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Sales and retention follow-up</h2>
        </div>
        <Button variant="secondary">New lead</Button>
      </div>
      <div className="mt-6 space-y-4">
        <div className="rounded-3xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Chinedu O.</p>
          <p className="text-sm text-slate-600">+2348012345673 • Banana Island • Interested in monthly estate shopping</p>
        </div>
        <div className="rounded-3xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Ruth I.</p>
          <p className="text-sm text-slate-600">+2348012345674 • Lekki Phase 1 • Interested in personal shopping</p>
        </div>
      </div>
    </section>
  );
}

export function AdminOrderTable() {
  const { orders, updateOrder } = useOMSStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const orderStatusOptions: Array<{ value: string; label: string }> = [
    { value: 'New', label: 'New' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Market Sourcing', label: 'Market Sourcing' },
    { value: 'Purchased', label: 'Purchased' },
    { value: 'At Dispatch Point', label: 'At Dispatch Point' },
    { value: 'Out For Delivery', label: 'Out For Delivery' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const statusOptions = ['All', ...orderStatusOptions.map((option) => option.value)];

  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      const query = search.toLowerCase();
      const matchesSearch = [order.id, order.customerName, order.estate, order.address, order.assignedRider]
        .some((field) => field.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [orders, search, statusFilter]
  );

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Active orders</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Orders today</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders, customer, estate"
            className="w-full min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full min-w-[180px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4">Order #</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Assigned rider</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No orders match your search or filter.</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                  <td className="px-6 py-4 text-slate-600">{order.customerName}</td>
                  <td className="px-6 py-4 text-slate-600"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(order.grandTotal)}</td>
                  <td className="px-6 py-4 text-slate-600">{order.assignedRider || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <Link href={`/admin/orders/${order.id}`} className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
                      View details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnalyticsSummaryPanel() {
  const { orders, estateBatches, customers } = useOMSStore();
  const salesThisMonth = orders.filter((order) => new Date(order.createdAt).getMonth() === new Date().getMonth()).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);
  const activeCustomers = customers.length;

  const topEstates = estateBatches.slice(0, 3).map((batch) => ({
    estate: batch.estate,
    orders: batch.orders,
    revenue: batch.totalValue
  }));

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { label: 'Orders this month', value: salesThisMonth },
          { label: 'Total revenue', value: totalRevenue },
          { label: 'Active customers', value: activeCustomers }
        ].map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{metric.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Top estates</p>
          <div className="mt-4 space-y-4">
            {topEstates.map((estate) => (
              <div key={estate.estate} className="rounded-3xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{estate.estate}</p>
                <p className="text-sm text-slate-600">{estate.orders} orders • ₦{estate.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Top customer estates</p>
          <div className="mt-4 space-y-4">
            {topEstates.map((estate) => (
              <div key={estate.estate} className="rounded-3xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{estate.estate}</p>
                <p className="text-sm text-slate-600">Revenue: ₦{estate.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export function RevenueChart() {
  const { orders } = useOMSStore();
  const revenueTrend = orders
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((order) => ({
      period: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: order.grandTotal,
      profit: Math.max(order.grandTotal * 0.2, 0)
    }));

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Revenue growth</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Weekly revenue and profit trends</h2>
        </div>
      </div>
      <div className="mt-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueTrend} margin={{ top: 24, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#475569" />
            <YAxis stroke="#475569" tickFormatter={(value) => `₦${value / 1000}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function EstatePerformance() {
  const { estateBatches } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">Estate performance</h2>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {estateBatches.map((batch) => (
          <div key={batch.id} className="rounded-3xl border border-slate-200 p-6">
            <p className="text-lg font-semibold text-slate-950">{batch.estate}</p>
            <p className="mt-2 text-sm text-slate-600">Orders: {batch.orders}</p>
            <p className="text-sm text-slate-600">Revenue: ₦{batch.totalValue.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EstateBatchingPanel() {
  const { estateBatches } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Estate batching</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Group orders by estate and assign riders</h2>
        </div>
        <Button variant="secondary">Create new batch</Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Estate</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Total value</th>
              <th className="px-6 py-4">Rider</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {estateBatches.map((batch) => (
              <tr key={batch.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{batch.id}</td>
                <td className="px-6 py-4 text-slate-600">{batch.estate}</td>
                <td className="px-6 py-4 text-slate-600">{batch.orders}</td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(batch.totalValue)}</td>
                <td className="px-6 py-4 text-slate-600">{batch.assignedRider}</td>
                <td className="px-6 py-4 text-slate-600">{batch.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RunnerTaskPanel() {
  const { runnerTasks } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Runner tasks</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Track sourcing tasks and purchase status</h2>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {runnerTasks.map((task) => (
          <div key={task.id} className="rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">{task.task}</p>
                <p className="text-sm text-slate-500">{task.orderId} • {task.assignedTo}</p>
              </div>
              <StatusBadge status={task.status} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
              <span>Purchase cost: {formatCurrency(task.purchaseCost)}</span>
              <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
              <span>{task.notes}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RiderAssignmentPanel() {
  const { riderAssignments } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Rider assignments</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Delivery status and proof tracking</h2>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4">Assignment</th>
              <th className="px-6 py-4">Estate</th>
              <th className="px-6 py-4">Rider</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {riderAssignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{assignment.orderId}</td>
                <td className="px-6 py-4 text-slate-600">{assignment.estate}</td>
                <td className="px-6 py-4 text-slate-600">{assignment.assignedRider}</td>
                <td className="px-6 py-4 text-slate-600">{assignment.status}</td>
                <td className="px-6 py-4 text-slate-600">{assignment.proofUrl ? <a className="text-brand-600 hover:underline" href={assignment.proofUrl}>View proof</a> : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FinanceSummaryPanel() {
  const { orders } = useOMSStore();
  const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);
  const estimatedProfit = totalRevenue * 0.12;
  const unpaidOrders = orders.filter((order) => order.status !== 'Delivered').length;

  const financeCategories = [
    { name: 'Revenue', amount: totalRevenue },
    { name: 'Margins', amount: estimatedProfit },
    { name: 'Pending collections', amount: orders.filter((order) => order.status === 'Confirmed').length * 5000 },
    { name: 'Operational costs', amount: totalRevenue * 0.35 }
  ];

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-4">
        {financeCategories.map((item) => (
          <div key={item.name} className="rounded-3xl border border-slate-200 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">{item.name}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Profit estimate</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(estimatedProfit)}</h2>
          </div>
          <div className="text-sm text-slate-600">Outstanding orders: {unpaidOrders}</div>
        </div>
      </div>
    </section>
  );
}

export function ExportReportsPanel() {
  const { orders, runnerTasks, riderAssignments } = useOMSStore();

  const reports = [
    {
      title: 'Daily order summary',
      description: 'Download the full orders ledger for admin review.',
      label: 'Download orders',
      action: () => downloadCsv('kiakia-orders.csv', exportOrdersAsCsv(orders))
    },
    {
      title: 'Runner performance',
      description: 'Export runner tasks, purchase costs and sourcing status.',
      label: 'Download runner tasks',
      action: () => downloadCsv('runner-tasks.csv', exportRunnerTasksAsCsv(runnerTasks))
    },
    {
      title: 'Rider delivery report',
      description: 'View delivery completion and proof statuses.',
      label: 'Download rider assignments',
      action: () => downloadCsv('rider-assignments.csv', exportRiderAssignmentsAsCsv(riderAssignments))
    }
  ];

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Reporting toolkit</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Export and share operational reports</h2>
          <p className="mt-3 text-slate-600">Download daily and weekly summaries for finance, batches, and delivery performance.</p>
        </div>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.title} className="rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{report.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{report.description}</p>
                </div>
                <Button variant="secondary" onClick={report.action}>{report.label}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminCustomerTable() {
  const { customers } = useOMSStore();

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Customer CRM</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Customer profiles and order history</h2>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Estate</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
                <td className="px-6 py-4 text-slate-600">{customer.phone}</td>
                <td className="px-6 py-4 text-slate-600">{customer.estate}</td>
                <td className="px-6 py-4 text-slate-600">{customer.totalOrders}</td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(customer.lifetimeSpend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

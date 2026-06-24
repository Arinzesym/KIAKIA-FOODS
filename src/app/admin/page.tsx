import Link from 'next/link';

export default function AdminIndexPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Admin workspace</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Operate the business from one roof.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          KiaKia Foods administrators can manage customers, orders, revenue, and operations with real-time insights.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/admin/dashboard" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">Open dashboard</Link>
          <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-2xl border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50">Manage orders</Link>
          <Link href="/admin/team" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Team logins</Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function CustomerIndexPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Customer Portal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Welcome back to KiaKia Foods.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          Access your saved orders, estate preferences, and place smart WhatsApp shopping requests from one secure dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/customer/auth/login" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">Login</Link>
          <Link href="/customer/auth/register" className="inline-flex items-center justify-center rounded-2xl border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50">Create account</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Saved Shopping Lists</h2>
          <p className="mt-3 text-slate-600">Create and repeat frequent orders in a click once you’re logged in.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Order History</h2>
          <p className="mt-3 text-slate-600">Review previous orders and reorder quickly with estate pricing applied.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Profile & Address</h2>
          <p className="mt-3 text-slate-600">Keep your profile, estate, and delivery address updated for speedy deliveries.</p>
        </div>
      </div>
    </div>
  );
}

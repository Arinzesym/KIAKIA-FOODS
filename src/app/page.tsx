import Link from 'next/link';

const modules = [
  { title: 'Order Management', description: 'Create and update orders, track status, and assign delivery teams.', href: '/admin/orders' },
  { title: 'Estate Batching', description: 'View estate order clusters, create delivery batches, and assign riders.', href: '/admin/estate-batching' },
  { title: 'Runner Tasks', description: 'Manage sourcing tasks, record market purchases, and monitor progress.', href: '/admin/runners' },
  { title: 'Runner Portal', description: 'View orders ready for sourcing and delivery from the runner perspective.', href: '/runner' },
  { title: 'Customer CRM', description: 'Review customer profiles, order history, and repeat customer performance.', href: '/admin/customers' },
  { title: 'Analytics & Finance', description: 'Review operational metrics, revenue, and profit performance.', href: '/admin/analytics' }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_0.45fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">KiaKia Foods operations</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Internal Operations Management System
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              This dashboard is built for administrators, dispatch managers, market runners, and delivery riders. Customers continue placing orders through WhatsApp while your team manages sourcing, batching, deliveries, and reporting.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/admin/dashboard" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                Open dashboard
              </Link>
              <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50">
                Manage orders
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-brand-50 p-8 shadow-inner shadow-brand-200/30">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Built for scale</p>
            <ul className="mt-6 space-y-4 text-slate-700">
              <li>• Thousands of orders across multiple estates and cities</li>
              <li>• Estate delivery batching and rider assignment workflow</li>
              <li>• Customer CRM, runner sourcing, and finance tracking</li>
              <li>• Export-ready reporting for daily and weekly operations</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.title} href={module.href} className="group rounded-[2rem] border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-lg">
            <h2 className="text-xl font-semibold text-slate-950 group-hover:text-brand-700">{module.title}</h2>
            <p className="mt-3 text-slate-600">{module.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

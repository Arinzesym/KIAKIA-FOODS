import { PageSection } from '@/components/PageSection';

const story = [
  {
    title: 'Our Story',
    description:
      'KiaKia Foods started as a neighborhood delivery service that grew into the trusted food and grocery partner for homes and estates across Nigeria.'
  },
  {
    title: 'Mission',
    description: 'To deliver fast, affordable, and dependable grocery support with a friendly local service experience.'
  },
  {
    title: 'Vision',
    description: 'Become the preferred estate grocery operating system for households, businesses, and premium deliveries.'
  }
];

export default function AboutPage() {
  return (
    <div className="space-y-16 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">About KiaKia Foods</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Built for households, estates, and busy families.</h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-700">
          KiaKia Foods blends estate-focused service with intelligent order operations, giving customers and teams the tools they need to shop, track, and manage deliveries.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {story.map((item) => (
          <PageSection key={item.title} title={item.title} description={item.description} />
        ))}
      </div>

      <div className="grid gap-6 rounded-3xl bg-brand-600 p-10 text-white lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold">Service coverage for every estate.</h2>
          <p className="mt-4 text-base leading-7 text-brand-100">
            We operate across gated communities, apartment estates, and family compounds with a delivery system designed for convenience and safety.
          </p>
        </div>
        <ul className="space-y-3 text-sm leading-7 text-brand-100/90">
          <li>• Estate-safe contactless delivery</li>
          <li>• Estate price rules and neighborhood support</li>
          <li>• WhatsApp order submission for fast service</li>
          <li>• Trusted team management and audit-ready reporting</li>
        </ul>
      </div>
    </div>
  );
}

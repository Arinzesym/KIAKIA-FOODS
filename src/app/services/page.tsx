import { ServiceCard } from '@/components/ServiceCard';

const services = [
  {
    title: 'Grocery Shopping',
    description: 'Full-service shopping for household staples, beverages, and premium groceries delivered on your schedule.'
  },
  {
    title: 'Delivery Services',
    description: 'Fast, estate-safe delivery with tracking and real-time updates for every order.'
  },
  {
    title: 'Personal Shopping',
    description: 'Personalized shopping assistance for families, offices, and elite customers.'
  },
  {
    title: 'Estate Deliveries',
    description: 'Specialized service packages for gated communities, churches, and corporate estates.'
  }
];

export default function ServicesPage() {
  return (
    <div className="space-y-16 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Services</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Solutions that fit modern estate life.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          KiaKia Foods offers on-demand grocery and delivery services built for families, estate managers, and busy offices.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {services.map((service) => (
          <ServiceCard key={service.title} title={service.title} description={service.description} />
        ))}
      </div>
    </div>
  );
}

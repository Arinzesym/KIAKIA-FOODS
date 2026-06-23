import { ContactForm } from '@/components/forms/ContactForm';

export default function ContactPage() {
  return (
    <div className="space-y-16 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Contact KiaKia Foods</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Talk to the team behind the service.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Reach out for support, estate partnership, or to set up your customer account.
        </p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <ContactForm />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Contact Information</h2>
          <p className="mt-4 text-slate-700">
            Phone: <a href="tel:+2348000000000" className="font-medium text-brand-600">+234 800 000 0000</a>
          </p>
          <p className="mt-2 text-slate-700">Email: <a href="mailto:hello@kiakiafoods.com" className="font-medium text-brand-600">hello@kiakiafoods.com</a></p>
          <p className="mt-8 text-slate-700">WhatsApp your order directly with a click and get instant support for your delivery.</p>
          <div className="mt-6 flex flex-col gap-4">
            <a className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-lg shadow-brand-500/10 transition hover:bg-brand-700" href="https://wa.me/2348000000000" target="_blank" rel="noreferrer noopener">WhatsApp Support</a>
            <a className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-slate-900 transition hover:border-brand-600 hover:text-brand-600" href="mailto:hello@kiakiafoods.com">Send Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}

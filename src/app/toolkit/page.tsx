'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const sections = [
  {
    title: 'B2C WhatsApp ordering',
    body: 'Let individual customers place orders via WhatsApp, then aggregate those orders by household and estate for efficient fulfillment.'
  },
  {
    title: 'Market-sourced fulfillment',
    body: 'Send a market runner to collect all B2C orders from the local market and bring the items to a central estate dispatch point for grouped delivery.'
  },
  {
    title: 'Individual order revenue',
    body: 'Charge each household for its own order while using grouped estate deliveries to reduce logistics cost and protect margin.'
  },
  {
    title: 'Capital-light launch',
    body: 'Own the ordering platform and delivery coordination, but keep inventory and transport lean with market sourcing and estate grouping.'
  }
];

const steps = [
  {
    label: 'Pilot one estate',
    detail: 'Start with direct B2C orders from households in a single estate using WhatsApp as the ordering channel.'
  },
  {
    label: 'Collect household orders',
    detail: 'Capture each resident order individually and group them by estate before purchase.'
  },
  {
    label: 'Source from the market',
    detail: 'Send a market runner to the local market, purchase the complete estate batch, and return to the estate dispatch point.'
  },
  {
    label: 'Deliver grouped estate orders',
    detail: 'Distribute goods estate-by-estate and house-by-house while maintaining order accuracy for each customer.'
  }
];

export default function ToolkitPage() {
  return (
    <div className="space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl"
      >
        <div className="space-y-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600">KiaKia Toolkit</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            B2C WhatsApp delivery model for estate-grouped fulfillment
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-700">
            A practical business toolkit for your direct customer ordering flow, market sourcing, and low-cost estate delivery grouping.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/customer" className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Start customer flow
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50">
              Contact support
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-10 text-white shadow-lg shadow-slate-950/10">
          <h2 className="text-3xl font-semibold">Why this model works</h2>
          <ul className="mt-6 space-y-4 text-slate-200">
            <li>• Direct B2C WhatsApp orders keep the product easy to use for customers.</li>
            <li>• Grouped estate delivery reduces transport cost while preserving individual order revenue.</li>
            <li>• Customers pay for each household order while deliveries are batched by estate for efficiency.</li>
            <li>• The platform and operational flow are the scalable advantage, not inventory ownership.</li>
          </ul>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-950">Toolkit in this page</h2>
          <p className="mt-4 text-slate-600 leading-7">
            This toolkit is structured for fast execution: a clear target market, a capital-light revenue model, launch steps you can implement immediately, and the pricing levers that maximize profit while protecting margins.
          </p>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h3 className="text-2xl font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-4 text-slate-600 leading-7">{item.body}</p>
          </motion.div>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="space-y-8 rounded-[2rem] border border-slate-200 bg-brand-50 p-10 shadow-lg"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Launch roadmap</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">The first 90 days</h2>
          <p className="mt-4 text-slate-700 leading-7">
            Execute this advisory model immediately: pilot one estate, align suppliers and delivery partners, convert the estate to subscription, and then use the first proof case to grow into neighboring estates.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.label} className="rounded-3xl bg-white p-6 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{index + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{step.label}</h3>
              <p className="mt-3 text-slate-600 leading-7">{step.detail}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="rounded-[2rem] bg-white p-10 shadow-xl"
      >
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Frank-approved plan</p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">A practical model for Frank and you</h2>
          </div>
          <div className="space-y-4 text-slate-600">
            <p>Frank already agrees: the best path is direct B2C WhatsApp ordering, market-sourced fulfillment, and grouped estate deliveries.</p>
            <p>Keep the market model simple and defensible with household order fees, delivery coordination, and efficient estate grouping.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

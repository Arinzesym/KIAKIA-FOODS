'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const services = [
  {
    title: 'Grocery Shopping',
    description: 'Curated grocery orders built for homes and estates, with estate-specific preferences.'
  },
  {
    title: 'Delivery Services',
    description: 'Fast, safe delivery to gates, doors, or reception points across service areas.'
  },
  {
    title: 'Personal Shopping',
    description: 'Personal shopping assistance for families and corporate users who need expert support.'
  },
  {
    title: 'Estate Deliveries',
    description: 'Tailored delivery packages for gated communities and estate management teams.'
  }
];

const benefits = [
  'Save favorite orders and reorder in one click.',
  'Estimate delivery cost instantly before checkout.',
  'Order through WhatsApp without payment gateway risks.',
  'Track estate performance and customer growth on the admin side.'
];

const testimonials = [
  {
    quote: 'KiaKia Foods makes estate shopping simple — we can reorder my weekly list in seconds.',
    name: 'Amina O.',
    title: 'Estate Manager'
  },
  {
    quote: 'The dashboard helps me see order totals and keeps our deliveries on schedule.',
    name: 'David N.',
    title: 'Operations Lead'
  }
];

const faqs = [
  {
    question: 'Do I need to pay online?',
    answer: 'No. All orders are submitted through WhatsApp so you can pay cash on delivery or arrange payment directly with the team.'
  },
  {
    question: 'Can I save multiple addresses?',
    answer: 'Yes. The customer portal supports saving estates and delivery addresses for repeat orders.'
  },
  {
    question: 'How do I receive order updates?',
    answer: 'You receive status updates by WhatsApp or email once the administrator updates your order status.'
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 }
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-500 to-accent-600 px-6 py-14 text-white shadow-xl sm:px-10 lg:px-14">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-0 top-1/2 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-100/85"
          >
            KiaKia Foods Business OS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Fast grocery and estate delivery operations for modern Nigerian homes.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-6 text-lg leading-8 text-brand-100/90"
          >
            Build, manage, and submit orders through WhatsApp while giving customers and admins a secure, branded platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a href="/customer" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Start Order
            </a>
            <a href="/admin" className="inline-flex items-center justify-center rounded-2xl border border-white/70 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              Admin Workspace
            </a>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur-xl sm:p-10"
        >
          <p className="text-sm uppercase tracking-[0.28em] text-brand-100/80">Live Order Summary</p>
          <div className="mt-6 space-y-4 text-white">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-sm text-brand-100/90">Shopping cost</p>
              <p className="mt-2 text-3xl font-semibold">₦124,500</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-sm text-brand-100/80">Service fee</p>
                <p className="mt-2 text-xl font-semibold">₦1,200</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-sm text-brand-100/80">Delivery fee</p>
                <p className="mt-2 text-xl font-semibold">₦1,500</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function ServiceHighlights() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.7 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">How it works</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A simple flow for customers and admin teams.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-700">
          From customer account setup to automated WhatsApp order forwarding and admin order tracking, the platform manages the entire delivery lifecycle.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-4">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.15 * index, duration: 0.6 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-slate-950">{service.title}</h3>
            <p className="mt-3 text-slate-600">{service.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function BenefitGrid() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.7 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div className="grid gap-6 rounded-[2rem] bg-slate-950 px-8 py-10 text-white sm:px-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-300">Why KiaKia Foods platform?</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Designed for operations and customer convenience.</h2>
          <p className="mt-4 max-w-xl leading-8 text-slate-200">
            A branded, estate-safe solution that keeps order totals, delivery fees, and customer records aligned across every sales and fulfillment workflow.
          </p>
        </div>
        <div className="grid gap-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="rounded-3xl bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20"
            >
              <p className="text-base leading-7 text-slate-100">{benefit}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function Testimonials() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.7 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Testimonials</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Trusted by estate teams and busy shoppers.</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.12 * index, duration: 0.6 }}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <p className="text-lg leading-8 text-slate-700">“{testimonial.quote}”</p>
            <div className="mt-6">
              <p className="font-semibold text-slate-950">{testimonial.name}</p>
              <p className="text-sm text-slate-500">{testimonial.title}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function FaqSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.7 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">FAQs</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Common questions about the platform.</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {faqs.map((item, index) => (
          <motion.div
            key={item.question}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
            <p className="mt-3 text-slate-600">{item.answer}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function ContactBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="mx-auto max-w-7xl rounded-[2rem] bg-brand-50 p-10 sm:p-14"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Ready to order?</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Submit your shopping request through WhatsApp instantly.</h2>
          <p className="mt-4 text-slate-700">Your details, products, delivery address, and total are formatted for the KiaKia Foods operations team.</p>
        </div>
        <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
          Contact support
        </Link>
      </div>
    </motion.section>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const contactSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  message: z.string().min(10, 'Please include a message')
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  function onSubmit(data: ContactFormValues) {
    setSent(true);
    reset();
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">Send a message</h2>
      <p className="mt-3 text-slate-600">Share your order request, questions, or estate delivery details.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Full name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
        <label className="grid gap-2 text-sm font-medium text-slate-900">
          <span>Message</span>
          <textarea
            rows={5}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            {...register('message')}
          />
          {errors.message ? <span className="text-xs text-rose-600">{errors.message.message}</span> : null}
        </label>
        <Button type="submit" className="w-full">Send message</Button>
        {sent && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Message queued. We will follow up soon.</p>}
      </form>
    </div>
  );
}

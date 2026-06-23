'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const settingsSchema = z.object({
  businessName: z.string().min(2),
  whatsappNumber: z.string().min(6),
  serviceFee: z.number().min(0),
  deliveryFee: z.number().min(0)
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const [message, setMessage] = useState<string>('');
  const { register, handleSubmit, formState: { errors } } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: 'KiaKia Foods',
      whatsappNumber: '+2348000000000',
      serviceFee: 1200,
      deliveryFee: 1500
    }
  });

  function onSubmit(values: SettingsValues) {
    setMessage('Settings saved. Changes will reflect across the platform.');
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 shadow-lg shadow-slate-200/50">
      <h1 className="text-3xl font-semibold text-slate-950">Settings</h1>
      <p className="mt-3 text-slate-600">Edit brand details, WhatsApp numbers, and fee rules centrally.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <Input label="Business Name" {...register('businessName')} error={errors.businessName?.message} />
        <Input label="WhatsApp Number" {...register('whatsappNumber')} error={errors.whatsappNumber?.message} />
        <Input label="Service Fee (₦)" type="number" {...register('serviceFee', {valueAsNumber:true})} error={errors.serviceFee?.message} />
        <Input label="Delivery Fee (₦)" type="number" {...register('deliveryFee', {valueAsNumber:true})} error={errors.deliveryFee?.message} />
        <Button type="submit" className="w-full">Save settings</Button>
      </form>
      {message ? <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loadAdminSettings, saveAdminSettings } from '@/lib/utils';

const settingsSchema = z.object({
  businessName: z.string().min(2),
  whatsappNumber: z.string().min(6),
  businessAccountNumber: z.string().min(4),
  serviceFee: z.number().min(0),
  deliveryFee: z.number().min(0)
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const [message, setMessage] = useState<string>('');
  const [savedSettings, setSavedSettings] = useState<SettingsValues | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: 'KiaKia Foods',
      whatsappNumber: '+2348000000000',
      businessAccountNumber: '1234567890',
      serviceFee: 1200,
      deliveryFee: 1500
    }
  });

  useEffect(() => {
    const settings = loadAdminSettings();
    if (settings) {
      reset(settings);
      setSavedSettings(settings);
    }
  }, [reset]);

  function onSubmit(values: SettingsValues) {
    saveAdminSettings(values);
    setSavedSettings(values);
    setMessage('✓ Settings saved successfully! Changes will reflect across the platform.');
    setTimeout(() => setMessage(''), 4000);
  }

  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">Configuration</p>
        <h1 className="mt-3 text-3xl font-bold">Business Settings</h1>
        <p className="mt-2 text-brand-100">Manage your business details, account numbers, and fee structure</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl bg-white p-8 shadow-sm space-y-6">
            {/* Business Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">📋</div>
                <h2 className="text-lg font-semibold text-slate-950">Business Information</h2>
              </div>
              <Input 
                label="Business Name" 
                placeholder="e.g., KiaKia Foods"
                {...register('businessName')} 
                error={errors.businessName?.message} 
              />
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">💬</div>
                <h2 className="text-lg font-semibold text-slate-950">Communication</h2>
              </div>
              <Input 
                label="WhatsApp Number" 
                placeholder="+2348000000000"
                {...register('whatsappNumber')} 
                error={errors.whatsappNumber?.message}
                helperText="Your business WhatsApp number for customer communications"
              />
            </div>

            {/* Account Number Section */}
            <div className="space-y-4 pt-6 border-t border-slate-200 bg-blue-50 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">🏦</div>
                <h2 className="text-lg font-semibold text-slate-950">Account Number</h2>
              </div>
              <Input 
                label="Business Account Number" 
                placeholder="e.g., 1234567890"
                {...register('businessAccountNumber')} 
                error={errors.businessAccountNumber?.message}
                helperText="Your bank account number - this will be displayed on WhatsApp messages sent to customers for payments"
              />
              <p className="text-sm text-blue-700 bg-white p-3 rounded-lg">
                💡 <strong>Note:</strong> This account number will automatically be included when you send orders to customers via WhatsApp, making it easy for them to know where to transfer payment.
              </p>
            </div>

            {/* Fee Structure Section */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">💰</div>
                <h2 className="text-lg font-semibold text-slate-950">Fee Structure</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Service Fee (₦)" 
                  type="number" 
                  placeholder="1200"
                  {...register('serviceFee', { valueAsNumber: true })} 
                  error={errors.serviceFee?.message} 
                  helperText="Service fee per order"
                />
                <Input 
                  label="Delivery Fee (₦)" 
                  type="number" 
                  placeholder="1500"
                  {...register('deliveryFee', { valueAsNumber: true })} 
                  error={errors.deliveryFee?.message}
                  helperText="Delivery fee per order"
                />
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <Button type="submit" className="flex-1">💾 Save All Settings</Button>
            </div>

            {message && (
              <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                message.includes('successfully') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Settings Preview Card */}
        {savedSettings && (
          <div className="rounded-3xl bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm border border-slate-200 h-fit sticky top-24">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">📊 Current Settings</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">Business</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{savedSettings.businessName}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">WhatsApp</p>
                <a href={`https://wa.me/${savedSettings.whatsappNumber.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer"
                  className="mt-2 text-sm font-semibold text-green-600 hover:text-green-700 break-all">
                  {savedSettings.whatsappNumber}
                </a>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
                <p className="text-xs uppercase text-blue-600 font-semibold">Account Number</p>
                <p className="mt-2 text-lg font-bold text-slate-950 font-mono">{savedSettings.businessAccountNumber}</p>
                <p className="text-xs text-blue-600 mt-2">Will be shown in WhatsApp messages</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white p-4 border border-slate-200">
                  <p className="text-xs uppercase text-slate-500 font-semibold">Service Fee</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">₦{savedSettings.serviceFee.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 border border-slate-200">
                  <p className="text-xs uppercase text-slate-500 font-semibold">Delivery Fee</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">₦{savedSettings.deliveryFee.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

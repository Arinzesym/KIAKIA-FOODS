'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  defaultBusinessSettings,
  fetchBusinessSettingsFromServer,
  loadBusinessSettings,
  saveBusinessSettingsToServer
} from '@/lib/businessSettings';
import type { BusinessSettings } from '@/lib/types';

const settingsSchema = z.object({
  businessName: z.string().min(2),
  whatsappNumber: z.string().min(6),
  businessAccountNumber: z.string().min(4),
  serviceFee: z.number().min(0),
  defaultDeliveryFee: z.number().min(0),
  customDeliveryFee: z.number().min(0),
  runnerBonusPercentage: z.number().min(0).max(100),
  weekdaySourcingDay: z.string().min(2),
  weekendSourcingDay: z.string().min(2),
  deliveryWindowOne: z.string().min(5),
  deliveryWindowTwo: z.string().min(5),
  deliveryWindowThree: z.string().min(5),
  currency: z.string().min(3).max(5)
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const [message, setMessage] = useState<string>('');
  const [savedSettings, setSavedSettings] = useState<SettingsValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: defaultBusinessSettings.businessName,
      whatsappNumber: defaultBusinessSettings.whatsappNumber,
      businessAccountNumber: defaultBusinessSettings.businessAccountNumber,
      serviceFee: defaultBusinessSettings.serviceFee,
      defaultDeliveryFee: defaultBusinessSettings.defaultDeliveryFee,
      customDeliveryFee: defaultBusinessSettings.customDeliveryFee,
      runnerBonusPercentage: defaultBusinessSettings.runnerBonusPercentage,
      weekdaySourcingDay: defaultBusinessSettings.marketDays[0]?.defaultSourcingDay ?? 'Tuesday',
      weekendSourcingDay: defaultBusinessSettings.marketDays[1]?.defaultSourcingDay ?? 'Saturday',
      deliveryWindowOne: defaultBusinessSettings.deliveryWindows[0] ?? '09:00 - 12:00',
      deliveryWindowTwo: defaultBusinessSettings.deliveryWindows[1] ?? '12:00 - 15:00',
      deliveryWindowThree: defaultBusinessSettings.deliveryWindows[2] ?? '15:00 - 18:00',
      currency: defaultBusinessSettings.currency
    }
  });

  useEffect(() => {
    let active = true;

    const hydrateSettings = async () => {
      const localSettings = loadBusinessSettings();
      const localValues: SettingsValues = {
        businessName: localSettings.businessName,
        whatsappNumber: localSettings.whatsappNumber,
        businessAccountNumber: localSettings.businessAccountNumber,
        serviceFee: localSettings.serviceFee,
        defaultDeliveryFee: localSettings.defaultDeliveryFee,
        customDeliveryFee: localSettings.customDeliveryFee,
        runnerBonusPercentage: localSettings.runnerBonusPercentage,
        weekdaySourcingDay: localSettings.marketDays[0]?.defaultSourcingDay ?? 'Tuesday',
        weekendSourcingDay: localSettings.marketDays[1]?.defaultSourcingDay ?? 'Saturday',
        deliveryWindowOne: localSettings.deliveryWindows[0] ?? '09:00 - 12:00',
        deliveryWindowTwo: localSettings.deliveryWindows[1] ?? '12:00 - 15:00',
        deliveryWindowThree: localSettings.deliveryWindows[2] ?? '15:00 - 18:00',
        currency: localSettings.currency
      };

      if (active) {
        reset(localValues);
        setSavedSettings(localValues);
      }

      const serverSettings = await fetchBusinessSettingsFromServer();
      const serverValues: SettingsValues = {
        businessName: serverSettings.businessName,
        whatsappNumber: serverSettings.whatsappNumber,
        businessAccountNumber: serverSettings.businessAccountNumber,
        serviceFee: serverSettings.serviceFee,
        defaultDeliveryFee: serverSettings.defaultDeliveryFee,
        customDeliveryFee: serverSettings.customDeliveryFee,
        runnerBonusPercentage: serverSettings.runnerBonusPercentage,
        weekdaySourcingDay: serverSettings.marketDays[0]?.defaultSourcingDay ?? 'Tuesday',
        weekendSourcingDay: serverSettings.marketDays[1]?.defaultSourcingDay ?? 'Saturday',
        deliveryWindowOne: serverSettings.deliveryWindows[0] ?? '09:00 - 12:00',
        deliveryWindowTwo: serverSettings.deliveryWindows[1] ?? '12:00 - 15:00',
        deliveryWindowThree: serverSettings.deliveryWindows[2] ?? '15:00 - 18:00',
        currency: serverSettings.currency
      };

      if (active) {
        reset(serverValues);
        setSavedSettings(serverValues);
      }
    };

    void hydrateSettings();

    return () => {
      active = false;
    };
  }, [reset]);

  async function onSubmit(values: SettingsValues) {
    setIsSaving(true);
    const payload: BusinessSettings = {
      businessName: values.businessName,
      whatsappNumber: values.whatsappNumber,
      businessAccountNumber: values.businessAccountNumber,
      serviceFee: values.serviceFee,
      defaultDeliveryFee: values.defaultDeliveryFee,
      customDeliveryFee: values.customDeliveryFee,
      runnerBonusPercentage: values.runnerBonusPercentage,
      marketDays: [
        { key: 'Weekday', label: 'Weekly Groceries', defaultSourcingDay: values.weekdaySourcingDay },
        { key: 'Weekend', label: 'Specialty Items', defaultSourcingDay: values.weekendSourcingDay }
      ],
      deliveryWindows: [values.deliveryWindowOne, values.deliveryWindowTwo, values.deliveryWindowThree],
      currency: values.currency.toUpperCase()
    };

    const result = await saveBusinessSettingsToServer(payload);
    setSavedSettings(values);
    setMessage(result.ok
      ? '✓ Settings saved successfully! Changes synced to cloud.'
      : `⚠ Saved locally. Cloud sync failed: ${result.error}`);
    setIsSaving(false);
    setTimeout(() => setMessage(''), 4000);
  }

  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">Configuration</p>
        <h1 className="mt-3 text-3xl font-bold">Business Settings</h1>
        <p className="mt-2 text-brand-100">Manage delivery fees, runner bonus, market day sourcing cycles, and operations defaults.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl bg-white p-8 shadow-sm space-y-6">
            {/* Business Information Section */}
            <div className="space-y-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-600">1</div>
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
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-600">2</div>
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
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">3</div>
                <h2 className="text-lg font-semibold text-slate-950">Account Number</h2>
              </div>
              <Input 
                label="Business Account Number" 
                placeholder="e.g., 1234567890"
                {...register('businessAccountNumber')} 
                error={errors.businessAccountNumber?.message}
                helperText="Your bank account number - this will be displayed on WhatsApp messages sent to customers for payments"
              />
              <p className="rounded-lg bg-white p-3 text-sm text-blue-700">
                <strong>Note:</strong> This account number is injected into WhatsApp order summaries.
              </p>
            </div>

            {/* Fee Structure Section */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-600">4</div>
                <h2 className="text-lg font-semibold text-slate-950">Fee and Margin Settings</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input 
                  label="Service Fee (₦)" 
                  type="number" 
                  placeholder="1200"
                  {...register('serviceFee', { valueAsNumber: true })} 
                  error={errors.serviceFee?.message} 
                  helperText="Service fee per order"
                />
                <Input 
                  label="Default Delivery Fee (₦)" 
                  type="number" 
                  placeholder="1500"
                  {...register('defaultDeliveryFee', { valueAsNumber: true })} 
                  error={errors.defaultDeliveryFee?.message}
                  helperText="Delivery fee per order"
                />
                <Input
                  label="Custom Delivery Fee (₦)"
                  type="number"
                  placeholder="3500"
                  {...register('customDeliveryFee', { valueAsNumber: true })}
                  error={errors.customDeliveryFee?.message}
                  helperText="Premium fee applied when custom delivery is selected"
                />
                <Input
                  label="Runner Bonus (%)"
                  type="number"
                  placeholder="5"
                  {...register('runnerBonusPercentage', { valueAsNumber: true })}
                  error={errors.runnerBonusPercentage?.message}
                  helperText="Used by budget engine for runner incentive"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">5</div>
                <h2 className="text-lg font-semibold text-slate-950">Market Days and Delivery Windows</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Weekday sourcing day" {...register('weekdaySourcingDay')} error={errors.weekdaySourcingDay?.message} />
                <Input label="Weekend sourcing day" {...register('weekendSourcingDay')} error={errors.weekendSourcingDay?.message} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="Delivery window 1" {...register('deliveryWindowOne')} error={errors.deliveryWindowOne?.message} />
                <Input label="Delivery window 2" {...register('deliveryWindowTwo')} error={errors.deliveryWindowTwo?.message} />
                <Input label="Delivery window 3" {...register('deliveryWindowThree')} error={errors.deliveryWindowThree?.message} />
              </div>
              <Input label="Currency" {...register('currency')} error={errors.currency?.message} helperText="ISO code e.g. NGN" />
            </div>

            <div className="pt-6 flex gap-3">
              <Button type="submit" className="flex-1" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save All Settings'}</Button>
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">Current Settings</p>
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
                  <p className="text-xs uppercase text-slate-500 font-semibold">Default Delivery</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">₦{savedSettings.defaultDeliveryFee.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">Custom Delivery Fee</p>
                <p className="mt-2 text-lg font-bold text-slate-950">₦{savedSettings.customDeliveryFee.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">Runner Bonus</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{savedSettings.runnerBonusPercentage}%</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">Market Days</p>
                <p className="mt-2 text-sm text-slate-700">Weekday: {savedSettings.weekdaySourcingDay}</p>
                <p className="text-sm text-slate-700">Weekend: {savedSettings.weekendSourcingDay}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs uppercase text-slate-500 font-semibold">Windows</p>
                <p className="mt-2 text-xs text-slate-700">{savedSettings.deliveryWindowOne}</p>
                <p className="text-xs text-slate-700">{savedSettings.deliveryWindowTwo}</p>
                <p className="text-xs text-slate-700">{savedSettings.deliveryWindowThree}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

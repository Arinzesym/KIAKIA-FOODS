'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateGrandTotal, calculateSubtotal, generateOrderId } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { useOMSStore } from '@/lib/StoreContext';
import type { OrderItem, OrderRecord } from '@/lib/types';
import { getMarketDayProductLine, loadBusinessSettings } from '@/lib/businessSettings';
import { calculateShoppingBudgetMetrics } from '@/lib/marginEngine';

const orderCreateSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(10),
  estate: z.string().min(2),
  address: z.string().min(5),
  whatsapp: z.string().min(10),
  marketDay: z.enum(['Weekday', 'Weekend']),
  productLine: z.enum(['Weekly Groceries', 'Specialty Items']),
  assignedRunner: z.string().optional(),
  shoppingBudget: z.number().min(0),
  actualSpend: z.number().min(0),
  customDelivery: z.boolean().optional(),
  customDeliveryReason: z.string().optional(),
  customDeliveryRequestedDate: z.string().optional(),
  serviceFee: z.number().min(0),
  deliveryFee: z.number().min(0),
  additionalCharges: z.number().min(0),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(2),
      quantity: z.number().min(1),
      price: z.number().min(0)
    })
  ).min(1)
});

type OrderCreateValues = z.infer<typeof orderCreateSchema>;

export default function AdminOrderCreatePage() {
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { addOrder } = useOMSStore();
  const settings = loadBusinessSettings();
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<OrderCreateValues>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      estate: '',
      address: '',
      whatsapp: '',
      marketDay: 'Weekday',
      productLine: 'Weekly Groceries',
      assignedRunner: '',
      shoppingBudget: 0,
      actualSpend: 0,
      customDelivery: false,
      customDeliveryReason: '',
      customDeliveryRequestedDate: '',
      serviceFee: settings.serviceFee,
      deliveryFee: settings.defaultDeliveryFee,
      additionalCharges: 0,
      items: [
        { id: 'I-001', name: 'Item name', quantity: 1, price: 0 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({ name: 'items', control });
  const items = watch('items');
  const serviceFee = watch('serviceFee');
  const deliveryFee = watch('deliveryFee');
  const additionalCharges = watch('additionalCharges');
  const marketDay = watch('marketDay');
  const customDelivery = watch('customDelivery');
  const shoppingBudget = watch('shoppingBudget');
  const actualSpend = watch('actualSpend');
  const subtotal = useMemo(() => calculateSubtotal(items as OrderItem[]), [items]);
  const grandTotal = useMemo(
    () => calculateGrandTotal(
      items as OrderItem[],
      Number(serviceFee),
      Number(deliveryFee) + (customDelivery ? settings.customDeliveryFee : 0),
      Number(additionalCharges)
    ),
    [items, serviceFee, deliveryFee, additionalCharges, customDelivery, settings.customDeliveryFee]
  );
  const budgetMetrics = useMemo(
    () => calculateShoppingBudgetMetrics(Number(shoppingBudget), Number(actualSpend), settings.runnerBonusPercentage),
    [actualSpend, settings.runnerBonusPercentage, shoppingBudget]
  );

  function onSubmit(values: OrderCreateValues) {
    const orderId = generateOrderId();
    const normalizedItems = values.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0)
    }));
    const computedSubtotal = calculateSubtotal(normalizedItems as OrderItem[]);
    const computedGrandTotal = calculateGrandTotal(
      normalizedItems as OrderItem[],
      Number(values.serviceFee),
      Number(values.deliveryFee) + (values.customDelivery ? settings.customDeliveryFee : 0),
      Number(values.additionalCharges)
    );

    const newOrder: OrderRecord = {
      id: orderId,
      orderNumber: orderId,
      customerId: '',
      customerName: values.customerName,
      phone: values.phone,
      email: '',
      whatsapp: values.whatsapp,
      estate: values.estate,
      estateCode: '',
      deliveryZone: '',
      address: values.address,
      marketDay: values.marketDay,
      productLine: values.productLine,
      assignedRunner: values.assignedRunner || '',
      shoppingBudget: budgetMetrics.allocatedBudget,
      actualSpend: budgetMetrics.actualSpend,
      shoppingMargin: budgetMetrics.shoppingMargin,
      runnerIncentive: budgetMetrics.runnerBonus,
      businessMargin: budgetMetrics.businessMargin,
      items: normalizedItems,
      quantity: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: computedSubtotal,
      serviceFee: Number(values.serviceFee),
      deliveryFee: Number(values.deliveryFee) + (values.customDelivery ? settings.customDeliveryFee : 0),
      additionalCharges: Number(values.additionalCharges),
      grandTotal: computedGrandTotal,
      status: 'New',
      paymentStatus: 'Pending',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedRider: '',
      batchId: '',
      dispatchId: '',
      purchaseCost: 0
      ,
      customDelivery: Boolean(values.customDelivery),
      customDeliveryReason: values.customDeliveryReason,
      customDeliveryRequestedDate: values.customDeliveryRequestedDate,
      customDeliveryPremiumFee: values.customDelivery ? settings.customDeliveryFee : 0,
      receiptImages: [],
      statusTimeline: [
        { status: 'NEW', at: new Date().toISOString(), by: 'Admin' }
      ]
    };

    addOrder(newOrder);
    setCreatedOrderId(orderId);
  }

  return (
    <div className="space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Order creation</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Create an order from WhatsApp requests</h1>
          </div>
          <div className="rounded-3xl bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-800">Order draft</div>
        </div>
        <p className="mt-3 text-slate-600">Capture customer details, estate information, items, and delivery cost in one internal workflow.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[0.65fr_0.35fr]">
        <div className="space-y-6 rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Customer name" {...register('customerName')} error={errors.customerName?.message?.toString()} />
            <Input label="Phone number" {...register('phone')} error={errors.phone?.message?.toString()} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Estate" {...register('estate')} error={errors.estate?.message?.toString()} />
            <Input label="WhatsApp number" {...register('whatsapp')} error={errors.whatsapp?.message?.toString()} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              Market day
              <select
                {...register('marketDay')}
                className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
              >
                <option value="Weekday">Weekday</option>
                <option value="Weekend">Weekend</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Product line
              <select
                {...register('productLine')}
                className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
              >
                <option value="Weekly Groceries">Weekly Groceries</option>
                <option value="Specialty Items">Specialty Items</option>
              </select>
            </label>
            <Input label="Assigned runner" placeholder="Runner name" {...register('assignedRunner')} />
          </div>
          <Input label="Delivery address" {...register('address')} error={errors.address?.message?.toString()} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Shopping budget" type="number" {...register('shoppingBudget', { valueAsNumber: true })} />
            <Input label="Actual spend" type="number" {...register('actualSpend', { valueAsNumber: true })} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Budget engine</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <p>Shopping margin: <strong>{formatCurrency(budgetMetrics.shoppingMargin)}</strong></p>
              <p>Runner bonus ({settings.runnerBonusPercentage}%): <strong>{formatCurrency(budgetMetrics.runnerBonus)}</strong></p>
              <p>Business margin: <strong>{formatCurrency(budgetMetrics.businessMargin)}</strong></p>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Order items</p>
              <button type="button" className="text-brand-600 hover:text-brand-700" onClick={() => append({ id: `I-${fields.length + 1}`, name: '', quantity: 1, price: 0 })}>
                + Add item
              </button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-[1.1fr_0.8fr_0.8fr_auto]">
                  <Input label="Item name" {...register(`items.${index}.name` as const)} error={errors.items?.[index]?.name?.message?.toString()} />
                  <Input label="Quantity" type="number" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} error={errors.items?.[index]?.quantity?.message?.toString()} />
                  <Input label="Price" type="number" {...register(`items.${index}.price` as const, { valueAsNumber: true })} error={errors.items?.[index]?.price?.message?.toString()} />
                  <button type="button" className="mt-6 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-200" onClick={() => remove(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Service fee" type="number" {...register('serviceFee', { valueAsNumber: true })} error={errors.serviceFee?.message?.toString()} />
            <Input label="Delivery fee" type="number" {...register('deliveryFee', { valueAsNumber: true })} error={errors.deliveryFee?.message?.toString()} />
            <Input label="Additional charges" type="number" {...register('additionalCharges', { valueAsNumber: true })} error={errors.additionalCharges?.message?.toString()} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              <input type="checkbox" {...register('customDelivery')} />
              Custom delivery
            </label>
            <Input label="Reason" placeholder="Why custom delivery is needed" {...register('customDeliveryReason')} />
            <Input label="Requested date" type="date" {...register('customDeliveryRequestedDate')} />
          </div>
          {customDelivery ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              Custom delivery premium fee applied: {formatCurrency(settings.customDeliveryFee)}
            </p>
          ) : null}

          <Button type="submit" className="w-full">Create order</Button>
          {createdOrderId ? <p className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-800">Order created successfully: <strong>{createdOrderId}</strong></p> : null}
        </div>

        <aside className="space-y-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-200">Order summary</p>
            <h2 className="mt-3 text-2xl font-semibold">Totals and delivery</h2>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-6">
            <p className="text-sm text-slate-400">Subtotal</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(subtotal)}</p>
          </div>
          <div className="space-y-3 rounded-3xl bg-slate-900/80 p-6">
            <p className="text-sm text-slate-400">Fees</p>
            <div className="flex items-center justify-between text-base text-slate-100"><span>Service</span><span>{formatCurrency(Number(serviceFee))}</span></div>
            <div className="flex items-center justify-between text-base text-slate-100"><span>Delivery</span><span>{formatCurrency(Number(deliveryFee))}</span></div>
            <div className="flex items-center justify-between text-base text-slate-100"><span>Custom</span><span>{formatCurrency(customDelivery ? settings.customDeliveryFee : 0)}</span></div>
            <div className="flex items-center justify-between text-base text-slate-100"><span>Additional</span><span>{formatCurrency(Number(additionalCharges))}</span></div>
          </div>
          <div className="rounded-3xl bg-brand-600 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-100">Grand total</p>
            <p className="mt-3 text-4xl font-semibold">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-brand-100">Cycle</p>
            <p className="mt-2 text-base text-white">{marketDay} / {getMarketDayProductLine(marketDay)}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

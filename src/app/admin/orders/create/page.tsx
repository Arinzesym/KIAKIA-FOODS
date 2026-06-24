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

const orderCreateSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(10),
  estate: z.string().min(2),
  address: z.string().min(5),
  whatsapp: z.string().min(10),
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
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<OrderCreateValues>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      estate: '',
      address: '',
      whatsapp: '',
      serviceFee: 1200,
      deliveryFee: 1500,
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
  const subtotal = useMemo(() => calculateSubtotal(items as OrderItem[]), [items]);
  const grandTotal = useMemo(
    () => calculateGrandTotal(items as OrderItem[], Number(serviceFee), Number(deliveryFee), Number(additionalCharges)),
    [items, serviceFee, deliveryFee, additionalCharges]
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
      Number(values.deliveryFee),
      Number(values.additionalCharges)
    );

    const newOrder: OrderRecord = {
      id: orderId,
      customerId: '',
      customerName: values.customerName,
      phone: values.phone,
      email: '',
      whatsapp: values.whatsapp,
      estate: values.estate,
      address: values.address,
      items: normalizedItems,
      subtotal: computedSubtotal,
      serviceFee: Number(values.serviceFee),
      deliveryFee: Number(values.deliveryFee),
      additionalCharges: Number(values.additionalCharges),
      grandTotal: computedGrandTotal,
      status: 'New',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedRider: '',
      batchId: '',
      purchaseCost: 0
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
          <Input label="Delivery address" {...register('address')} error={errors.address?.message?.toString()} />

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
            <div className="flex items-center justify-between text-base text-slate-100"><span>Additional</span><span>{formatCurrency(Number(additionalCharges))}</span></div>
          </div>
          <div className="rounded-3xl bg-brand-600 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-100">Grand total</p>
            <p className="mt-3 text-4xl font-semibold">{formatCurrency(grandTotal)}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

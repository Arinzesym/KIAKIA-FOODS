'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatCurrency, generateWhatsAppMessage } from '@/lib/utils';

const initialItems = [
  { name: 'Rice', quantity: 2, price: 85000 },
  { name: 'Chicken', quantity: 5, price: 6000 },
  { name: 'Milk', quantity: 4, price: 3500 }
];

export function DashboardStats({ summary }: { summary: { totalOrders: number; totalSpend: number; activeOrders: number; savedLists: number } }) {
  const data = [
    { label: 'Total Orders', value: summary.totalOrders },
    { label: 'Active Orders', value: summary.activeOrders },
    { label: 'Total Spend', value: formatCurrency(summary.totalSpend) },
    { label: 'Saved Lists', value: summary.savedLists }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {data.map((item) => (
        <div key={item.label} className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function OrderBuilder() {
  const [items, setItems] = useState(initialItems);
  const [estate, setEstate] = useState('Oluyole Estate');
  const [address, setAddress] = useState('House 13, Block B');
  const [name, setName] = useState('Folake Ade');
  const [phone, setPhone] = useState('+2348012345678');
  const [serviceFee, setServiceFee] = useState(1200);
  const [deliveryFee, setDeliveryFee] = useState(1500);
  const [additionalCharges, setAdditionalCharges] = useState(0);

  const itemTotals = useMemo(() => items.map((item) => item.quantity * item.price), [items]);
  const subtotal = useMemo(() => itemTotals.reduce((acc, value) => acc + value, 0), [itemTotals]);
  const totalQuantity = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  const grandTotal = subtotal + serviceFee + deliveryFee + additionalCharges;

  const updateItem = (index: number, field: 'name' | 'quantity' | 'price', value: string) => {
    setItems((current) => {
      const next = [...current];
      if (field === 'name') next[index].name = value;
      if (field === 'quantity') next[index].quantity = Math.max(1, Number(value));
      if (field === 'price') next[index].price = Number(value);
      return next;
    });
  };

  const incrementQuantity = (index: number) => {
    setItems((current) => current.map((item, idx) => idx === index ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decrementQuantity = (index: number) => {
    setItems((current) => current.map((item, idx) => idx === index ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item));
  };

  const addItem = () => setItems((current) => [...current, { name: '', quantity: 1, price: 0 }] as any);
  const removeItem = (index: number) => setItems((current) => current.filter((_, idx) => idx !== index));

  const orderMessage = generateWhatsAppMessage({ name, phone, estate, address, items, serviceFee, deliveryFee, additionalCharges });
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[+\s]/g, '') ?? '2348000000000'}?text=${encodeURIComponent(orderMessage)}`;

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_0.45fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Smart order builder</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">Build a shopping list and submit it through WhatsApp.</h2>
          </div>
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Customer Name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Estate" value={estate} onChange={(event) => setEstate(event.target.value)} />
              <Input label="Delivery address" value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_0.9fr]">
                  <Input label="Product name" value={item.name} onChange={(event) => updateItem(index, 'name', event.target.value)} />
                  <div className="grid gap-2 text-sm font-medium text-slate-900">
                    <span>Quantity</span>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                      <button type="button" onClick={() => decrementQuantity(index)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-bold text-slate-700">-</button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                        className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-slate-900"
                      />
                      <button type="button" onClick={() => incrementQuantity(index)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-bold text-slate-700">+</button>
                    </div>
                  </div>
                  <Input label="Unit price" type="number" value={item.price} onChange={(event) => updateItem(index, 'price', event.target.value)} />
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 text-slate-600">
                  <p>Item total: {formatCurrency(item.quantity * item.price)}</p>
                  <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-rose-600 hover:text-rose-700" onClick={() => removeItem(index)}>
                    Remove item
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={addItem}>+ Add product</button>
          </div>
        </div>
        <div className="sticky bottom-3 z-20 space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-lg lg:bottom-auto lg:top-24 lg:z-auto lg:shadow-none">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Live order calculator</p>
            <div className="grid gap-3 rounded-3xl bg-white p-4">
              <div className="flex items-center justify-between text-slate-700"><span>Number of items</span><span>{items.length}</span></div>
              <div className="flex items-center justify-between text-slate-700"><span>Total quantity</span><span>{totalQuantity}</span></div>
              <div className="flex items-center justify-between text-slate-700"><span>Shopping cost</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex items-center justify-between text-slate-700"><span>Service fee</span><span>{formatCurrency(serviceFee)}</span></div>
              <div className="flex items-center justify-between text-slate-700"><span>Delivery fee</span><span>{formatCurrency(deliveryFee)}</span></div>
              <div className="flex items-center justify-between text-slate-700"><span>Additional charges</span><span>{formatCurrency(additionalCharges)}</span></div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xl font-semibold text-slate-950"><span>Estimated total</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>
          <div className="grid gap-4">
            <Input label="Service fee (₦)" type="number" value={serviceFee} onChange={(event) => setServiceFee(Number(event.target.value))} />
            <Input label="Delivery fee (₦)" type="number" value={deliveryFee} onChange={(event) => setDeliveryFee(Number(event.target.value))} />
            <Input label="Additional charges (₦)" type="number" value={additionalCharges} onChange={(event) => setAdditionalCharges(Number(event.target.value))} />
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className={cn('inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-700')}>
            Send order to WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export function OrderHistoryTable() {
  const orders = [
    { id: 'KKF-2025-0001', date: '2025-06-10', total: 38500, status: 'Delivered' },
    { id: 'KKF-2025-0008', date: '2025-06-17', total: 92400, status: 'Packed' },
    { id: 'KKF-2025-0014', date: '2025-06-19', total: 56000, status: 'Out For Delivery' }
  ];

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Order history</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your recent orders</h2>
        </div>
        <span className="rounded-full bg-brand-50 px-4 py-2 text-sm text-brand-700">Total records {orders.length}</span>
      </div>
      <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4">Order #</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                <td className="px-6 py-4 text-slate-600">{order.date}</td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(order.total)}</td>
                <td className="px-6 py-4 text-slate-600">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-3 lg:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{order.id}</p>
                <p className="text-xs text-slate-500">{order.date}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{order.status}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{formatCurrency(order.total)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

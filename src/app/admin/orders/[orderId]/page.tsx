'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useOMSStore } from '@/lib/StoreContext';
import { formatCurrency, generateWhatsAppMessage, loadAdminSettings } from '@/lib/utils';
import { orderStatuses } from '@/lib/mockData';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const { orders, updateOrder } = useOMSStore();
  const order = orders.find((item) => item.id === orderId);
  type OrderStatus = typeof orderStatuses[number];

  const [notes, setNotes] = useState(order?.notes ?? '');
  const [assignedRider, setAssignedRider] = useState(order?.assignedRider ?? '');
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? 'New');
  const [settings, setSettings] = useState({
    businessName: 'KiaKia Foods',
    whatsappNumber: '+2348000000000',
    businessAccountNumber: '1234567890',
    serviceFee: 1200,
    deliveryFee: 1500
  });
  const [showMessagePreview, setShowMessagePreview] = useState(false);

  useEffect(() => {
    const savedSettings = loadAdminSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  const whatsappMessage = useMemo(() => {
    if (!order) return '';
    return generateWhatsAppMessage({
      name: order.customerName,
      phone: order.phone,
      estate: order.estate,
      address: order.address,
      items: order.items,
      serviceFee: order.serviceFee,
      deliveryFee: order.deliveryFee,
      additionalCharges: order.additionalCharges,
      businessName: settings.businessName,
      businessAccountNumber: settings.businessAccountNumber,
      orderId: order.id
    });
  }, [order, settings]);

  const businessWhatsAppUrl = `https://wa.me/${order?.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  if (!order) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-xl font-semibold text-slate-950">Order not found</p>
          <p className="mt-2 text-slate-600">Make sure the order ID is valid or return to the orders list.</p>
          <Link href="/admin/orders" className="mt-6 inline-flex rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdate = (patch: Partial<typeof order>) => {
    updateOrder(order.id, { ...patch, updatedAt: new Date().toISOString() });
  };

  const whatsappUrl = `https://wa.me/${order.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Order detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{order.id}</h1>
            <p className="mt-2 text-slate-600">Customer: {order.customerName} • {order.estate}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => handleUpdate({ status: 'Delivered' })}>
              Mark delivered
            </Button>
            <Button variant="secondary" onClick={() => handleUpdate({ status: 'Confirmed' })}>
              Mark confirmed
            </Button>
            <button
              onClick={() => setShowMessagePreview(!showMessagePreview)}
              className="inline-flex items-center justify-center rounded-2xl border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50"
            >
              👁️ Preview Message
            </button>
            <a href={businessWhatsAppUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700">
              💬 Send to Customer
            </a>
          </div>
        </div>
      </div>

      {/* Message Preview Section */}
      {showMessagePreview && (
        <div className="rounded-3xl bg-green-50 border-2 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm uppercase tracking-[0.24em] text-green-600 font-bold">📱 WhatsApp Message Preview</p>
            <button
              onClick={() => setShowMessagePreview(false)}
              className="text-xl text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="rounded-2xl bg-white p-4 border border-green-200 text-sm text-slate-800 font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
            {whatsappMessage}
          </div>
          <p className="text-xs text-green-600 mt-3">✓ Account number will be visible to the customer</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Contact</p>
              <p className="mt-3 text-slate-900">{order.customerName}</p>
              <p className="text-sm text-slate-600">{order.phone}</p>
              <a
                href={`https://wa.me/${order.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-green-600 hover:text-green-700 font-semibold mt-2 inline-block"
              >
                💬 {order.whatsapp}
              </a>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Delivery</p>
              <p className="mt-3 text-slate-900">{order.estate}</p>
              <p className="text-sm text-slate-600">{order.address}</p>
              <p className="text-sm text-slate-600">Batch: {order.batchId || 'None'}</p>
            </div>
          </div>

          {/* Account Number Display */}
          {settings.businessAccountNumber && (
            <div className="mt-6 rounded-3xl bg-blue-50 border-2 border-blue-200 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-600 font-bold">🏦 Account Info Sent to Customer</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-3xl">📱</div>
                <div>
                  <p className="text-xs text-slate-600">Account Number:</p>
                  <p className="text-2xl font-bold text-slate-950 font-mono">{settings.businessAccountNumber}</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3">✓ This will appear in the WhatsApp message sent to the customer for payment reference</p>
            </div>
          )}

          <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Subtotal</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(order.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Delivery</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(order.deliveryFee)}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{formatCurrency(order.grandTotal)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Order items</p>
                <p className="mt-2 text-slate-600">Review and confirm the shopping list for sourcing and batch packing.</p>
              </div>
              <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">{order.items.length} items</span>
            </div>
            <div className="mt-6 divide-y divide-slate-200">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="text-sm text-slate-600">Qty {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(item.quantity * item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6 rounded-[2rem] bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Order controls</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Update workflow</h2>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-semibold text-slate-700">Order status</label>
            <select
              value={status}
              onChange={(event) => {
                const nextStatus = event.target.value as OrderStatus;
                setStatus(nextStatus);
                handleUpdate({ status: nextStatus });
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {orderStatuses.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-semibold text-slate-700">Assigned rider</label>
            <input
              value={assignedRider}
              onChange={(event) => setAssignedRider(event.target.value)}
              onBlur={(event) => handleUpdate({ assignedRider: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Enter rider name"
            />
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-semibold text-slate-700">Order notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => handleUpdate({ notes })}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Update sourcing, delivery, or customer notes"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-brand-600">Quick actions</p>
            <div className="mt-4 grid gap-3">
              <Button 
                variant="secondary" 
                onClick={() => handleUpdate({ status: 'Purchased' })}
                className="w-full"
              >
                ✓ Mark Purchased
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleUpdate({ status: 'At Dispatch Point' })}
                className="w-full"
              >
                🚚 Send to Dispatch
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

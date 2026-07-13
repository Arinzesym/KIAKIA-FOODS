'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOMSStore } from '@/lib/StoreContext';
import { formatCurrency } from '@/lib/utils';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const { orders } = useOMSStore();
  const order = orders.find(o => o.id === orderId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Success Card */}
        <div className="rounded-3xl bg-white p-8 shadow-xl text-center">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          
          <h1 className="text-3xl font-bold text-slate-950 mb-2">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Thank you for confirming your order. We&apos;ve received it and will start preparing it right away.
          </p>

          {order && (
            <div className="rounded-2xl bg-slate-50 p-6 mb-8 text-left">
              <p className="text-sm text-slate-500 uppercase font-semibold">Order Details</p>
              <p className="text-2xl font-bold text-slate-950 mt-2 font-mono">{order.id}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Amount:</span>
                  <span className="font-bold text-brand-600">{formatCurrency(order.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className="font-bold text-green-700">✓ Confirmed</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <p className="text-sm font-semibold text-blue-900 mb-4">📍 Your Order Journey</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-lg">✅</div>
                <div className="text-left">
                  <p className="font-semibold text-blue-900">Order Confirmed</p>
                  <p className="text-xs text-blue-700">Just now</p>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <div className="text-lg">🛒</div>
                <div className="text-left">
                  <p className="font-semibold text-blue-900">Market Sourcing</p>
                  <p className="text-xs text-blue-700">Coming up...</p>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <div className="text-lg">📦</div>
                <div className="text-left">
                  <p className="font-semibold text-blue-900">Packed & Ready</p>
                  <p className="text-xs text-blue-700">Coming up...</p>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <div className="text-lg">🚚</div>
                <div className="text-left">
                  <p className="font-semibold text-blue-900">Out for Delivery</p>
                  <p className="text-xs text-blue-700">Coming up...</p>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <div className="text-lg">🎉</div>
                <div className="text-left">
                  <p className="font-semibold text-blue-900">Delivered</p>
                  <p className="text-xs text-blue-700">Coming up...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8">
            <p className="text-sm text-yellow-900">
              <strong>💬 Stay Connected:</strong> We&apos;ll send you WhatsApp updates as your order progresses through each stage.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block rounded-2xl bg-brand-600 px-6 py-3 text-center font-bold text-white hover:bg-brand-700 transition"
            >
              Go to Home
            </Link>
            <a
              href={`https://wa.me/${order?.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl bg-green-600 px-6 py-3 text-center font-bold text-white hover:bg-green-700 transition"
            >
              💬 Chat with Us on WhatsApp
            </a>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Your order confirmation has been sent to our team.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Estimated delivery time will be provided shortly via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-700">Loading order confirmation...</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}

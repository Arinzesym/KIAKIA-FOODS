'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useOMSStore } from '@/lib/StoreContext';
import { formatCurrency } from '@/lib/utils';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId');
  const customerName = searchParams?.get('customerName');
  
  const { orders, updateOrder } = useOMSStore();
  const order = orders.find(o => o.id === orderId);
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order && order.status === 'Confirmed') {
      setIsConfirmed(true);
    }
  }, [order]);

  const handleConfirmOrder = async () => {
    if (!order) {
      setError('Order not found');
      return;
    }

    setIsConfirming(true);
    try {
      updateOrder(order.id, { 
        status: 'Confirmed', 
        updatedAt: new Date().toISOString() 
      });
      
      setIsConfirmed(true);
      setError('');
      
      setTimeout(() => {
        router.push('/order-confirmation-success?orderId=' + order.id);
      }, 1500);
    } catch (err) {
      setError('Failed to confirm order. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg max-w-md">
          <p className="text-xl font-bold text-red-600">Invalid Link</p>
          <p className="mt-2 text-slate-600">The order confirmation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg max-w-md">
          <p className="text-xl font-bold text-red-600">Order Not Found</p>
          <p className="mt-2 text-slate-600">Order {orderId} could not be found in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">
              {isConfirmed ? '✅' : '📋'}
            </div>
            <h1 className="text-3xl font-bold text-slate-950">
              {isConfirmed ? 'Order Confirmed!' : 'Confirm Your Order'}
            </h1>
            <p className="mt-2 text-slate-600">
              {isConfirmed 
                ? 'Thank you! Your order has been confirmed.' 
                : 'Please review and confirm your order details'}
            </p>
          </div>

          <div className="space-y-4 mb-8 rounded-2xl bg-slate-50 p-6">
            <div>
              <p className="text-xs uppercase text-slate-500 font-semibold">Order Number</p>
              <p className="text-2xl font-bold text-slate-950 font-mono">{order.id}</p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Customer</p>
              <p className="text-slate-900 font-semibold">{order.customerName}</p>
              <p className="text-sm text-slate-600">{order.phone}</p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Delivery To</p>
              <p className="text-slate-900 font-semibold">{order.estate}</p>
              <p className="text-sm text-slate-600">{order.address}</p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs uppercase text-slate-500 font-semibold mb-3">Items</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold text-slate-900">
                      ₦{(item.quantity * item.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="text-slate-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Service Fee:</span>
                <span className="text-slate-900">₦{order.serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Delivery Fee:</span>
                <span className="text-slate-900">₦{order.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                <span className="text-slate-950">Total:</span>
                <span className="text-brand-600">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700 text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          {isConfirmed && (
            <div className="mb-6 rounded-2xl bg-green-50 p-4 text-green-700 text-sm font-semibold">
              ✓ Your order has been confirmed! We'll start sourcing your items right away.
            </div>
          )}

          {!isConfirmed ? (
            <button
              onClick={handleConfirmOrder}
              disabled={isConfirming}
              className="w-full rounded-2xl bg-brand-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-brand-700 disabled:bg-slate-400"
            >
              {isConfirming ? 'Confirming...' : '✓ Confirm Order'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl bg-green-100 px-6 py-4 text-center">
                <p className="text-green-800 font-bold">Order Status: ✓ CONFIRMED</p>
              </div>
              <p className="text-sm text-slate-600 text-center">
                You will receive updates on your order via WhatsApp. Our team will contact you for any clarifications needed.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              💬 If you have any questions, please reach out to us on WhatsApp
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <p className="text-sm font-semibold text-blue-900 mb-3">📝 What happens next?</p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Your order is confirmed and sent to our team</li>
            <li>✓ We'll source all items from the market</li>
            <li>✓ Your order will be prepared and packed</li>
            <li>✓ A rider will deliver to your address</li>
            <li>✓ You'll receive status updates via WhatsApp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-700">Loading order details...</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}

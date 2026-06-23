import type { CartItem } from '@/lib/types';

export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportOrdersAsCsv(orders: import('./types').OrderRecord[]) {
  const header = [
    'Order ID',
    'Customer Name',
    'Phone',
    'WhatsApp',
    'Email',
    'Estate',
    'Address',
    'Status',
    'Subtotal',
    'Service Fee',
    'Delivery Fee',
    'Additional Charges',
    'Grand Total',
    'Batch ID',
    'Assigned Rider',
    'Purchase Cost',
    'Notes',
    'Created At',
    'Updated At',
    'Item Count',
    'Items'
  ];

  const rows = orders.map((order) => {
    const items = order.items
      .map((item) => `${item.name} (${item.quantity} x ₦${item.price.toLocaleString('en-NG')})`)
      .join('; ');

    return [
      order.id,
      order.customerName,
      order.phone,
      order.whatsapp,
      order.email,
      order.estate,
      order.address,
      order.status,
      order.subtotal.toString(),
      order.serviceFee.toString(),
      order.deliveryFee.toString(),
      order.additionalCharges.toString(),
      order.grandTotal.toString(),
      order.batchId,
      order.assignedRider,
      order.purchaseCost.toString(),
      order.notes ?? '',
      order.createdAt,
      order.updatedAt,
      order.items.length.toString(),
      items
    ]
      .map((value) => escapeCsv(value ?? ''))
      .join(',');
  });

  return [header.map(escapeCsv).join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateWhatsAppMessage(data: {
  name: string;
  phone: string;
  estate: string;
  address: string;
  items: CartItem[];
  serviceFee: number;
  deliveryFee: number;
  additionalCharges: number;
}) {
  const itemLines = data.items.map((item, index) => {
    const total = item.quantity * item.price;
    return `${index + 1}. ${item.name || 'Item'} | Qty ${item.quantity} | ₦${item.price.toLocaleString()} | Total ₦${total.toLocaleString()}`;
  });

  const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const grandTotal = subtotal + data.serviceFee + data.deliveryFee + data.additionalCharges;

  return `*KiaKia Foods Order*

*Customer:* ${data.name}
*Phone:* ${data.phone}
*Estate:* ${data.estate}
*Delivery Address:* ${data.address}

*Shopping List:*
${itemLines.join('\n')}

*Shopping Total:* ₦${subtotal.toLocaleString()}
*Service Fee:* ₦${data.serviceFee.toLocaleString()}
*Delivery Fee:* ₦${data.deliveryFee.toLocaleString()}
*Additional Charges:* ₦${data.additionalCharges.toLocaleString()}
*Grand Total:* ₦${grandTotal.toLocaleString()}

Please confirm the order and send it to KiaKia Foods. Thank you.`;
}

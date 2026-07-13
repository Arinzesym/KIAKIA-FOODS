import type { CartItem, RiderAssignment, RunnerTask } from '@/lib/types';
import { defaultBusinessSettings, loadBusinessSettings, saveBusinessSettings } from '@/lib/businessSettings';

export interface AdminSettings {
  businessName: string;
  whatsappNumber: string;
  businessAccountNumber: string;
  serviceFee: number;
  deliveryFee: number;
}

export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function formatCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => escapeCsv(cell ?? '')).join(',')).join('\n');
}

export function loadAdminSettings(): AdminSettings | null {
  const settings = loadBusinessSettings();
  return {
    businessName: settings.businessName,
    whatsappNumber: settings.whatsappNumber,
    businessAccountNumber: settings.businessAccountNumber,
    serviceFee: settings.serviceFee,
    deliveryFee: settings.defaultDeliveryFee
  };
}

export function saveAdminSettings(settings: AdminSettings) {
  const currentSettings = loadBusinessSettings();
  saveBusinessSettings({
    ...defaultBusinessSettings,
    ...currentSettings,
    businessName: settings.businessName,
    whatsappNumber: settings.whatsappNumber,
    businessAccountNumber: settings.businessAccountNumber,
    serviceFee: settings.serviceFee,
    defaultDeliveryFee: settings.deliveryFee
  });
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

export function exportRunnerTasksAsCsv(tasks: RunnerTask[]) {
  const header = ['Task ID', 'Order ID', 'Assigned to', 'Status', 'Purchase Cost', 'Updated At', 'Notes'];
  const rows = tasks.map((task) => [task.id, task.orderId, task.assignedTo, task.status, task.purchaseCost.toString(), task.updatedAt, task.notes]);
  return formatCsv([header, ...rows]);
}

export function exportRiderAssignmentsAsCsv(assignments: RiderAssignment[]) {
  const header = ['Assignment ID', 'Order ID', 'Customer', 'Estate', 'Rider', 'Status', 'Proof URL', 'Updated At', 'Notes'];
  const rows = assignments.map((assignment) => [assignment.id, assignment.orderId, assignment.customerName, assignment.estate, assignment.assignedRider, assignment.status, assignment.proofUrl ?? '', assignment.updatedAt, assignment.notes]);
  return formatCsv([header, ...rows]);
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
  businessName?: string;
  businessAccountNumber?: string;
  orderId?: string;
  baseUrl?: string;
}) {
  const itemLines = data.items.map((item, index) => {
    const total = item.quantity * item.price;
    return `${index + 1}. ${item.name || 'Item'} | Qty ${item.quantity} | ₦${item.price.toLocaleString()} | Total ₦${total.toLocaleString()}`;
  });

  const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const grandTotal = subtotal + data.serviceFee + data.deliveryFee + data.additionalCharges;

  const businessName = data.businessName ?? 'KiaKia Foods';
  const accountSection = data.businessAccountNumber
    ? `*Payment Account Number:* ${data.businessAccountNumber}`
    : '*Payment Account Number:* Please contact us for account details.';

  return `*${businessName} Order*

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
${accountSection}

Please send payment to the account number above.
Once ${businessName} receives your payment, your order will be confirmed.
Thank you.`;
}

export function normalizeWhatsAppNumber(rawPhone: string, defaultCountryCode = '+234') {
  const trimmed = (rawPhone ?? '').trim();
  if (!trimmed) {
    return null;
  }

  const hadPlusPrefix = trimmed.startsWith('+');
  let digits = trimmed.replace(/\s+/g, '').replace(/[^\d]/g, '');

  if (!digits) {
    return null;
  }

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (!hadPlusPrefix && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  const countryDigits = defaultCountryCode.replace(/[^\d]/g, '');
  if (!digits.startsWith(countryDigits)) {
    digits = `${countryDigits}${digits}`;
  }

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return `+${digits}`;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const normalizedNumber = normalizeWhatsAppNumber(phone);
  if (!normalizedNumber) {
    return {
      ok: false as const,
      error: 'Invalid WhatsApp number. Include a valid Nigerian phone number.',
      normalizedNumber: null,
      url: null
    };
  }

  const encodedMessage = encodeURIComponent(message ?? '');
  return {
    ok: true as const,
    normalizedNumber,
    url: `https://wa.me/${normalizedNumber}?text=${encodedMessage}`,
    error: null
  };
}

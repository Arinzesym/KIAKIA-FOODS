import type { CartItem, CustomerProfile, EstateBatch, FinanceSummary, OrderItem, OrderRecord, RiderAssignment, RunnerTask } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export const orderStatuses = [
  'New',
  'Confirmed',
  'Market Sourcing',
  'Purchased',
  'At Dispatch Point',
  'Out For Delivery',
  'Delivered',
  'Cancelled'
] as const;

export const runnerStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'] as const;
export const riderStatuses = ['Assigned', 'Picked Up', 'Delivered', 'Delayed', 'Cancelled'] as const;
export const batchStatuses = ['Open', 'Assigned', 'Dispatched', 'Completed'] as const;

export function generateOrderId() {
  const year = new Date().getFullYear();
  const serial = Math.floor(1000 + Math.random() * 9000);
  return `KKF-${year}-${serial}`;
}

export function calculateSubtotal(items: OrderItem[]) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 0);
    const price = Number(item.price ?? 0);
    return sum + price * quantity;
  }, 0);
}

export function calculateGrandTotal(items: OrderItem[], serviceFee: number, deliveryFee: number, additionalCharges: number) {
  return calculateSubtotal(items) + Number(serviceFee) + Number(deliveryFee) + Number(additionalCharges);
}

export const mockOrders: OrderRecord[] = [
  {
    id: 'KKF-2025-1001',
    customerId: 'C-001',
    customerName: 'Amina Owolabi',
    phone: '+2348012345678',
    whatsapp: '+2348012345678',
    email: 'amina@estate.com',
    estate: 'Victoria Garden',
    address: '5 Block A, Victoria Garden Estate',
    status: 'New',
    items: [
      { id: 'I-001', name: 'Rice (10kg)', quantity: 1, price: 25000 },
      { id: 'I-002', name: 'Tomatoes (crate)', quantity: 2, price: 4500 }
    ],
    subtotal: 34000,
    serviceFee: 1200,
    deliveryFee: 1500,
    additionalCharges: 0,
    grandTotal: 36700,
    batchId: 'B-101',
    assignedRider: 'Rider A',
    purchaseCost: 29000,
    notes: 'Customer prefers green tomatoes',
    createdAt: '2025-06-18T09:18:00Z',
    updatedAt: '2025-06-18T09:24:00Z'
  },
  {
    id: 'KKF-2025-1002',
    customerId: 'C-002',
    customerName: 'Tunde Adams',
    phone: '+2348012345679',
    whatsapp: '+2348012345679',
    email: 'tunde@compound.com',
    estate: 'Lekki Phase 1',
    address: '12 Gate B, Lekki Phase 1',
    status: 'Market Sourcing',
    items: [
      { id: 'I-003', name: 'Indomie (12 pack)', quantity: 3, price: 2200 },
      { id: 'I-004', name: 'Vegetable oil (5L)', quantity: 1, price: 8700 }
    ],
    subtotal: 15300,
    serviceFee: 1200,
    deliveryFee: 1500,
    additionalCharges: 0,
    grandTotal: 18000,
    batchId: 'B-102',
    assignedRider: 'Rider B',
    purchaseCost: 13000,
    notes: 'Runner should confirm brand on arrival',
    createdAt: '2025-06-18T08:45:00Z',
    updatedAt: '2025-06-18T09:05:00Z'
  },
  {
    id: 'KKF-2025-1003',
    customerId: 'C-003',
    customerName: 'Ngozi Chukwu',
    phone: '+2348012345680',
    whatsapp: '+2348012345680',
    email: 'ngozi@estate.com',
    estate: 'Banana Island',
    address: 'Unit 34, Banana Island',
    status: 'Out For Delivery',
    items: [
      { id: 'I-005', name: 'Bread (4 loaves)', quantity: 2, price: 2200 },
      { id: 'I-006', name: 'Eggs (30pcs)', quantity: 1, price: 3200 }
    ],
    subtotal: 7600,
    serviceFee: 1200,
    deliveryFee: 1500,
    additionalCharges: 0,
    grandTotal: 10300,
    batchId: 'B-103',
    assignedRider: 'Rider C',
    purchaseCost: 5900,
    notes: 'Call before delivery',
    createdAt: '2025-06-18T07:55:00Z',
    updatedAt: '2025-06-18T08:10:00Z'
  }
];

export const mockEstateBatches: EstateBatch[] = [
  {
    id: 'B-101',
    estate: 'Victoria Garden',
    orders: 14,
    totalValue: 468000,
    assignedRider: 'Rider A',
    status: 'Assigned',
    createdAt: '2025-06-18T08:00:00Z'
  },
  {
    id: 'B-102',
    estate: 'Lekki Phase 1',
    orders: 9,
    totalValue: 287000,
    assignedRider: 'Rider B',
    status: 'Dispatched',
    createdAt: '2025-06-18T07:40:00Z'
  },
  {
    id: 'B-103',
    estate: 'Banana Island',
    orders: 6,
    totalValue: 198500,
    assignedRider: 'Rider C',
    status: 'Open',
    createdAt: '2025-06-18T08:20:00Z'
  }
];

export const mockRunnerTasks: RunnerTask[] = [
  {
    id: 'R-301',
    orderId: 'KKF-2025-1002',
    task: 'Source Indomie and vegetable oil at Matori market',
    status: 'In Progress',
    assignedTo: 'Runner Joseph',
    purchaseCost: 13000,
    notes: 'Check available brands and prices before purchase',
    updatedAt: '2025-06-18T09:10:00Z'
  },
  {
    id: 'R-302',
    orderId: 'KKF-2025-1001',
    task: 'Collect tomatoes and rice for Victoria Garden batch',
    status: 'Pending',
    assignedTo: 'Runner Chika',
    purchaseCost: 29000,
    notes: 'Confirm delivery and batch list with dispatcher',
    updatedAt: '2025-06-18T08:55:00Z'
  }
];

export const mockRiderAssignments: RiderAssignment[] = [
  {
    id: 'D-501',
    orderId: 'KKF-2025-1003',
    customerName: 'Ngozi Chukwu',
    estate: 'Banana Island',
    status: 'Assigned',
    assignedRider: 'Rider C',
    proofUrl: '',
    notes: 'Delivery estimated in 20 minutes',
    updatedAt: '2025-06-18T08:15:00Z'
  },
  {
    id: 'D-502',
    orderId: 'KKF-2025-1001',
    customerName: 'Amina Owolabi',
    estate: 'Victoria Garden',
    status: 'Picked Up',
    assignedRider: 'Rider A',
    proofUrl: 'https://via.placeholder.com/120',
    notes: 'Shopping ready for estate delivery',
    updatedAt: '2025-06-18T09:30:00Z'
  }
];

export const mockCustomers: CustomerProfile[] = [
  {
    id: 'C-001',
    name: 'Amina Owolabi',
    phone: '+2348012345678',
    email: 'amina@estate.com',
    estate: 'Victoria Garden',
    address: '5 Block A, Victoria Garden Estate',
    totalOrders: 18,
    lifetimeSpend: 1295000,
    repeatOrders: 12,
    lastOrderDate: '2025-06-18',
    notes: 'Prefers WhatsApp order notes and green vegetables.'
  },
  {
    id: 'C-002',
    name: 'Tunde Adams',
    phone: '+2348012345679',
    email: 'tunde@compound.com',
    estate: 'Lekki Phase 1',
    address: '12 Gate B, Lekki Phase 1',
    totalOrders: 10,
    lifetimeSpend: 812000,
    repeatOrders: 7,
    lastOrderDate: '2025-06-17',
    notes: 'Schedules deliveries for weekday evenings.'
  },
  {
    id: 'C-003',
    name: 'Ngozi Chukwu',
    phone: '+2348012345680',
    email: 'ngozi@estate.com',
    estate: 'Banana Island',
    address: 'Unit 34, Banana Island',
    totalOrders: 8,
    lifetimeSpend: 575000,
    repeatOrders: 6,
    lastOrderDate: '2025-06-16',
    notes: 'Latest orders require gated delivery approval.'
  }
];

export const mockAnalyticsSeries = [
  { label: 'Daily', value: 42 },
  { label: 'Weekly', value: 312 },
  { label: 'Monthly', value: 1468 }
];

export const mockRevenueTrend = [
  { period: 'Week 1', revenue: 420000, profit: 88000 },
  { period: 'Week 2', revenue: 470000, profit: 102000 },
  { period: 'Week 3', revenue: 520000, profit: 125000 },
  { period: 'Week 4', revenue: 580000, profit: 149000 }
];

export const mockFinanceSummary: FinanceSummary = {
  totalRevenue: 1895000,
  deliveryFees: 108000,
  outstandingPayments: 94000,
  estimatedProfit: 420000,
  unpaidOrders: 8
};

export const mockReportRows = [
  { title: 'Daily operations report', description: 'Summary of today’s orders, deliveries, and revenue.', file: 'daily-report.xlsx' },
  { title: 'Weekly business report', description: 'Order volume, estate performance, and sourcing costs.', file: 'weekly-report.pdf' }
];

export const quickKpis = [
  { label: 'Open batches', value: 3 },
  { label: 'Runner tasks', value: 12 },
  { label: 'Active riders', value: 8 },
  { label: 'Outstanding payments', value: 8 }
];

export const topEstates = [
  { estate: 'Victoria Garden', orders: 42, revenue: 1250000 },
  { estate: 'Lekki Phase 1', orders: 28, revenue: 880000 },
  { estate: 'Banana Island', orders: 16, revenue: 510000 }
];

export const topCustomers = mockCustomers.slice(0, 3);

export const financeCategories = [
  { name: 'Revenue', amount: 1895000 },
  { name: 'Delivery Fees', amount: 108000 },
  { name: 'Outstanding', amount: 94000 },
  { name: 'Profit', amount: 420000 }
];

export const reportActions = [
  { label: 'Export Excel', description: 'Download operational data for offline review.', variant: 'primary' },
  { label: 'Export PDF', description: 'Download a formatted daily report.', variant: 'secondary' }
];

export const analyticsSummary = [
  { label: 'Daily orders', value: 42 },
  { label: 'Weekly orders', value: 312 },
  { label: 'Monthly orders', value: 1468 }
];

export const orderStatusMap = {
  New: 'bg-brand-100 text-brand-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  'Market Sourcing': 'bg-slate-100 text-slate-700',
  Purchased: 'bg-cyan-100 text-cyan-700',
  'At Dispatch Point': 'bg-blue-100 text-blue-700',
  'Out For Delivery': 'bg-orange-100 text-orange-700',
  Delivered: 'bg-emerald-200 text-emerald-800',
  Cancelled: 'bg-rose-100 text-rose-700'
} as const;

export function formatOrderTotal(order: OrderRecord) {
  return `${formatCurrency(order.grandTotal)} / ${order.status}`;
}

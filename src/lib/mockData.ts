import type {
  BusinessSettings,
  CustomerProfile,
  DeliveryBatch,
  DispatchRecord,
  EstateBatch,
  EstateRecord,
  FinanceSummary,
  NotificationRecord,
  OrderItem,
  OrderRecord,
  ProductCatalogEntry,
  RiderAssignment,
  RunnerProfile,
  RunnerTask
} from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { defaultBusinessSettings } from '@/lib/businessSettings';
import { calculateDeliveryMetrics, calculateShoppingBudgetMetrics } from '@/lib/marginEngine';

export const orderStatuses = [
  'NEW',
  'CONFIRMED',
  'RUNNER_ASSIGNED',
  'SHOPPING',
  'AT_STAGING',
  'BATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'New',
  'Awaiting Rider',
  'Assigned',
  'Picked Up',
  'In Transit',
  'Delivered',
  'Completed',
  'Failed',
  'Cancelled'
] as const;

export const paymentStatuses = ['Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded'] as const;
export const dispatchStatuses = ['Unassigned', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Completed', 'Failed'] as const;
export const runnerStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'] as const;
export const batchStatuses = ['Pending', 'Assigned', 'In Progress', 'Completed'] as const;
export const marketDayOptions = ['Weekday', 'Weekend'] as const;
export const productLineOptions = ['Weekly Groceries', 'Specialty Items'] as const;

export const defaultMarketDay = 'Weekday';

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
    id: 'KKF-2026-1001',
    orderNumber: 'KKF-2026-1001',
    customerId: 'C-001',
    customerName: 'Amina Owolabi',
    phone: '+2348012345678',
    whatsapp: '+2348012345678',
    email: 'amina@estate.com',
    estate: 'Lekki Phase 1',
    estateCode: 'LP1',
    deliveryZone: 'Zone A',
    address: '5 Block A, Lekki Phase 1',
    status: 'Awaiting Rider',
    paymentStatus: 'Pending',
    marketDay: 'Weekday',
    productLine: 'Weekly Groceries',
    assignedRunner: 'Runner Joseph',
    shoppingBudget: 31500,
    actualSpend: 29000,
    shoppingMargin: 2500,
    runnerIncentive: 1450,
    businessMargin: 1050,
    items: [
      { id: 'I-001', name: 'Rice (10kg)', quantity: 1, price: 25000 },
      { id: 'I-002', name: 'Tomatoes (crate)', quantity: 2, price: 4500 }
    ],
    quantity: 3,
    subtotal: 34000,
    serviceFee: 1200,
    deliveryFee: 1500,
    additionalCharges: 0,
    grandTotal: 36700,
    batchId: 'B-101',
    assignedRider: 'Rider A',
    dispatchId: 'D-801',
    purchaseCost: 29000,
    deliveryBatchId: 'DB-201',
    customDelivery: false,
    receiptImages: [],
    statusTimeline: [
      { status: 'NEW', at: '2026-06-24T09:18:00Z' },
      { status: 'CONFIRMED', at: '2026-06-24T09:20:00Z' },
      { status: 'RUNNER_ASSIGNED', at: '2026-06-24T09:23:00Z', by: 'Admin' }
    ],
    notes: 'Customer prefers green tomatoes',
    createdAt: '2026-06-24T09:18:00Z',
    updatedAt: '2026-06-24T09:24:00Z'
  },
  {
    id: 'KKF-2026-1002',
    orderNumber: 'KKF-2026-1002',
    customerId: 'C-002',
    customerName: 'Tunde Adams',
    phone: '+2348012345679',
    whatsapp: '+2348012345679',
    email: 'tunde@compound.com',
    estate: 'Lekki Gardens',
    estateCode: 'LKG',
    deliveryZone: 'Zone B',
    address: '12 Gate B, Lekki Gardens',
    status: 'Assigned',
    paymentStatus: 'Paid',
    marketDay: 'Weekday',
    productLine: 'Weekly Groceries',
    assignedRunner: 'Runner Joseph',
    shoppingBudget: 16000,
    actualSpend: 13000,
    shoppingMargin: 3000,
    runnerIncentive: 650,
    businessMargin: 2350,
    items: [
      { id: 'I-003', name: 'Indomie (12 pack)', quantity: 3, price: 2200 },
      { id: 'I-004', name: 'Vegetable oil (5L)', quantity: 1, price: 8700 }
    ],
    quantity: 4,
    subtotal: 15300,
    serviceFee: 1200,
    deliveryFee: 1500,
    additionalCharges: 0,
    grandTotal: 18000,
    batchId: 'B-102',
    assignedRider: 'Rider B',
    dispatchId: 'D-802',
    purchaseCost: 13000,
    deliveryBatchId: 'DB-202',
    customDelivery: true,
    customDeliveryReason: 'Requested same-day evening drop',
    customDeliveryRequestedDate: '2026-06-24',
    customDeliveryPremiumFee: 3500,
    receiptImages: ['https://images.example.com/receipts/kkf-2026-1002-1.jpg'],
    statusTimeline: [
      { status: 'NEW', at: '2026-06-24T08:45:00Z' },
      { status: 'CONFIRMED', at: '2026-06-24T08:50:00Z' },
      { status: 'RUNNER_ASSIGNED', at: '2026-06-24T09:01:00Z', by: 'Dispatch' },
      { status: 'SHOPPING', at: '2026-06-24T09:05:00Z', by: 'Runner Joseph' }
    ],
    notes: 'Runner should confirm brand on arrival',
    createdAt: '2026-06-24T08:45:00Z',
    updatedAt: '2026-06-24T09:05:00Z'
  },
  {
    id: 'KKF-2026-1003',
    orderNumber: 'KKF-2026-1003',
    customerId: 'C-003',
    customerName: 'Ngozi Chukwu',
    phone: '+2348012345680',
    whatsapp: '+2348012345680',
    email: 'ngozi@estate.com',
    estate: 'Chevron',
    estateCode: 'CHV',
    deliveryZone: 'Zone C',
    address: 'Unit 34, Chevron Estate',
    status: 'In Transit',
    paymentStatus: 'Paid',
    marketDay: 'Weekend',
    productLine: 'Specialty Items',
    assignedRunner: 'Runner Mary',
    shoppingBudget: 7200,
    actualSpend: 5900,
    shoppingMargin: 1300,
    runnerIncentive: 295,
    businessMargin: 1005,
    items: [
      { id: 'I-005', name: 'Bread (4 loaves)', quantity: 2, price: 2200 },
      { id: 'I-006', name: 'Eggs (30pcs)', quantity: 1, price: 3200 }
    ],
    quantity: 3,
    subtotal: 7600,
    serviceFee: 1200,
    deliveryFee: 1500,
    additionalCharges: 0,
    grandTotal: 10300,
    batchId: 'B-103',
    assignedRider: 'Rider C',
    dispatchId: 'D-803',
    purchaseCost: 5900,
    deliveryBatchId: 'DB-203',
    receiptImages: ['https://images.example.com/receipts/kkf-2026-1003-1.jpg'],
    statusTimeline: [
      { status: 'NEW', at: '2026-06-24T07:55:00Z' },
      { status: 'CONFIRMED', at: '2026-06-24T08:00:00Z' },
      { status: 'RUNNER_ASSIGNED', at: '2026-06-24T08:05:00Z' },
      { status: 'AT_STAGING', at: '2026-06-24T08:20:00Z' },
      { status: 'OUT_FOR_DELIVERY', at: '2026-06-24T08:35:00Z' }
    ],
    notes: 'Call before delivery',
    createdAt: '2026-06-24T07:55:00Z',
    updatedAt: '2026-06-24T08:10:00Z'
  }
];

export const mockEstateBatches: EstateBatch[] = [
  {
    id: 'B-101',
    name: 'Batch A',
    estate: 'Lekki Phase 1',
    estateCode: 'LP1',
    deliveryZone: 'Zone A',
    orderIds: ['KKF-2026-1001'],
    orders: 1,
    totalValue: 36700,
    assignedRider: 'Rider A',
    status: 'Assigned',
    createdAt: '2026-06-24T08:00:00Z',
    updatedAt: '2026-06-24T08:00:00Z'
  },
  {
    id: 'B-102',
    name: 'Batch B',
    estate: 'Lekki Gardens',
    estateCode: 'LKG',
    deliveryZone: 'Zone B',
    orderIds: ['KKF-2026-1002'],
    orders: 1,
    totalValue: 18000,
    assignedRider: 'Rider B',
    status: 'In Progress',
    createdAt: '2026-06-24T07:40:00Z',
    updatedAt: '2026-06-24T09:15:00Z'
  },
  {
    id: 'B-103',
    name: 'Batch C',
    estate: 'Chevron',
    estateCode: 'CHV',
    deliveryZone: 'Zone C',
    orderIds: ['KKF-2026-1003'],
    orders: 1,
    totalValue: 10300,
    assignedRider: 'Rider C',
    status: 'Pending',
    createdAt: '2026-06-24T08:20:00Z',
    updatedAt: '2026-06-24T08:20:00Z'
  }
];

export const mockDispatches: DispatchRecord[] = [
  {
    id: 'D-801',
    orderId: 'KKF-2026-1001',
    orderNumber: 'KKF-2026-1001',
    customerName: 'Amina Owolabi',
    estate: 'Lekki Phase 1',
    status: 'Unassigned',
    assignedRider: '',
    createdAt: '2026-06-24T09:24:00Z',
    updatedAt: '2026-06-24T09:24:00Z'
  },
  {
    id: 'D-802',
    orderId: 'KKF-2026-1002',
    orderNumber: 'KKF-2026-1002',
    customerName: 'Tunde Adams',
    estate: 'Lekki Gardens',
    status: 'Assigned',
    assignedRider: 'Rider B',
    createdAt: '2026-06-24T08:46:00Z',
    updatedAt: '2026-06-24T09:01:00Z'
  },
  {
    id: 'D-803',
    orderId: 'KKF-2026-1003',
    orderNumber: 'KKF-2026-1003',
    customerName: 'Ngozi Chukwu',
    estate: 'Chevron',
    status: 'In Transit',
    assignedRider: 'Rider C',
    createdAt: '2026-06-24T07:56:00Z',
    updatedAt: '2026-06-24T08:40:00Z'
  }
];

export const mockRunnerTasks: RunnerTask[] = [
  {
    id: 'R-301',
    orderId: 'KKF-2026-1002',
    orderNumber: 'KKF-2026-1002',
    task: 'Source Indomie and vegetable oil at Matori market',
    status: 'In Progress',
    assignedTo: 'Runner Joseph',
    marketDay: 'Weekday',
    productLine: 'Weekly Groceries',
    estate: 'Lekki Gardens',
    shoppingList: ['Indomie 12 pack x 3', 'Vegetable oil 5L x 1'],
    allocatedBudget: 16000,
    actualSpend: 13000,
    unavailableItems: ['Indomie onion flavor'],
    suggestedSubstitutions: ['Indomie chicken flavor'],
    receiptImages: ['https://images.example.com/receipts/kkf-2026-1002-1.jpg'],
    shoppingCompletedAt: '2026-06-24T09:25:00Z',
    purchaseCost: 13000,
    notes: 'Check available brands and prices before purchase',
    updatedAt: '2026-06-24T09:10:00Z'
  }
];

export const mockRunnerProfiles: RunnerProfile[] = [
  {
    id: 'RP-001',
    name: 'Runner Joseph',
    phone: '+2348091110001',
    email: 'runner.joseph@kiakiafoods.com',
    active: true,
    assignedOrderIds: ['KKF-2026-1001', 'KKF-2026-1002'],
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-06-24T09:00:00Z'
  },
  {
    id: 'RP-002',
    name: 'Runner Mary',
    phone: '+2348091110002',
    email: 'runner.mary@kiakiafoods.com',
    active: true,
    assignedOrderIds: ['KKF-2026-1003'],
    createdAt: '2026-02-08T09:00:00Z',
    updatedAt: '2026-06-24T08:30:00Z'
  }
];

export const mockDeliveryBatches: DeliveryBatch[] = [
  {
    id: 'DB-201',
    marketDay: 'Weekday',
    estate: 'Lekki Phase 1',
    deliveryWindow: '12:00 - 15:00',
    orderIds: ['KKF-2026-1001'],
    assignedRider: 'Rider A',
    dispatchCost: 1200,
    collectedDeliveryFees: 1500,
    deliveryMargin: 300,
    createdAt: '2026-06-24T09:30:00Z',
    updatedAt: '2026-06-24T09:30:00Z'
  },
  {
    id: 'DB-203',
    marketDay: 'Weekend',
    estate: 'Chevron',
    deliveryWindow: '15:00 - 18:00',
    orderIds: ['KKF-2026-1003'],
    assignedRider: 'Rider C',
    dispatchCost: 1000,
    collectedDeliveryFees: 1500,
    deliveryMargin: 500,
    createdAt: '2026-06-24T08:20:00Z',
    updatedAt: '2026-06-24T08:20:00Z'
  }
];

export const mockProductCatalog: ProductCatalogEntry[] = [
  {
    id: 'CAT-WG-001',
    name: 'Rice (10kg)',
    line: 'Weekly Groceries',
    unitPrice: 25000,
    active: true
  },
  {
    id: 'CAT-SP-001',
    name: 'Atlantic Salmon Fillet',
    line: 'Specialty Items',
    unitPrice: 18000,
    active: true,
    specialty: {
      id: 'SP-001',
      name: 'Atlantic Salmon Fillet',
      category: 'Seafood',
      description: 'Premium frozen cut for weekend meal prep.',
      photo: 'https://images.example.com/products/salmon.jpg',
      availability: 'In Stock',
      leadTimeDays: 2,
      minimumQuantity: 1,
      unitPrice: 18000,
      active: true,
      createdAt: '2026-04-12T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    }
  }
];

export const defaultOmsSettings: BusinessSettings = defaultBusinessSettings;

export function applyBudgetRules(allocatedBudget: number, actualSpend: number, runnerBonusPercentage: number) {
  return calculateShoppingBudgetMetrics(allocatedBudget, actualSpend, runnerBonusPercentage);
}

export function applyDeliveryMarginRules(collectedDeliveryFees: number, dispatchCost: number) {
  return calculateDeliveryMetrics(collectedDeliveryFees, dispatchCost);
}

export const mockRiderAssignments: RiderAssignment[] = [
  {
    id: 'RA-501',
    orderId: 'KKF-2026-1003',
    orderNumber: 'KKF-2026-1003',
    customerName: 'Ngozi Chukwu',
    phone: '+2348012345680',
    address: 'Unit 34, Chevron Estate',
    estate: 'Chevron',
    status: 'In Transit',
    assignedRider: 'Rider C',
    notes: 'Delivery estimated in 20 minutes',
    inTransitAt: '2026-06-24T08:40:00Z',
    updatedAt: '2026-06-24T08:40:00Z'
  }
];

export const mockEstates: EstateRecord[] = [
  {
    id: 'E-1',
    name: 'Lekki Phase 1',
    code: 'LP1',
    deliveryZone: 'Zone A',
    assignedRiders: ['Rider A'],
    numberOfOrders: 1,
    dailyDeliveries: 1,
    completedDeliveries: 0,
    pendingDeliveries: 1,
    failedDeliveries: 0,
    revenueGenerated: 36700,
    createdAt: '2026-06-24T08:00:00Z',
    updatedAt: '2026-06-24T09:24:00Z'
  },
  {
    id: 'E-2',
    name: 'Lekki Gardens',
    code: 'LKG',
    deliveryZone: 'Zone B',
    assignedRiders: ['Rider B'],
    numberOfOrders: 1,
    dailyDeliveries: 1,
    completedDeliveries: 0,
    pendingDeliveries: 1,
    failedDeliveries: 0,
    revenueGenerated: 18000,
    createdAt: '2026-06-24T07:40:00Z',
    updatedAt: '2026-06-24T09:05:00Z'
  }
];

export const mockNotifications: NotificationRecord[] = [
  {
    id: 'N-1',
    type: 'New Order',
    title: 'New order received',
    message: 'Order KKF-2026-1001 has entered OMS.',
    orderId: 'KKF-2026-1001',
    read: false,
    createdAt: '2026-06-24T09:24:00Z'
  }
];

export const mockCustomers: CustomerProfile[] = [
  {
    id: 'C-001',
    name: 'Amina Owolabi',
    phone: '+2348012345678',
    email: 'amina@estate.com',
    estate: 'Lekki Phase 1',
    address: '5 Block A, Lekki Phase 1',
    totalOrders: 18,
    lifetimeSpend: 1295000,
    repeatOrders: 12,
    lastOrderDate: '2026-06-24',
    notes: 'Prefers WhatsApp order notes and green vegetables.'
  },
  {
    id: 'C-002',
    name: 'Tunde Adams',
    phone: '+2348012345679',
    email: 'tunde@compound.com',
    estate: 'Lekki Gardens',
    address: '12 Gate B, Lekki Gardens',
    totalOrders: 10,
    lifetimeSpend: 812000,
    repeatOrders: 7,
    lastOrderDate: '2026-06-24',
    notes: 'Schedules deliveries for weekday evenings.'
  }
];

export const mockAnalyticsSeries = [
  { label: 'Daily', value: 42 },
  { label: 'Weekly', value: 312 },
  { label: 'Monthly', value: 1468 }
];

export const mockRevenueTrend = [
  { period: 'Mon', revenue: 420000, orders: 21 },
  { period: 'Tue', revenue: 470000, orders: 24 },
  { period: 'Wed', revenue: 520000, orders: 29 },
  { period: 'Thu', revenue: 580000, orders: 31 }
];

export const mockFinanceSummary: FinanceSummary = {
  totalRevenue: 1895000,
  deliveryFees: 108000,
  outstandingPayments: 94000,
  estimatedProfit: 420000,
  unpaidOrders: 8
};

export const orderStatusMap = {
  New: 'bg-brand-100 text-brand-700',
  'Awaiting Rider': 'bg-amber-100 text-amber-700',
  Assigned: 'bg-blue-100 text-blue-700',
  'Picked Up': 'bg-cyan-100 text-cyan-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-emerald-200 text-emerald-800',
  Failed: 'bg-rose-100 text-rose-700',
  Cancelled: 'bg-slate-200 text-slate-700'
} as const;

export function formatOrderTotal(order: OrderRecord) {
  return `${formatCurrency(order.grandTotal)} / ${order.status}`;
}

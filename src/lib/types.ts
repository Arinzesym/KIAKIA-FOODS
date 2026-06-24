export type OrderStatus =
  | 'New'
  | 'Awaiting Rider'
  | 'Assigned'
  | 'Picked Up'
  | 'In Transit'
  | 'Delivered'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Paid' | 'Partially Paid' | 'Failed' | 'Refunded';

export type DispatchStatus = 'Unassigned' | 'Assigned' | 'Picked Up' | 'In Transit' | 'Delivered' | 'Completed' | 'Failed';

export type BatchStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed';

export interface CartItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderItem extends CartItem {
  id: string;
}

export interface OrderRecord {
  id: string;
  customerId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  estate: string;
  estateCode?: string;
  deliveryZone?: string;
  address: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  quantity: number;
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  additionalCharges: number;
  grandTotal: number;
  batchId: string;
  assignedRider: string;
  dispatchId?: string;
  purchaseCost: number;
  notes?: string;
  deliveryTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EstateBatch {
  id: string;
  name: string;
  estateCode: string;
  deliveryZone: string;
  orderIds: string[];
  estate: string;
  orders: number;
  totalValue: number;
  assignedRider: string;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RunnerTask {
  id: string;
  orderId: string;
  task: string;
  status: string;
  assignedTo: string;
  purchaseCost: number;
  notes: string;
  updatedAt: string;
}

export interface RiderAssignment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  estate: string;
  status: DispatchStatus;
  assignedRider: string;
  proofUrl?: string;
  notes: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  estate: string;
  status: DispatchStatus;
  assignedRider: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstateRecord {
  id: string;
  name: string;
  code: string;
  deliveryZone: string;
  assignedRiders: string[];
  numberOfOrders: number;
  dailyDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  failedDeliveries: number;
  revenueGenerated: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'New Order'
  | 'Rider Assignment'
  | 'Delivery Started'
  | 'Delivered'
  | 'Failed Delivery'
  | 'Batch Completed';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  batchId?: string;
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  averageDeliveryTime: number;
  bestRider: string;
  bestEstate: string;
  successRate: number;
  failedDeliveryRate: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  estate: string;
  address: string;
  totalOrders: number;
  lifetimeSpend: number;
  repeatOrders: number;
  lastOrderDate: string;
  notes?: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  deliveryFees: number;
  outstandingPayments: number;
  estimatedProfit: number;
  unpaidOrders: number;
}

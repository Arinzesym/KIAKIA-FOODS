export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'RUNNER_ASSIGNED'
  | 'SHOPPING'
  | 'AT_STAGING'
  | 'BATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
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

export type MarketDay = 'Weekday' | 'Weekend';
export type ProductLine = 'Weekly Groceries' | 'Specialty Items';

export interface OrderStatusTimelineEntry {
  status: OrderStatus;
  at: string;
  by?: string;
  note?: string;
}

export interface ShoppingBudgetMetrics {
  allocatedBudget: number;
  actualSpend: number;
  shoppingMargin: number;
  runnerBonus: number;
  businessMargin: number;
}

export interface DeliveryMetrics {
  dispatchCost: number;
  collectedDeliveryFees: number;
  deliveryMargin: number;
}

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
  marketDay?: MarketDay;
  productLine?: ProductLine;
  runnerAssignmentId?: string;
  assignedRunner?: string;
  shoppingBudget?: number;
  actualSpend?: number;
  shoppingMargin?: number;
  runnerIncentive?: number;
  businessMargin?: number;
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
  deliveryBatchId?: string;
  customDelivery?: boolean;
  customDeliveryReason?: string;
  customDeliveryRequestedDate?: string;
  customDeliveryPremiumFee?: number;
  deliveryMargin?: number;
  receiptImages?: string[];
  unavailableItems?: string[];
  suggestedSubstitutions?: string[];
  statusTimeline?: OrderStatusTimelineEntry[];
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
  orderNumber?: string;
  task: string;
  status: string;
  assignedTo: string;
  marketDay?: MarketDay;
  productLine?: ProductLine;
  estate?: string;
  shoppingList?: string[];
  allocatedBudget?: number;
  actualSpend?: number;
  unavailableItems?: string[];
  suggestedSubstitutions?: string[];
  receiptImages?: string[];
  shoppingCompletedAt?: string;
  deliveredToStagingAt?: string;
  purchaseCost: number;
  notes: string;
  updatedAt: string;
}

export interface RunnerProfile {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  assignedOrderIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RunnerAssignment {
  id: string;
  orderId: string;
  runnerId: string;
  marketDay: MarketDay;
  allocatedBudget: number;
  actualSpend: number;
  shoppingMargin: number;
  runnerBonus: number;
  businessMargin: number;
  status: 'Assigned' | 'Shopping' | 'At Staging' | 'Completed';
  receiptImages: string[];
  unavailableItems: string[];
  suggestedSubstitutions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecialtyProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  photo?: string;
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock';
  leadTimeDays: number;
  minimumQuantity: number;
  unitPrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogEntry {
  id: string;
  name: string;
  line: ProductLine;
  unitPrice: number;
  active: boolean;
  specialty?: SpecialtyProduct;
}

export interface DeliveryBatch {
  id: string;
  marketDay: MarketDay;
  estate: string;
  deliveryWindow: string;
  orderIds: string[];
  assignedRider: string;
  dispatchCost: number;
  collectedDeliveryFees: number;
  deliveryMargin: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSettings {
  businessName: string;
  whatsappNumber: string;
  businessAccountNumber: string;
  serviceFee: number;
  defaultDeliveryFee: number;
  customDeliveryFee: number;
  runnerBonusPercentage: number;
  marketDays: Array<{ key: MarketDay; label: string; defaultSourcingDay: string }>;
  deliveryWindows: string[];
  currency: string;
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

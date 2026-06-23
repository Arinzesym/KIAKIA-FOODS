export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Market Sourcing'
  | 'Purchased'
  | 'At Dispatch Point'
  | 'Out For Delivery'
  | 'Delivered'
  | 'Cancelled';

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
  customerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  estate: string;
  address: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  additionalCharges: number;
  grandTotal: number;
  batchId: string;
  assignedRider: string;
  purchaseCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstateBatch {
  id: string;
  estate: string;
  orders: number;
  totalValue: number;
  assignedRider: string;
  status: string;
  createdAt: string;
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
  customerName: string;
  estate: string;
  status: string;
  assignedRider: string;
  proofUrl?: string;
  notes: string;
  updatedAt: string;
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

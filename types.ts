export enum UserRole {
  PUBLIC = 'PUBLIC',
  WHOLESALE = 'WHOLESALE',
  ADMIN = 'ADMIN',
  LOGISTICS = 'LOGISTICS'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  loyaltyPoints?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  packSize: string;
  requiresPrescription: boolean;
  image: string;
  sku: string;
}

// STRICT ORDER LIFECYCLE STATES
export enum OrderStatus {
  RECEIVED = 'Received',
  INVOICE_GENERATED = 'Invoice Generated',
  PAYMENT_PENDING = 'Payment Pending',
  PAYMENT_REVIEW = 'Payment Review', // For manual proof verification
  PAYMENT_CONFIRMED = 'Payment Confirmed',
  ORDER_APPROVED = 'Order Approved', // Inventory Sync happens here
  PACKED = 'Packed',
  DISPATCHED = 'Dispatched',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
  ONLINE_CARD = 'Online Card',
  BANK_TRANSFER = 'Bank Transfer'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  date: string;
  shippingAddress: string;
  paymentMethod?: PaymentMethod;
  paymentProofUrl?: string; // For bank transfers
  invoiceUrl?: string;
  timeline: { status: OrderStatus; timestamp: string }[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SalesData {
  name: string;
  revenue: number;
  orders: number;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string; // User email
  targetId: string; // Order ID or Product ID
  timestamp: string;
  details: string;
}
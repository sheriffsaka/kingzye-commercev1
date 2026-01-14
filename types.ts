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
  password?: string; // For simulation only
  role: UserRole;
  phone?: string;
  loyaltyPoints?: number;
  isActive: boolean; // For wholesale verification
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
  minOrderQuantity: number; // New: For Wholesale enforcement
}

// STRICT ORDER LIFECYCLE STATES MATCHING PRD
export enum OrderStatus {
  RECEIVED = 'Order Received',
  INVOICE_GENERATED = 'Invoice Generated',
  PAYMENT_PENDING = 'Payment Pending',
  PAYMENT_REVIEW = 'Payment Review',
  PAYMENT_CONFIRMED = 'Payment Confirmed',
  ORDER_APPROVED = 'Order Approved', // Ready for Logistics
  PACKED = 'Packed',
  DISPATCHED = 'Dispatched', // In Transit
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
  ONLINE_CARD = 'Paystack (Online)',
  BANK_TRANSFER = 'Bank Transfer',
  PAY_ON_DELIVERY = 'Pay on Delivery'
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
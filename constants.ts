import { Product, User, UserRole, Order, OrderStatus, SalesData } from './types';

// PLEASE REPLACE THIS URL WITH YOUR UPLOADED LOGO IMAGE URL
export const COMPANY_LOGO = "https://placehold.co/200x200/1e40af/ffffff?text=KINGZY"; 

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Amoxicillin 500mg',
    category: 'Antibiotics',
    description: 'Broad-spectrum penicillin antibiotic used to treat bacterial infections.',
    price: 3500.00,
    wholesalePrice: 2800.00,
    stock: 500,
    packSize: '20 Capsules',
    requiresPrescription: true,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80',
    sku: 'AMX-500'
  },
  {
    id: 'p2',
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    description: 'Effective analgesic and antipyretic for mild to moderate pain.',
    price: 500.00,
    wholesalePrice: 350.00,
    stock: 2000,
    packSize: '100 Tablets',
    requiresPrescription: false,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    sku: 'PCM-500'
  },
  {
    id: 'p3',
    name: 'Cetirizine 10mg',
    category: 'Allergy',
    description: 'Antihistamine used to relieve allergy symptoms such as watery eyes and runny nose.',
    price: 1200.00,
    wholesalePrice: 900.00,
    stock: 850,
    packSize: '30 Tablets',
    requiresPrescription: false,
    image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&q=80',
    sku: 'CET-010'
  },
  {
    id: 'p4',
    name: 'Metformin 500mg',
    category: 'Diabetes',
    description: 'First-line medication for the treatment of type 2 diabetes.',
    price: 2500.00,
    wholesalePrice: 1800.00,
    stock: 300,
    packSize: '60 Tablets',
    requiresPrescription: true,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80',
    sku: 'MET-500'
  },
  {
    id: 'p5',
    name: 'Vitamin D3 1000IU',
    category: 'Vitamins',
    description: 'Supports healthy bones, teeth, and muscle function.',
    price: 4500.00,
    wholesalePrice: 3200.00,
    stock: 120,
    packSize: '90 Softgels',
    requiresPrescription: false,
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=400&q=80',
    sku: 'VIT-D3'
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'john@public.com', role: UserRole.PUBLIC },
  { id: 'u2', name: 'MediCorp Pharmacies', email: 'purchasing@medicorp.com', role: UserRole.WHOLESALE, loyaltyPoints: 4500 },
  { id: 'u3', name: 'Admin User', email: 'admin@kingzypharma.com', role: UserRole.ADMIN },
  { id: 'u4', name: 'Logistics Team', email: 'delivery@kingzypharma.com', role: UserRole.LOGISTICS },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2023-001',
    userId: 'u1',
    userName: 'John Doe',
    items: [{ productId: 'p2', quantity: 2, priceAtPurchase: 500.00 }],
    totalAmount: 1000.00,
    status: OrderStatus.DELIVERED,
    date: '2023-10-15',
    shippingAddress: '123 Main St, Springfield',
    timeline: [
      { status: OrderStatus.RECEIVED, timestamp: '2023-10-15T09:00:00Z' },
      { status: OrderStatus.PACKED, timestamp: '2023-10-15T10:00:00Z' },
      { status: OrderStatus.DISPATCHED, timestamp: '2023-10-15T12:00:00Z' },
      { status: OrderStatus.DELIVERED, timestamp: '2023-10-15T14:00:00Z' }
    ]
  },
  {
    id: 'ORD-2023-045',
    userId: 'u2',
    userName: 'MediCorp Pharmacies',
    items: [
        { productId: 'p1', quantity: 50, priceAtPurchase: 2800.00 },
        { productId: 'p3', quantity: 20, priceAtPurchase: 900.00 }
    ],
    totalAmount: 158000.00,
    status: OrderStatus.PACKED,
    date: '2023-10-26',
    shippingAddress: 'MediCorp Warehouse, Sector 7',
    timeline: [
        { status: OrderStatus.RECEIVED, timestamp: '2023-10-26T08:00:00Z' },
        { status: OrderStatus.ORDER_APPROVED, timestamp: '2023-10-26T09:00:00Z' },
        { status: OrderStatus.PACKED, timestamp: '2023-10-26T11:00:00Z' }
    ]
  },
  {
    id: 'ORD-2023-048',
    userId: 'u1',
    userName: 'John Doe',
    items: [{ productId: 'p5', quantity: 1, priceAtPurchase: 4500.00 }],
    totalAmount: 4500.00,
    status: OrderStatus.PAYMENT_PENDING,
    date: '2023-10-27',
    shippingAddress: '123 Main St, Springfield',
    timeline: [
        { status: OrderStatus.RECEIVED, timestamp: '2023-10-27T14:00:00Z' },
        { status: OrderStatus.PAYMENT_PENDING, timestamp: '2023-10-27T14:05:00Z' }
    ]
  }
];

export const SALES_DATA: SalesData[] = [
  { name: 'Mon', revenue: 400000, orders: 24 },
  { name: 'Tue', revenue: 300000, orders: 18 },
  { name: 'Wed', revenue: 200000, orders: 12 },
  { name: 'Thu', revenue: 278000, orders: 30 },
  { name: 'Fri', revenue: 189000, orders: 20 },
  { name: 'Sat', revenue: 239000, orders: 25 },
  { name: 'Sun', revenue: 349000, orders: 35 },
];
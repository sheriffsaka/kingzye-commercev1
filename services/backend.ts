import { Order, OrderStatus, Product, User, PaymentMethod, AuditLog, CartItem, UserRole } from '../types';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_USERS } from '../constants';

// --- SIMULATED DATABASE ---
let dbProducts = [...MOCK_PRODUCTS];
let dbOrders = [...MOCK_ORDERS].map(o => ({
  ...o,
  timeline: [{ status: o.status, timestamp: new Date().toISOString() }]
}));
let dbAuditLogs: AuditLog[] = [];

// --- HELPER: NOTIFICATION ENGINE ---
const sendNotification = (userId: string, message: string) => {
  console.log(`[NOTIFICATION_ENGINE] To User ${userId}: ${message}`);
  // In a real app, this would trigger Email/SMS
};

// --- HELPER: AUDIT LOGGING ---
const logAction = (action: string, performedBy: string, targetId: string, details: string) => {
  const log: AuditLog = {
    id: `LOG-${Date.now()}`,
    action,
    performedBy,
    targetId,
    timestamp: new Date().toISOString(),
    details
  };
  dbAuditLogs.unshift(log);
  console.log(`[AUDIT] ${action}: ${details}`);
};

// --- API ENDPOINTS ---

export const BackendService = {
  // 1. Product & Inventory
  getProducts: async () => [...dbProducts],
  
  getProductById: async (id: string) => dbProducts.find(p => p.id === id),

  // 2. Order Lifecycle Management
  createOrder: async (user: User, items: CartItem[], total: number, address: string, paymentMethod: PaymentMethod) => {
    const newOrder: Order = {
      id: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      userName: user.name,
      items: items.map(i => ({ productId: i.id, quantity: i.quantity, priceAtPurchase: user.role === UserRole.WHOLESALE ? i.wholesalePrice : i.price })),
      totalAmount: total,
      status: OrderStatus.RECEIVED, // Initial State
      date: new Date().toISOString().split('T')[0],
      shippingAddress: address,
      paymentMethod,
      timeline: [{ status: OrderStatus.RECEIVED, timestamp: new Date().toISOString() }]
    };

    // Auto-transition to Invoice Generated
    newOrder.status = OrderStatus.INVOICE_GENERATED;
    newOrder.invoiceUrl = `https://api.kingzy.com/invoices/${newOrder.id}.pdf`; // Mock URL
    newOrder.timeline.push({ status: OrderStatus.INVOICE_GENERATED, timestamp: new Date().toISOString() });

    // Payment Logic
    if (paymentMethod === PaymentMethod.ONLINE_CARD) {
      // Simulate Instant Success
      newOrder.status = OrderStatus.PAYMENT_CONFIRMED;
      newOrder.timeline.push({ status: OrderStatus.PAYMENT_CONFIRMED, timestamp: new Date().toISOString() });
      sendNotification(user.id, `Payment received for Order #${newOrder.id}. Receipt generated.`);
    } else {
      newOrder.status = OrderStatus.PAYMENT_PENDING;
      newOrder.timeline.push({ status: OrderStatus.PAYMENT_PENDING, timestamp: new Date().toISOString() });
      sendNotification(user.id, `Invoice generated for Order #${newOrder.id}. Please upload proof of payment.`);
    }

    dbOrders.unshift(newOrder);
    logAction('CREATE_ORDER', user.email, newOrder.id, `Order created via ${paymentMethod}`);
    return newOrder;
  },

  getOrders: async () => [...dbOrders],

  // 3. Payment Handling (Manual)
  uploadPaymentProof: async (orderId: string, user: User, fileUrl: string) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = dbOrders[orderIndex];
    if (order.status !== OrderStatus.PAYMENT_PENDING) throw new Error("Order not awaiting payment");

    order.paymentProofUrl = fileUrl;
    order.status = OrderStatus.PAYMENT_REVIEW;
    order.timeline.push({ status: OrderStatus.PAYMENT_REVIEW, timestamp: new Date().toISOString() });
    
    dbOrders[orderIndex] = order;
    logAction('UPLOAD_PROOF', user.email, order.id, 'Payment proof uploaded');
    return order;
  },

  verifyPayment: async (orderId: string, adminUser: User, approved: boolean) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    const order = dbOrders[orderIndex];

    if (approved) {
      order.status = OrderStatus.PAYMENT_CONFIRMED;
      sendNotification(order.userId, `Payment verified for Order #${order.id}. Processing order.`);
    } else {
      order.status = OrderStatus.PAYMENT_PENDING; // Revert to pending
      sendNotification(order.userId, `Payment proof rejected for Order #${order.id}. Please try again.`);
    }
    
    order.timeline.push({ status: order.status, timestamp: new Date().toISOString() });
    dbOrders[orderIndex] = order;
    logAction('VERIFY_PAYMENT', adminUser.email, order.id, approved ? 'Approved' : 'Rejected');
    return order;
  },

  // 4. Inventory Sync & Order Approval
  approveOrder: async (orderId: string, adminUser: User) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    const order = dbOrders[orderIndex];

    if (order.status !== OrderStatus.PAYMENT_CONFIRMED) {
      throw new Error("Cannot approve order before payment confirmation");
    }

    // INVENTORY SYNC LOGIC
    for (const item of order.items) {
      const productIndex = dbProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        if (dbProducts[productIndex].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${dbProducts[productIndex].name}`);
        }
        dbProducts[productIndex].stock -= item.quantity;
        console.log(`[INVENTORY_SYNC] Deducted ${item.quantity} from ${dbProducts[productIndex].sku}`);
      }
    }

    order.status = OrderStatus.ORDER_APPROVED;
    order.timeline.push({ status: OrderStatus.ORDER_APPROVED, timestamp: new Date().toISOString() });
    dbOrders[orderIndex] = order;
    
    sendNotification(order.userId, `Order #${order.id} approved and sent to logistics.`);
    logAction('APPROVE_ORDER', adminUser.email, order.id, 'Inventory synced');
    return order;
  },

  // 5. Logistics Workflow
  updateLogisticsStatus: async (orderId: string, status: OrderStatus, staffUser: User) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    const order = dbOrders[orderIndex];

    // State Machine Validation
    const validTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.ORDER_APPROVED]: [OrderStatus.PACKED],
      [OrderStatus.PACKED]: [OrderStatus.DISPATCHED],
      [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED],
    };

    if (!validTransitions[order.status]?.includes(status)) {
       // Allow force update for demo, but log warning
       console.warn(`[STATE_MACHINE] Warning: Transitioning from ${order.status} to ${status}`);
    }

    order.status = status;
    order.timeline.push({ status: status, timestamp: new Date().toISOString() });
    dbOrders[orderIndex] = order;

    if (status === OrderStatus.DELIVERED) {
      sendNotification(order.userId, `Order #${order.id} has been delivered. Thank you!`);
    }

    logAction('LOGISTICS_UPDATE', staffUser.email, order.id, `Status updated to ${status}`);
    return order;
  },

  getAuditLogs: async () => [...dbAuditLogs]
};
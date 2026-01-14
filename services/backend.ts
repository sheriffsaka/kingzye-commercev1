import { Order, OrderStatus, Product, User, PaymentMethod, AuditLog, CartItem, UserRole } from '../types';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_USERS } from '../constants';

// --- PERSISTENCE HELPERS ---
const DB_KEYS = {
  PRODUCTS: 'kingzy_db_products',
  ORDERS: 'kingzy_db_orders',
  LOGS: 'kingzy_db_logs',
  USERS: 'kingzy_db_users'
};

const loadData = <T>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultData;
  } catch (e) {
    console.error("DB Load Error", e);
    return defaultData;
  }
};

const saveData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("DB Save Error", e);
  }
};

// --- SIMULATED DATABASE ---
let dbProducts: Product[] = loadData(DB_KEYS.PRODUCTS, [...MOCK_PRODUCTS]);
let dbOrders: Order[] = loadData(DB_KEYS.ORDERS, [...MOCK_ORDERS]).map((o: Order) => ({
  ...o,
  timeline: o.timeline || [{ status: o.status, timestamp: o.date }]
}));
let dbAuditLogs: AuditLog[] = loadData(DB_KEYS.LOGS, []);
let dbUsers: User[] = loadData(DB_KEYS.USERS, [...MOCK_USERS]);

// --- HELPER: NOTIFICATION ENGINE ---
const sendNotification = (userId: string, message: string) => {
  console.log(`[NOTIFICATION_ENGINE] To User ${userId}: ${message}`);
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
  saveData(DB_KEYS.LOGS, dbAuditLogs);
  console.log(`[AUDIT] ${action}: ${details}`);
};

// --- API ENDPOINTS ---

export const BackendService = {
  // 1. User Management (Auth)
  login: async (email: string) => {
      // Simple simulation. In real app, check password.
      const user = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("User not found");
      if (!user.isActive) throw new Error("Account pending verification. Please contact Admin.");
      return user;
  },

  register: async (name: string, email: string, role: UserRole, phone: string) => {
      const existing = dbUsers.find(u => u.email === email);
      if (existing) throw new Error("Email already registered");

      const newUser: User = {
          id: `u-${Date.now()}`,
          name,
          email,
          role,
          phone,
          isActive: role === UserRole.WHOLESALE ? false : true, // Wholesale requires admin approval
          loyaltyPoints: 0
      };

      dbUsers.push(newUser);
      saveData(DB_KEYS.USERS, dbUsers);
      logAction('REGISTER', 'SYSTEM', newUser.id, `New ${role} user registered`);
      
      if (role === UserRole.WHOLESALE) {
          sendNotification(newUser.id, "Account created. Awaiting Admin verification.");
      }
      return newUser;
  },

  // 2. Product & Inventory
  getProducts: async () => [...dbProducts],
  
  getProductById: async (id: string) => dbProducts.find(p => p.id === id),

  // 3. Order Lifecycle Management
  createOrder: async (user: User, items: CartItem[], total: number, address: string, paymentMethod: PaymentMethod) => {
    // Inventory & MOQ Check
    for (const item of items) {
       const product = dbProducts.find(p => p.id === item.id);
       if (!product || product.stock < item.quantity) {
         throw new Error(`Insufficient stock for ${item.name}`);
       }
       // PRD: Minimum order quantity enforcement for Wholesale
       if (user.role === UserRole.WHOLESALE && item.quantity < product.minOrderQuantity) {
           throw new Error(`MOQ for ${item.name} is ${product.minOrderQuantity} units for wholesale.`);
       }
    }

    const newOrder: Order = {
      id: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`,
      userId: user.id,
      userName: user.name,
      items: items.map(i => ({ productId: i.id, quantity: i.quantity, priceAtPurchase: user.role === UserRole.WHOLESALE ? i.wholesalePrice : i.price })),
      totalAmount: total,
      status: OrderStatus.RECEIVED, 
      date: new Date().toISOString().split('T')[0],
      shippingAddress: address,
      paymentMethod,
      timeline: [{ status: OrderStatus.RECEIVED, timestamp: new Date().toISOString() }]
    };

    // Auto-Invoice Generation
    newOrder.status = OrderStatus.INVOICE_GENERATED;
    newOrder.invoiceUrl = `#generated-invoice-${newOrder.id}`; 
    newOrder.timeline.push({ status: OrderStatus.INVOICE_GENERATED, timestamp: new Date().toISOString() });

    // Payment Logic
    if (paymentMethod === PaymentMethod.ONLINE_CARD) {
      // Simulate Paystack Success
      newOrder.status = OrderStatus.PAYMENT_CONFIRMED;
      newOrder.timeline.push({ status: OrderStatus.PAYMENT_CONFIRMED, timestamp: new Date().toISOString() });
      sendNotification(user.id, `Payment received via Paystack. Order #${newOrder.id} confirmed.`);
    } else if (paymentMethod === PaymentMethod.PAY_ON_DELIVERY) {
      // PoD requires Admin Approval to proceed
      newOrder.status = OrderStatus.PAYMENT_PENDING; // Placeholder for approval
      sendNotification(user.id, `Order #${newOrder.id} placed (Pay on Delivery). Awaiting Admin confirmation.`);
    } else {
      // Bank Transfer
      newOrder.status = OrderStatus.PAYMENT_PENDING;
      newOrder.timeline.push({ status: OrderStatus.PAYMENT_PENDING, timestamp: new Date().toISOString() });
      sendNotification(user.id, `Invoice generated. Please upload proof of payment for Order #${newOrder.id}.`);
    }

    dbOrders.unshift(newOrder);
    saveData(DB_KEYS.ORDERS, dbOrders);
    
    logAction('CREATE_ORDER', user.email, newOrder.id, `Order created via ${paymentMethod}`);
    return newOrder;
  },

  getOrders: async () => [...dbOrders],

  // 4. Payment Handling
  uploadPaymentProof: async (orderId: string, user: User, fileUrl: string) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = { ...dbOrders[orderIndex] }; 
    if (order.status !== OrderStatus.PAYMENT_PENDING) throw new Error("Order not awaiting payment");

    order.paymentProofUrl = fileUrl;
    order.status = OrderStatus.PAYMENT_REVIEW;
    order.timeline.push({ status: OrderStatus.PAYMENT_REVIEW, timestamp: new Date().toISOString() });
    
    dbOrders[orderIndex] = order;
    saveData(DB_KEYS.ORDERS, dbOrders);
    
    logAction('UPLOAD_PROOF', user.email, order.id, 'Payment proof uploaded');
    return order;
  },

  verifyPayment: async (orderId: string, adminUser: User, approved: boolean) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    const order = { ...dbOrders[orderIndex] };

    if (approved) {
      order.status = OrderStatus.PAYMENT_CONFIRMED;
      sendNotification(order.userId, `Payment verified for Order #${order.id}.`);
    } else {
      order.status = OrderStatus.PAYMENT_PENDING;
      sendNotification(order.userId, `Payment proof rejected for Order #${order.id}.`);
    }
    
    order.timeline.push({ status: order.status, timestamp: new Date().toISOString() });
    dbOrders[orderIndex] = order;
    saveData(DB_KEYS.ORDERS, dbOrders);
    
    logAction('VERIFY_PAYMENT', adminUser.email, order.id, approved ? 'Approved' : 'Rejected');
    return order;
  },

  // 5. Admin Approval & Inventory Sync
  approveOrder: async (orderId: string, adminUser: User) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    const order = { ...dbOrders[orderIndex] };

    // Valid states for approval: Payment Confirmed OR Pay On Delivery
    if (order.paymentMethod !== PaymentMethod.PAY_ON_DELIVERY && order.status !== OrderStatus.PAYMENT_CONFIRMED) {
         throw new Error("Payment must be confirmed before approval (except Pay on Delivery).");
    }

    // INVENTORY SYNC
    const updatedProducts = [...dbProducts];
    for (const item of order.items) {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        if (updatedProducts[productIndex].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${updatedProducts[productIndex].name}`);
        }
        updatedProducts[productIndex].stock -= item.quantity;
      }
    }
    
    dbProducts = updatedProducts;
    saveData(DB_KEYS.PRODUCTS, dbProducts);

    order.status = OrderStatus.ORDER_APPROVED; // Ready for Logistics
    order.timeline.push({ status: OrderStatus.ORDER_APPROVED, timestamp: new Date().toISOString() });
    dbOrders[orderIndex] = order;
    saveData(DB_KEYS.ORDERS, dbOrders);
    
    sendNotification(order.userId, `Order #${order.id} approved and sent to logistics.`);
    logAction('APPROVE_ORDER', adminUser.email, order.id, 'Inventory synced. Order Approved.');
    return order;
  },

  // 6. Logistics
  updateLogisticsStatus: async (orderId: string, status: OrderStatus, staffUser: User) => {
    const orderIndex = dbOrders.findIndex(o => o.id === orderId);
    const order = { ...dbOrders[orderIndex] };

    order.status = status;
    order.timeline.push({ status: status, timestamp: new Date().toISOString() });
    
    dbOrders[orderIndex] = order;
    saveData(DB_KEYS.ORDERS, dbOrders);

    if (status === OrderStatus.DELIVERED) {
      sendNotification(order.userId, `Order #${order.id} has been delivered. Thank you!`);
    }

    logAction('LOGISTICS_UPDATE', staffUser.email, order.id, `Status updated to ${status}`);
    return order;
  },
};
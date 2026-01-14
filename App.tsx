import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Search, 
  Menu, 
  X, 
  LogOut, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  MessageCircle,
  Stethoscope,
  Pill,
  CreditCard,
  FileText,
  Upload,
  Check,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

import { MOCK_PRODUCTS, MOCK_USERS, SALES_DATA, COMPANY_LOGO } from './constants';
import { Product, User, UserRole, CartItem, Order, OrderStatus, PaymentMethod } from './types';
import { getGeminiResponse } from './services/geminiService';
import { BackendService } from './services/backend';

// --- CONTEXT ---
interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  orders: Order[];
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within a AppProvider");
  return context;
};

// --- COMPONENTS ---

// 1. Navigation & Layout
const Navbar = () => {
  const { currentUser, cart, setCurrentUser } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (currentUser?.role) {
      case UserRole.ADMIN: return '/admin';
      case UserRole.LOGISTICS: return '/logistics';
      case UserRole.WHOLESALE: return '/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <nav className="bg-medical-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-white p-1 rounded-full mr-3 shadow-md">
              <img src={COMPANY_LOGO} alt="Kingzy" className="h-10 w-10 object-contain rounded-full" />
            </div>
            <span className="font-bold text-xl tracking-tight">Kingzy Pharmaceuticals Limited</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-medical-100 transition">Home</Link>
            <Link to="/products" className="hover:text-medical-100 transition">Products</Link>
            
            {currentUser && (
               <Link to={getDashboardLink()} className="hover:text-medical-100 transition">Dashboard</Link>
            )}

            <div className="relative">
              <Link to="/cart" className="hover:text-medical-100 transition flex items-center">
                <ShoppingBag className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm bg-medical-900 py-1 px-3 rounded-full">
                  {currentUser.role}
                </span>
                <button onClick={handleLogout} className="hover:text-red-200">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                 {/* Role Switcher for Demo Purposes */}
                 <select 
                  className="text-gray-900 text-sm rounded p-1"
                  onChange={(e) => {
                    const user = MOCK_USERS.find(u => u.id === e.target.value);
                    if (user) setCurrentUser(user);
                  }}
                  value=""
                 >
                    <option value="" disabled>Login As...</option>
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                 </select>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-medical-800 px-4 pt-2 pb-4 space-y-2">
           <Link to="/" className="block py-2 hover:bg-medical-600 rounded">Home</Link>
           <Link to="/products" className="block py-2 hover:bg-medical-600 rounded">Products</Link>
           <Link to="/cart" className="block py-2 hover:bg-medical-600 rounded">Cart ({cart.length})</Link>
           {currentUser && <Link to={getDashboardLink()} className="block py-2 hover:bg-medical-600 rounded">Dashboard</Link>}
        </div>
      )}
    </nav>
  );
};

// 2. Chat Assistant
const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await getGeminiResponse(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-medical-600 hover:bg-medical-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 md:w-96 flex flex-col h-[500px] border border-gray-200">
          <div className="bg-medical-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white p-0.5 rounded-full mr-2">
                 <img src={COMPANY_LOGO} alt="Bot" className="h-5 w-5 object-contain rounded-full" />
              </div>
              <span className="font-semibold">PharmaBot Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <p className="text-gray-500 text-center text-sm mt-10">
                Hello! Ask me about medicines, stock availability, or health tips.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  m.role === 'user' 
                    ? 'bg-medical-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400 animate-pulse">PharmaBot is thinking...</div>}
          </div>
          
          <div className="p-3 border-t bg-white">
            <div className="flex space-x-2">
              <input 
                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-medical-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Pages

const Home = () => {
  const { products } = useAppContext();
  const featured = products.slice(0, 3);
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-10">
      {/* Hero */}
      <section className="relative bg-medical-50 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Reliable Healthcare, <span className="text-medical-600">Delivered</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Trusted by hospitals, pharmacies, and families. Sourcing authentic pharmaceuticals with fast logistics.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate('/products')}
              className="bg-medical-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-medical-700 transition shadow-lg"
            >
              Browse Medicines
            </button>
            <button className="bg-white text-medical-600 border border-medical-600 px-8 py-3 rounded-lg font-semibold hover:bg-medical-50 transition">
              Upload Prescription
            </button>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Pill className="h-6 w-6 mr-2 text-medical-600" />
          Featured Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gray-100 relative">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                {p.requiresPrescription && (
                  <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                    Rx Only
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="text-sm text-medical-600 font-semibold mb-1">{p.category}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{p.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">₦{p.price.toLocaleString()}</span>
                  <Link to={`/products/${p.id}`} className="text-medical-600 hover:underline text-sm font-medium">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Features */}
      <section className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-4">
            <Truck className="h-10 w-10 text-medical-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Fast Logistics</h3>
            <p className="text-gray-500 text-sm">Same-day dispatch for wholesale partners.</p>
          </div>
          <div className="p-4">
            <CheckCircle className="h-10 w-10 text-medical-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Authenticity Guaranteed</h3>
            <p className="text-gray-500 text-sm">100% genuine products directly from manufacturers.</p>
          </div>
          <div className="p-4">
            <UserIcon className="h-10 w-10 text-medical-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Pharmacist Support</h3>
            <p className="text-gray-500 text-sm">24/7 access to qualified pharmaceutical advice.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductList = () => {
  const { products, addToCart, currentUser } = useAppContext();
  const [filter, setFilter] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  const getPrice = (p: Product) => {
    if (currentUser?.role === UserRole.WHOLESALE) return p.wholesalePrice;
    return p.price;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Product Catalog</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search medicines..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(p => (
          <div key={p.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="h-40 bg-gray-100 relative">
               <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
               {currentUser?.role === UserRole.WHOLESALE && (
                 <span className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                   Wholesale Price
                 </span>
               )}
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{p.category}</div>
              <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{p.packSize}</p>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-lg font-bold text-medical-700">₦{getPrice(p).toLocaleString()}</div>
                  {currentUser?.role === UserRole.WHOLESALE && (
                    <div className="text-xs text-gray-400 line-through">₦{p.price.toLocaleString()}</div>
                  )}
                </div>
                <button 
                  onClick={() => addToCart(p, 1)}
                  className="bg-medical-50 text-medical-700 hover:bg-medical-100 p-2 rounded-full transition"
                >
                  <ShoppingBag className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Cart = () => {
  const { cart, removeFromCart, currentUser, clearCart, refreshData } = useAppContext();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ONLINE_CARD);
  const [address, setAddress] = useState('');

  const total = cart.reduce((acc, item) => {
    const price = currentUser?.role === UserRole.WHOLESALE ? item.wholesalePrice : item.price;
    return acc + (price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (!currentUser) {
      alert("Please login to proceed.");
      return;
    }
    if (!address) {
      alert("Please enter a shipping address.");
      return;
    }
    
    await BackendService.createOrder(currentUser, cart, total, address, paymentMethod);
    clearCart();
    refreshData();
    navigate('/dashboard');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our catalog to add medicines.</p>
        <Link to="/products" className="text-medical-600 hover:underline font-medium">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h2>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cart.map(item => {
             const price = currentUser?.role === UserRole.WHOLESALE ? item.wholesalePrice : item.price;
             return (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.packSize}</p>
                    {item.requiresPrescription && <span className="text-xs text-red-500 font-medium">Prescription Required</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-medium">₦{price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
             );
          })}
        </div>

        {/* Checkout Form */}
        <div className="lg:w-96">
          <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-24">
            <h3 className="font-bold text-lg mb-4">Checkout Details</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
              <textarea 
                className="w-full border rounded p-2 text-sm" 
                rows={3} 
                placeholder="Enter full delivery address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="space-y-2">
                <div 
                  className={`border rounded p-3 cursor-pointer flex items-center ${paymentMethod === PaymentMethod.ONLINE_CARD ? 'border-medical-600 bg-medical-50' : ''}`}
                  onClick={() => setPaymentMethod(PaymentMethod.ONLINE_CARD)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="text-sm">Pay with Card (Instant)</span>
                </div>
                <div 
                  className={`border rounded p-3 cursor-pointer flex items-center ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'border-medical-600 bg-medical-50' : ''}`}
                  onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm">Bank Transfer (Manual Verification)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              {currentUser?.role === UserRole.WHOLESALE && (
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Wholesale Discount</span>
                  <span>Applied</span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-medical-600 text-white py-3 rounded-lg font-semibold hover:bg-medical-700 transition"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser, orders, refreshData } = useAppContext();
  
  if (!currentUser) return <Navigate to="/" />;

  const myOrders = orders.filter(o => o.userId === currentUser.id);

  const handleUploadProof = async (orderId: string) => {
    // Simulate file upload
    const mockUrl = "https://mock.storage.com/proof-" + Math.random().toString(36).substring(7) + ".jpg";
    await BackendService.uploadPaymentProof(orderId, currentUser, mockUrl);
    alert("Proof uploaded successfully! Admin will verify shortly.");
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {currentUser.name}</h1>
          <p className="text-gray-500">Manage your orders and account settings.</p>
        </div>
        {currentUser.role === UserRole.WHOLESALE && (
          <div className="mt-4 md:mt-0 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
             <span className="text-sm font-semibold">Loyalty Points:</span>
             <span className="text-xl font-bold ml-2">{currentUser.loyaltyPoints}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Package className="h-5 w-5 mr-2 text-medical-600" />
            Order History
          </h2>
          
          <div className="space-y-4">
            {myOrders.length === 0 ? (
               <div className="text-gray-500 bg-white p-6 rounded-lg text-center border">No orders found.</div>
            ) : (
              myOrders.map(order => (
                <div key={order.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <div>
                      <div className="font-bold text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.date}</div>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                        order.status === OrderStatus.PAYMENT_PENDING ? 'bg-yellow-100 text-yellow-800' :
                        order.status === OrderStatus.PAYMENT_REVIEW ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-b py-4 my-4 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{MOCK_PRODUCTS.find(p=>p.id === item.productId)?.name || 'Item'} (x{item.quantity})</span>
                        <span>₦{(item.priceAtPurchase * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="font-bold">Total: ₦{order.totalAmount.toLocaleString()}</div>
                    
                    <div className="flex space-x-2">
                       {/* Action Buttons based on state */}
                       {order.status === OrderStatus.PAYMENT_PENDING && order.paymentMethod === PaymentMethod.BANK_TRANSFER && (
                          <button 
                            onClick={() => handleUploadProof(order.id)}
                            className="bg-medical-600 text-white px-3 py-1.5 rounded text-sm hover:bg-medical-700 flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Proof
                          </button>
                       )}
                       
                       {(order.status === OrderStatus.INVOICE_GENERATED || order.status !== OrderStatus.RECEIVED) && (
                         <button className="text-medical-600 hover:text-medical-800 text-sm font-medium flex items-center border border-medical-600 px-3 py-1.5 rounded">
                           <FileText className="h-4 w-4 mr-1" />
                           Invoice
                         </button>
                       )}
                    </div>
                  </div>
                  {order.paymentMethod === PaymentMethod.BANK_TRANSFER && order.status === OrderStatus.PAYMENT_PENDING && (
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Please transfer to Kingzy Bank: 123-456-7890. Upload receipt to proceed.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center cursor-pointer hover:text-medical-600"><UserIcon className="h-4 w-4 mr-2" /> Profile Settings</li>
              <li className="flex items-center cursor-pointer hover:text-medical-600"><CreditCard className="h-4 w-4 mr-2" /> Payment Methods</li>
              <li className="flex items-center cursor-pointer hover:text-medical-600"><AlertCircle className="h-4 w-4 mr-2" /> Help Center</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { orders, currentUser, refreshData } = useAppContext();
  
  if (!currentUser) return null;

  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    await BackendService.verifyPayment(orderId, currentUser, approve);
    refreshData();
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await BackendService.approveOrder(orderId, currentUser);
      refreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const pendingPayments = orders.filter(o => o.status === OrderStatus.PAYMENT_REVIEW);
  const readyForApproval = orders.filter(o => o.status === OrderStatus.PAYMENT_CONFIRMED);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
           <div className="text-gray-500 text-xs uppercase font-bold mb-2">Total Revenue</div>
           <div className="text-2xl font-bold text-gray-900">₦24,500,000.00</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
           <div className="text-gray-500 text-xs uppercase font-bold mb-2">Pending Payments</div>
           <div className="text-2xl font-bold text-orange-500">{pendingPayments.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
           <div className="text-gray-500 text-xs uppercase font-bold mb-2">Ready to Pack</div>
           <div className="text-2xl font-bold text-blue-600">{readyForApproval.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Payment Verification */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-medical-600" />
            Payment Verification
          </h3>
          {pendingPayments.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending payments.</p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map(order => (
                <div key={order.id} className="border p-4 rounded-lg bg-orange-50">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{order.id}</span>
                    <span className="text-sm font-semibold">₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">User: {order.userName}</div>
                  <div className="flex space-x-2">
                    <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline flex items-center mr-auto">
                      View Proof
                    </a>
                    <button onClick={() => handleVerifyPayment(order.id, true)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Accept</button>
                    <button onClick={() => handleVerifyPayment(order.id, false)} className="bg-red-500 text-white px-3 py-1 rounded text-xs">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Approval (Sync Inventory) */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
           <h3 className="font-bold text-lg mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-medical-600" />
            Approve Orders (Inventory Sync)
          </h3>
          {readyForApproval.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders waiting for approval.</p>
          ) : (
             <div className="space-y-4">
              {readyForApproval.map(order => (
                <div key={order.id} className="border p-4 rounded-lg bg-blue-50">
                   <div className="flex justify-between mb-2">
                    <span className="font-bold">{order.id}</span>
                    <span className="text-sm font-semibold">₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                   <div className="text-xs text-gray-500 mb-3">Status: Paid</div>
                   <button onClick={() => handleApproveOrder(order.id)} className="w-full bg-medical-600 text-white py-2 rounded text-sm hover:bg-medical-700">
                     Approve & Sync Stock
                   </button>
                </div>
              ))}
             </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-10">
        <h3 className="font-bold text-lg mb-6 flex items-center"><BarChart3 className="h-5 w-5 mr-2" /> Weekly Sales</h3>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={SALES_DATA}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <ChartTooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
               <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const LogisticsDashboard = () => {
  const { orders, currentUser, refreshData } = useAppContext();
  
  if (!currentUser) return null;

  // Logistics flow: Approved -> Packed -> Dispatched -> Delivered
  const activeOrders = orders.filter(o => 
    [OrderStatus.ORDER_APPROVED, OrderStatus.PACKED, OrderStatus.DISPATCHED].includes(o.status)
  );

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await BackendService.updateLogisticsStatus(orderId, status, currentUser);
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Truck className="h-8 w-8 mr-3 text-medical-600" />
        Logistics Management
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {activeOrders.map(order => (
          <div key={order.id} className="bg-white border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
               <div className="flex items-center space-x-2 mb-1">
                 <span className="font-bold text-lg text-gray-900">{order.id}</span>
                 <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{order.date}</span>
               </div>
               <div className="text-gray-600 text-sm mb-2">Ship to: {order.shippingAddress}</div>
               <div className="flex space-x-2">
                 {order.items.map((item, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                      {MOCK_PRODUCTS.find(p=>p.id===item.productId)?.name} x{item.quantity}
                    </span>
                 ))}
               </div>
            </div>

            <div className="flex items-center space-x-4">
               <div className="text-right mr-4">
                 <div className="text-xs text-gray-500 uppercase font-bold">Current Status</div>
                 <div className="font-semibold text-medical-700">{order.status}</div>
               </div>
               
               {order.status === OrderStatus.ORDER_APPROVED && (
                 <button 
                  onClick={() => handleUpdateStatus(order.id, OrderStatus.PACKED)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-medium text-sm transition"
                 >
                   Mark Packed
                 </button>
               )}
               {order.status === OrderStatus.PACKED && (
                 <button 
                  onClick={() => handleUpdateStatus(order.id, OrderStatus.DISPATCHED)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm transition"
                 >
                   Dispatch
                 </button>
               )}
               {order.status === OrderStatus.DISPATCHED && (
                 <button 
                  onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium text-sm transition"
                 >
                   Confirm Delivery
                 </button>
               )}
            </div>
          </div>
        ))}

        {activeOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No active logistics tasks. Good job!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- APP CONTAINER ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Initial Data Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const p = await BackendService.getProducts();
    const o = await BackendService.getOrders();
    setProducts(p);
    setOrders(o);
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const value = {
    currentUser,
    setCurrentUser,
    products,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    orders,
    refreshData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const ProtectedRoute: React.FC<{ children: React.ReactElement, allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
};

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/logistics" element={
            <ProtectedRoute allowedRoles={[UserRole.LOGISTICS, UserRole.ADMIN]}>
              <LogisticsDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <footer className="bg-white border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Kingzy Pharmaceuticals Limited. Licensed Pharmaceutical Distributor.</p>
        </div>
      </footer>
      <AIChatBot />
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </HashRouter>
  );
}
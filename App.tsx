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
  ShieldCheck,
  Plus,
  Lock,
  Download,
  Mail
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

import { MOCK_PRODUCTS, SALES_DATA, COMPANY_LOGO } from './constants';
import { Product, User, UserRole, CartItem, Order, OrderStatus, PaymentMethod } from './types';
import { getGeminiResponse } from './services/geminiService';
import { BackendService } from './services/backend';

// --- TOAST NOTIFICATION SYSTEM ---
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

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
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within a AppProvider");
  return context;
};

// --- COMPONENTS ---

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) => {
  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`min-w-[300px] p-4 rounded-lg shadow-lg text-white flex items-center justify-between animate-fade-in-down ${
          t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <div className="flex items-center">
            {t.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
            {t.type === 'info' && <MessageCircle className="h-5 w-5 mr-2" />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
          <button onClick={() => removeToast(t.id)}><X className="h-4 w-4 opacity-80 hover:opacity-100" /></button>
        </div>
      ))}
    </div>
  );
};

// --- AUTH PAGES ---
const Login = () => {
    const { setCurrentUser, showToast } = useAppContext();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const user = await BackendService.login(email);
            setCurrentUser(user);
            showToast(`Welcome back, ${user.name}`, 'success');
            navigate(user.role === UserRole.PUBLIC ? '/' : user.role === UserRole.ADMIN ? '/admin' : '/dashboard');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                     <div className="bg-white p-2 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 border border-medical-100 shadow-sm">
                         <img src={COMPANY_LOGO} alt="Kingzy" className="h-10 w-10 object-contain" />
                     </div>
                     <h2 className="text-2xl font-bold text-gray-900">Kingzy Pharmaceuticals</h2>
                     <p className="text-gray-500 text-sm">Sign in to your account</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input 
                                type="email" 
                                required
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                             <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                             <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-medical-500 outline-none" disabled />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">Demo: Any password works</p>
                    </div>
                    <button disabled={isLoading} className="w-full bg-medical-600 text-white py-3 rounded-lg font-bold hover:bg-medical-700 transition flex justify-center items-center">
                        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Sign In"}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account? <Link to="/register" className="text-medical-600 font-bold hover:underline">Register here</Link>
                </div>
                <div className="mt-8 border-t pt-6">
                     <p className="text-xs text-gray-400 text-center mb-2">Quick Login (Demo)</p>
                     <div className="flex flex-wrap justify-center gap-2">
                        <button onClick={() => setEmail('john@public.com')} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Public</button>
                        <button onClick={() => setEmail('purchasing@medicorp.com')} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">Wholesale</button>
                        <button onClick={() => setEmail('admin@kingzypharma.com')} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200">Admin</button>
                        <button onClick={() => setEmail('delivery@kingzypharma.com')} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200">Logistics</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

const Register = () => {
    const { setCurrentUser, showToast } = useAppContext();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: UserRole.PUBLIC });
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const user = await BackendService.register(formData.name, formData.email, formData.role, formData.phone);
            if (!user.isActive) {
                showToast("Registration successful! Account pending Admin verification.", 'info');
                navigate('/login');
            } else {
                setCurrentUser(user);
                showToast("Registration successful!", 'success');
                navigate('/');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                 <div className="text-center mb-8">
                     <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                     <p className="text-gray-500 text-sm">Join Kingzy Pharmaceuticals</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <select 
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-medical-500"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                        >
                            <option value={UserRole.PUBLIC}>General Public (Retail)</option>
                            <option value={UserRole.WHOLESALE}>Wholesale Buyer (Business)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / Business Name</label>
                        <input 
                            required
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-medical-500"
                            placeholder="e.g. John Doe or MediCorp"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            required type="email"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-medical-500"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input 
                            required type="tel"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-medical-500"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <button disabled={isLoading} className="w-full bg-medical-600 text-white py-3 rounded-lg font-bold hover:bg-medical-700 transition mt-4">
                        {isLoading ? "Creating Account..." : "Register"}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-medical-600 font-bold hover:underline">Login here</Link>
                </div>
            </div>
        </div>
    );
};

// ... [Navbar, AIChatBot, PrescriptionModal, Home, ProductList unchanged, handled via file replacement logic if needed, but including Navbar for Auth links]

const Navbar = () => {
  const { currentUser, cart, setCurrentUser } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
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
    <nav className="bg-gradient-to-r from-medical-700 to-medical-900 text-white shadow-xl sticky top-0 z-50 border-b border-medical-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-white p-1 rounded-full mr-3 shadow-lg h-12 w-12 flex items-center justify-center overflow-hidden border-2 border-medical-100">
              <img src={COMPANY_LOGO} alt="Kingzy" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
               <span className="font-bold text-xl tracking-tight leading-none">Kingzy</span>
               <span className="text-xs text-medical-200 tracking-wider">PHARMACEUTICALS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-medical-100 transition-colors">Home</Link>
            <Link to="/products" className="text-sm font-medium hover:text-medical-100 transition-colors">Products</Link>
            
            {currentUser && (
               <Link to={getDashboardLink()} className="text-sm font-medium hover:text-medical-100 transition-colors">Dashboard</Link>
            )}

            <div className="relative group">
              <Link to="/cart" className="hover:text-medical-100 transition flex items-center bg-medical-800 bg-opacity-30 p-2 rounded-full hover:bg-opacity-50">
                <ShoppingBag className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-4 border-l border-medical-600 pl-6">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold">{currentUser.name}</span>
                  <span className="text-xs text-medical-300 capitalize">{currentUser.role === UserRole.WHOLESALE ? 'Wholesale Partner' : currentUser.role.toLowerCase()}</span>
                </div>
                <button onClick={handleLogout} className="hover:text-red-300 transition-colors bg-medical-800 p-2 rounded-lg hover:bg-medical-700">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                 <Link to="/login" className="text-sm font-bold hover:text-medical-200">Login</Link>
                 <Link to="/register" className="bg-white text-medical-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-medical-50 transition">Register</Link>
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
        <div className="md:hidden bg-medical-800 px-4 pt-2 pb-4 space-y-2 border-t border-medical-700">
           <Link to="/" className="block py-2 hover:bg-medical-700 rounded px-2">Home</Link>
           <Link to="/products" className="block py-2 hover:bg-medical-700 rounded px-2">Products</Link>
           <Link to="/cart" className="block py-2 hover:bg-medical-700 rounded px-2">Cart ({cart.length})</Link>
           {currentUser ? (
               <Link to={getDashboardLink()} className="block py-2 hover:bg-medical-700 rounded px-2">Dashboard</Link>
           ) : (
               <>
                <Link to="/login" className="block py-2 hover:bg-medical-700 rounded px-2">Login</Link>
                <Link to="/register" className="block py-2 hover:bg-medical-700 rounded px-2">Register</Link>
               </>
           )}
        </div>
      )}
    </nav>
  );
};

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
            className="bg-medical-600 hover:bg-medical-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-4 border-white"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        )}
        
        {isOpen && (
          <div className="bg-white rounded-xl shadow-2xl w-80 md:w-96 flex flex-col h-[500px] border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-medical-600 to-medical-700 text-white p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white p-1 rounded-full mr-2 h-8 w-8 flex items-center justify-center">
                   <img src={COMPANY_LOGO} alt="Bot" className="h-6 w-6 object-contain" />
                </div>
                <span className="font-semibold text-sm">PharmaBot Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-medical-500 rounded p-1"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                   <div className="bg-medical-100 p-3 rounded-full mb-3">
                     <Stethoscope className="h-6 w-6 text-medical-600" />
                   </div>
                   <p className="text-gray-600 text-sm font-medium">How can I help you today?</p>
                   <p className="text-gray-400 text-xs mt-1">Ask about medicines, stock, or health tips.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-medical-600 text-white rounded-br-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                   <div className="bg-white border p-3 rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                   </div>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t bg-white">
              <div className="flex space-x-2">
                <input 
                  className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-medical-600 text-white p-2 rounded-full hover:bg-medical-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
const PrescriptionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    // ... [Prescription Modal code - same as before]
    const [dragActive, setDragActive] = useState(false);
    const { showToast } = useAppContext();
  
    if (!isOpen) return null;
  
    const handleUpload = () => {
      setTimeout(() => {
          showToast("Prescription uploaded securely. A pharmacist will review it shortly.", "success");
          onClose();
      }, 1500);
    };
  
    return (
      <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
          <div className="bg-medical-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center"><FileText className="mr-2" /> Upload Prescription</h3>
              <button onClick={onClose}><X /></button>
          </div>
          <div className="p-8">
              <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? 'border-medical-500 bg-medical-50' : 'border-gray-300'}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
              >
                  <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Upload className="h-8 w-8 text-medical-600" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">SVG, PNG, JPG or PDF (max. 5MB)</p>
              </div>
              
              <div className="mt-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                     <textarea className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-medical-500 outline-none" rows={3} placeholder="E.g. I need the generic version..."></textarea>
                  </div>
                  <button onClick={handleUpload} className="w-full bg-medical-600 text-white py-3 rounded-lg font-bold hover:bg-medical-700 transition transform hover:scale-[1.01] shadow-lg">
                      Submit Prescription
                  </button>
              </div>
          </div>
        </div>
      </div>
    );
};

const Home = () => {
    const { products } = useAppContext();
    const featured = products.slice(0, 3);
    const navigate = useNavigate();
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  
    return (
      <div className="space-y-12 pb-10">
        <PrescriptionModal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)} />
        
        {/* Hero */}
        <section className="relative bg-gradient-to-b from-medical-50 to-white py-24 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 bg-medical-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-block bg-white px-4 py-1.5 rounded-full border border-medical-100 shadow-sm mb-6 animate-fade-in-up">
              <span className="text-medical-600 font-semibold text-xs tracking-wide uppercase flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" /> Licensed Pharmaceutical Distributor
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Reliable Healthcare, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-600 to-blue-600">Delivered to You</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Trusted by hospitals, wholesale partners, and families nationwide. We source 100% authentic pharmaceuticals directly from manufacturers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <button 
                onClick={() => navigate('/products')}
                className="bg-medical-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-medical-700 transition shadow-lg hover:shadow-medical-500/30 flex items-center justify-center"
              >
                <Pill className="mr-2 h-5 w-5" /> Browse Medicines
              </button>
              <button 
                onClick={() => setShowPrescriptionModal(true)}
                className="bg-white text-medical-700 border-2 border-medical-100 px-8 py-4 rounded-xl font-bold hover:bg-medical-50 transition shadow-sm hover:shadow-md flex items-center justify-center"
              >
                <FileText className="mr-2 h-5 w-5" /> Upload Prescription
              </button>
            </div>
          </div>
        </section>
  
        {/* Featured */}
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Products</h2>
                  <p className="text-gray-500">Top selling medical supplies this week</p>
              </div>
              <Link to="/products" className="text-medical-600 font-semibold hover:underline">View all</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="h-56 bg-gray-100 relative overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  {p.requiresPrescription && (
                    <span className="absolute top-3 right-3 bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                      Rx Only
                    </span>
                  )}
                  {p.stock < 150 && (
                     <span className="absolute bottom-3 left-3 bg-orange-50 text-orange-700 border border-orange-100 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="text-xs text-medical-600 font-bold uppercase tracking-wider mb-2">{p.category}</div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-medical-700 transition-colors">{p.name}</h3>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                    <span className="text-2xl font-bold text-gray-900">₦{p.price.toLocaleString()}</span>
                    <Link to={`/products`} className="bg-gray-50 hover:bg-medical-50 text-gray-900 hover:text-medical-700 p-2 rounded-full transition">
                      <ShoppingBag className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Features */}
        <section className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Truck className="h-8 w-8 text-medical-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast Logistics</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Same-day dispatch for wholesale partners and tracked delivery for all orders.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
               <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ShieldCheck className="h-8 w-8 text-medical-600" />
               </div>
              <h3 className="font-bold text-lg mb-2">Authenticity Guaranteed</h3>
              <p className="text-gray-500 text-sm leading-relaxed">We source directly from manufacturers to ensure 100% genuine products.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
               <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Stethoscope className="h-8 w-8 text-medical-600" />
               </div>
              <h3 className="font-bold text-lg mb-2">Pharmacist Support</h3>
              <p className="text-gray-500 text-sm leading-relaxed">24/7 access to qualified pharmaceutical advice for all our customers.</p>
            </div>
          </div>
        </section>
      </div>
    );
};

const ProductList = () => {
    const { products, addToCart, currentUser, showToast } = useAppContext();
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
  
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  
    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  
    const getPrice = (p: Product) => {
      if (currentUser?.role === UserRole.WHOLESALE) return p.wholesalePrice;
      return p.price;
    };
  
    const handleAddToCart = (p: Product) => {
      addToCart(p, 1);
      showToast(`Added ${p.name} to cart`, 'success');
    };
  
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
             <h2 className="text-3xl font-bold text-gray-900">Product Catalog</h2>
             <p className="text-gray-500 text-sm mt-1">Browsing {filtered.length} products</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               <div className="relative">
                  <select 
                      className="appearance-none bg-white border rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-medical-500 outline-none cursor-pointer"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
               </div>
  
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input 
                      type="text" 
                      placeholder="Search medicines..." 
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                  />
              </div>
          </div>
        </div>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="h-48 bg-gray-100 relative group">
                 <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                 {currentUser?.role === UserRole.WHOLESALE && (
                   <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                     Wholesale
                   </span>
                 )}
              </div>
              <div className="p-5">
                <div className="text-xs text-medical-600 font-semibold mb-1 uppercase">{p.category}</div>
                <h3 className="font-bold text-gray-900 mb-1 truncate">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{p.packSize}</p>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">₦{getPrice(p).toLocaleString()}</div>
                    {currentUser?.role === UserRole.WHOLESALE && (
                      <div className="text-xs text-gray-400 line-through">₦{p.price.toLocaleString()}</div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAddToCart(p)}
                    className="bg-medical-50 text-medical-700 hover:bg-medical-600 hover:text-white p-2.5 rounded-full transition-all duration-300"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filtered.length === 0 && (
            <div className="text-center py-20">
                <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
        )}
      </div>
    );
};

const Cart = () => {
  const { cart, removeFromCart, currentUser, clearCart, refreshData, showToast } = useAppContext();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ONLINE_CARD);
  const [address, setAddress] = useState('');

  const total = cart.reduce((acc, item) => {
    const price = currentUser?.role === UserRole.WHOLESALE ? item.wholesalePrice : item.price;
    return acc + (price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (!currentUser) {
      showToast("Please login to proceed with checkout", "error");
      return;
    }
    if (!address) {
      showToast("Please enter a shipping address", "error");
      return;
    }
    
    // Client-side MOQ validation for quick feedback
    if (currentUser.role === UserRole.WHOLESALE) {
        for (const item of cart) {
            if (item.quantity < item.minOrderQuantity) {
                showToast(`Minimum order for ${item.name} is ${item.minOrderQuantity} units.`, 'error');
                return;
            }
        }
    }

    try {
        await BackendService.createOrder(currentUser, cart, total, address, paymentMethod);
        clearCart();
        refreshData();
        showToast("Order placed successfully!", "success");
        navigate('/dashboard');
    } catch (e: any) {
        showToast(e.message, "error");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-medical-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-medical-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any medicines to your cart yet.</p>
        <Link to="/products" className="bg-medical-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-medical-700 transition">Start Shopping</Link>
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
             const isMoqError = currentUser?.role === UserRole.WHOLESALE && item.quantity < item.minOrderQuantity;
             
             return (
              <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between ${isMoqError ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{item.packSize}</p>
                    <div className="flex items-center space-x-2">
                        {item.requiresPrescription && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">Rx Required</span>}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                    </div>
                    {isMoqError && <div className="text-xs text-red-600 font-bold mt-1">Min Order: {item.minOrderQuantity}</div>}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="font-bold text-lg">₦{(price * item.quantity).toLocaleString()}</div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 text-sm flex items-center transition-colors">
                    <X className="h-4 w-4 mr-1" /> Remove
                  </button>
                </div>
              </div>
             );
          })}
        </div>

        {/* Checkout Form */}
        <div className="lg:w-96">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-lg mb-6 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-medical-600" /> Checkout Details
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address</label>
              <textarea 
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-medical-500 outline-none" 
                rows={3} 
                placeholder="Enter full delivery address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="space-y-3">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer flex items-center transition-all ${paymentMethod === PaymentMethod.ONLINE_CARD ? 'border-medical-500 bg-medical-50 ring-1 ring-medical-500' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMethod(PaymentMethod.ONLINE_CARD)}
                >
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === PaymentMethod.ONLINE_CARD ? 'border-medical-600' : 'border-gray-300'}`}>
                      {paymentMethod === PaymentMethod.ONLINE_CARD && <div className="h-2 w-2 rounded-full bg-medical-600"></div>}
                  </div>
                  <div>
                    <span className="text-sm font-medium block">Pay with Card</span>
                    <span className="text-xs text-gray-500">Instant confirmation via Gateway</span>
                  </div>
                </div>
                <div 
                  className={`border rounded-lg p-3 cursor-pointer flex items-center transition-all ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'border-medical-500 bg-medical-50 ring-1 ring-medical-500' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                >
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'border-medical-600' : 'border-gray-300'}`}>
                      {paymentMethod === PaymentMethod.BANK_TRANSFER && <div className="h-2 w-2 rounded-full bg-medical-600"></div>}
                  </div>
                   <div>
                    <span className="text-sm font-medium block">Bank Transfer</span>
                    <span className="text-xs text-gray-500">Manual verification required</span>
                  </div>
                </div>
                <div 
                  className={`border rounded-lg p-3 cursor-pointer flex items-center transition-all ${paymentMethod === PaymentMethod.PAY_ON_DELIVERY ? 'border-medical-500 bg-medical-50 ring-1 ring-medical-500' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMethod(PaymentMethod.PAY_ON_DELIVERY)}
                >
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === PaymentMethod.PAY_ON_DELIVERY ? 'border-medical-600' : 'border-gray-300'}`}>
                      {paymentMethod === PaymentMethod.PAY_ON_DELIVERY && <div className="h-2 w-2 rounded-full bg-medical-600"></div>}
                  </div>
                   <div>
                    <span className="text-sm font-medium block">Pay on Delivery</span>
                    <span className="text-xs text-gray-500">Cash or POS on arrival</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Calculated next step</span>
              </div>
              {currentUser?.role === UserRole.WHOLESALE && (
                <div className="flex justify-between text-blue-600 font-medium bg-blue-50 p-2 rounded">
                  <span>Wholesale Discount</span>
                  <span>Applied</span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-medical-600 text-white py-4 rounded-xl font-bold hover:bg-medical-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Place Order
            </button>
            <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center">
               <ShieldCheck className="h-3 w-3 mr-1" /> Secure Encrypted Transaction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser, orders, refreshData, showToast } = useAppContext();
  
  if (!currentUser) return <Navigate to="/login" />;

  const myOrders = orders.filter(o => o.userId === currentUser.id);

  const handleUploadProof = async (orderId: string) => {
    // Simulate file upload
    const mockUrl = "https://mock.storage.com/proof-" + Math.random().toString(36).substring(7) + ".jpg";
    await BackendService.uploadPaymentProof(orderId, currentUser, mockUrl);
    showToast("Proof uploaded successfully! Admin will verify shortly.", "success");
    refreshData();
  };
  
  const downloadDocument = (type: 'Invoice' | 'Receipt') => {
      showToast(`Downloading ${type}...`, 'info');
      // In a real app, this would trigger a PDF download
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {currentUser.name}</h1>
          <p className="text-gray-500">Manage your orders and account settings.</p>
        </div>
        {currentUser.role === UserRole.WHOLESALE && (
          <div className="mt-4 md:mt-0 bg-blue-50 text-blue-700 px-6 py-3 rounded-xl border border-blue-100 shadow-sm flex items-center">
             <div className="mr-3 bg-blue-100 p-2 rounded-full"><CheckCircle className="h-5 w-5" /></div>
             <div>
                <span className="text-xs font-semibold uppercase tracking-wider block">Loyalty Points</span>
                <span className="text-2xl font-bold">{currentUser.loyaltyPoints}</span>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            <Package className="h-5 w-5 mr-2 text-medical-600" />
            Order History
          </h2>
          
          <div className="space-y-4">
            {myOrders.length === 0 ? (
               <div className="text-gray-500 bg-white p-12 rounded-xl text-center border border-dashed border-gray-300">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  No orders found. Start shopping!
               </div>
            ) : (
              myOrders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center">
                        {order.id}
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-sm font-normal text-gray-500">{order.date}</span>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        order.status === OrderStatus.DELIVERED ? 'bg-green-50 text-green-700 border-green-100' :
                        order.status === OrderStatus.PAYMENT_PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        order.status === OrderStatus.PAYMENT_REVIEW ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 my-4 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{MOCK_PRODUCTS.find(p=>p.id === item.productId)?.name || 'Item'} <span className="text-gray-400">x{item.quantity}</span></span>
                        <span className="text-gray-900">₦{(item.priceAtPurchase * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <div className="font-bold text-lg text-gray-900">Total: ₦{order.totalAmount.toLocaleString()}</div>
                    
                    <div className="flex space-x-3">
                       {/* Action Buttons based on state */}
                       {order.status === OrderStatus.PAYMENT_PENDING && order.paymentMethod === PaymentMethod.BANK_TRANSFER && (
                          <button 
                            onClick={() => handleUploadProof(order.id)}
                            className="bg-medical-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-medical-700 flex items-center shadow-sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Payment Proof
                          </button>
                       )}
                       
                       <button onClick={() => downloadDocument('Invoice')} className="text-gray-700 hover:text-medical-600 text-sm font-medium flex items-center border border-gray-300 hover:border-medical-500 px-4 py-2 rounded-lg transition-colors">
                           <FileText className="h-4 w-4 mr-2" />
                           Invoice
                       </button>

                       {order.status === OrderStatus.PAYMENT_CONFIRMED || order.status === OrderStatus.DELIVERED ? (
                           <button onClick={() => downloadDocument('Receipt')} className="text-green-700 hover:text-green-800 text-sm font-medium flex items-center border border-green-300 hover:border-green-500 px-4 py-2 rounded-lg transition-colors bg-green-50">
                               <Download className="h-4 w-4 mr-2" />
                               Receipt
                           </button>
                       ) : null}
                    </div>
                  </div>
                  {order.paymentMethod === PaymentMethod.BANK_TRANSFER && order.status === OrderStatus.PAYMENT_PENDING && (
                    <div className="mt-4 text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Action Required:</strong> Please transfer ₦{order.totalAmount.toLocaleString()} to Kingzy Bank: 123-456-7890 and upload the receipt above.
                      </div>
                    </div>
                  )}
                  {order.paymentMethod === PaymentMethod.PAY_ON_DELIVERY && order.status === OrderStatus.PAYMENT_PENDING && (
                    <div className="mt-4 text-xs text-yellow-800 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Pending Approval:</strong> Your Pay on Delivery order is awaiting Admin confirmation before dispatch.
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4 text-gray-800">My Account</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><UserIcon className="h-4 w-4 mr-3 text-gray-400" /> Profile Settings</li>
              <li className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><CreditCard className="h-4 w-4 mr-3 text-gray-400" /> Payment Methods</li>
              <li className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"><AlertCircle className="h-4 w-4 mr-3 text-gray-400" /> Help Center</li>
            </ul>
          </div>
          
           <div className="bg-gradient-to-br from-medical-600 to-medical-800 p-6 rounded-xl shadow-lg text-white">
               <h3 className="font-bold mb-2">Need a Pharmacist?</h3>
               <p className="text-sm text-medical-100 mb-4">Our professionals are available 24/7 to answer your questions.</p>
               <button className="w-full bg-white text-medical-700 font-bold py-2 rounded-lg text-sm hover:bg-medical-50 transition">
                   Start Chat
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// ... (AdminDashboard and LogisticsDashboard)
const AdminDashboard = () => {
  const { orders, currentUser, refreshData, showToast } = useAppContext();
  
  if (!currentUser) return null;

  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    await BackendService.verifyPayment(orderId, currentUser, approve);
    showToast(`Payment ${approve ? 'approved' : 'rejected'}`, approve ? 'success' : 'info');
    refreshData();
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await BackendService.approveOrder(orderId, currentUser);
      showToast("Order approved & Inventory synced", "success");
      refreshData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const pendingPayments = orders.filter(o => o.status === OrderStatus.PAYMENT_REVIEW);
  // Admin approval needed for: confirmed payments OR pay on delivery pending
  const readyForApproval = orders.filter(o => 
      o.status === OrderStatus.PAYMENT_CONFIRMED || 
      (o.status === OrderStatus.PAYMENT_PENDING && o.paymentMethod === PaymentMethod.PAY_ON_DELIVERY)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-gray-500 text-xs uppercase font-bold mb-2">Total Revenue</div>
           <div className="text-2xl font-bold text-gray-900">₦24,500,000.00</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-gray-500 text-xs uppercase font-bold mb-2">Pending Payments</div>
           <div className="text-2xl font-bold text-orange-500">{pendingPayments.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-gray-500 text-xs uppercase font-bold mb-2">Ready to Approve</div>
           <div className="text-2xl font-bold text-blue-600">{readyForApproval.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Payment Verification */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-medical-600" />
            Payment Verification
          </h3>
          {pendingPayments.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No pending payments to review.</p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map(order => (
                <div key={order.id} className="border border-orange-200 p-4 rounded-lg bg-orange-50">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-900">{order.id}</span>
                    <span className="text-sm font-semibold bg-white px-2 py-1 rounded border border-orange-200">₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">User: <span className="font-medium">{order.userName}</span></div>
                  <div className="flex space-x-2 items-center">
                    <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-semibold hover:underline flex items-center mr-auto">
                      <FileText className="h-3 w-3 mr-1" /> View Proof
                    </a>
                    <button onClick={() => handleVerifyPayment(order.id, true)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors">Accept</button>
                    <button onClick={() => handleVerifyPayment(order.id, false)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Approval (Sync Inventory) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
           <h3 className="font-bold text-lg mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-medical-600" />
            Approve Orders & Sync Inventory
          </h3>
          {readyForApproval.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No orders waiting for approval.</p>
          ) : (
             <div className="space-y-4">
              {readyForApproval.map(order => (
                <div key={order.id} className="border border-blue-200 p-4 rounded-lg bg-blue-50">
                   <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-900">{order.id}</span>
                    <span className="text-sm font-semibold bg-white px-2 py-1 rounded border border-blue-200">₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                   <div className="text-xs text-blue-800 mb-3 flex items-center">
                       {order.paymentMethod === PaymentMethod.PAY_ON_DELIVERY ? 
                           <span className="flex items-center text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pay on Delivery (Confirm before dispatch)</span> : 
                           <span className="flex items-center text-green-600"><Check className="h-3 w-3 mr-1" /> Payment Confirmed</span>
                       }
                   </div>
                   <button onClick={() => handleApproveOrder(order.id)} className="w-full bg-medical-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-medical-700 transition-colors shadow-sm">
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
    const { orders, currentUser, refreshData, showToast } = useAppContext();
    
    if (!currentUser) return null;
  
    // Logistics flow: Approved -> Packed -> Dispatched -> Delivered
    const activeOrders = orders.filter(o => 
      [OrderStatus.ORDER_APPROVED, OrderStatus.PACKED, OrderStatus.DISPATCHED].includes(o.status)
    );
  
    const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
      await BackendService.updateLogisticsStatus(orderId, status, currentUser);
      showToast(`Order status updated to ${status}`, "info");
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
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
              <div className="mb-4 md:mb-0">
                 <div className="flex items-center space-x-3 mb-2">
                   <span className="font-bold text-lg text-gray-900">{order.id}</span>
                   <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{order.date}</span>
                 </div>
                 <div className="text-gray-600 text-sm mb-3 flex items-start">
                    <Truck className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    <span>{order.shippingAddress}</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {order.items.map((item, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
                        {MOCK_PRODUCTS.find(p=>p.id===item.productId)?.name} <span className="text-blue-400">x{item.quantity}</span>
                      </span>
                   ))}
                 </div>
                 {order.paymentMethod === PaymentMethod.PAY_ON_DELIVERY && (
                     <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded w-fit font-bold">Collect Payment on Delivery</div>
                 )}
              </div>
  
              <div className="flex items-center space-x-4">
                 <div className="text-right mr-4 border-r pr-6 border-gray-100">
                   <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Current Status</div>
                   <div className="font-bold text-medical-700 text-lg">{order.status}</div>
                 </div>
                 
                 {order.status === OrderStatus.ORDER_APPROVED && (
                   <button 
                    onClick={() => handleUpdateStatus(order.id, OrderStatus.PACKED)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition shadow-sm"
                   >
                     Mark Packed
                   </button>
                 )}
                 {order.status === OrderStatus.PACKED && (
                   <button 
                    onClick={() => handleUpdateStatus(order.id, OrderStatus.DISPATCHED)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition shadow-sm"
                   >
                     Dispatch
                   </button>
                 )}
                 {order.status === OrderStatus.DISPATCHED && (
                   <button 
                    onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition shadow-sm"
                   >
                     Confirm Delivery
                   </button>
                 )}
              </div>
            </div>
          ))}
  
          {activeOrders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <CheckCircle className="h-16 w-16 text-green-100 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-gray-500">No active logistics tasks pending.</p>
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
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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
    refreshData,
    showToast
  };

  return (
    <AppContext.Provider value={value}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        {children}
    </AppContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactElement, allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
};

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
      <footer className="bg-white border-t mt-12 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center mb-4">
               <div className="bg-gray-100 p-1 rounded-full mr-2">
                 <img src={COMPANY_LOGO} alt="Kingzy" className="h-6 w-6 object-contain grayscale opacity-50" />
               </div>
               <span className="font-bold text-gray-400 text-lg">Kingzy Pharmaceuticals</span>
            </div>
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Kingzy Pharmaceuticals Limited. Licensed Pharmaceutical Distributor.</p>
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
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ArrowRight, 
  Menu, 
  X, 
  Plus, 
  ChevronRight, 
  MessageSquare, 
  Send,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Wallet,
  Package,
  User,
  LayoutDashboard,
  LogOut,
  MapPin,
  Truck,
  CreditCard,
  PlusCircle,
  TrendingUp,
  Box
} from 'lucide-react';
import { cn } from './lib/utils';
import { NIGERIA_STATES } from './constants/nigeria-data';

// --- Types ---
interface UserData {
  id: string;
  email: string;
  name: string;
  walletBalance: number;
  role: 'admin' | 'user';
}

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  features: string[];
  status: string;
  inventory: number;
  category?: string;
}

interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  address: {
    state: string;
    lga: string;
    street: string;
  };
  status: string;
  tracking: string;
  createdAt: string;
}

type View = 'landing' | 'auth' | 'dashboard' | 'admin' | 'track' | 'wallet';

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=2000",
    title: "Minimalist Essentials",
    subtitle: "Archive 2025 Drop",
    description: "Crafted for the conscious professional. Limited run available for preorder."
  },
  {
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=2000",
    title: "Sonic Precision",
    subtitle: "Engineering Sound",
    description: "The Nova series returns with refined acoustics and titanium hardware."
  },
  {
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=2000",
    title: "Deliberate Focus",
    subtitle: "Aura One Revive",
    description: "Reclaiming the art of writing in an age of digital noise."
  }
];

export default function App() {
  // State
  const [activeView, setActiveView] = useState<View>('landing');
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });

  // Address State
  const [orderAddress, setOrderAddress] = useState({ state: '', lga: '', street: '' });

  // Wallet State
  const [fundAmount, setFundAmount] = useState(0);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-carousel
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeView === 'landing') {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [activeView]);

  // Initialization
  useEffect(() => {
    fetchProducts();
    if (token) {
      loadProfileAndData();
    }
  }, [token]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // --- API Functions ---
  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const loadProfileAndData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchOrders();
      } else {
        // Silent clear if session is invalid
        handleLogout();
      }
    } catch (e) {
      // Background failure, just clear
      handleLogout();
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      fetchAdminStats();
    }
  }, [user, token]);

  const fetchOrders = async () => {
    if (!token) return;
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setOrders(data);
  };

  const fetchAdminStats = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setAdminStats(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setActiveView('dashboard');
      }
    } catch (error: any) {
      alert(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundWallet = async () => {
    if (fundAmount <= 0) return;
    try {
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: fundAmount })
      });
      const data = await res.json();
      if (user) setUser({ ...user, walletBalance: data.balance });
      setFundAmount(0);
      alert("Wallet funded!");
    } catch (e) {
      alert("Failed to fund wallet");
    }
  };

  const handlePreorder = async () => {
    if (!selectedProduct) return;
    if (!orderAddress.state || !orderAddress.lga || !orderAddress.street) {
      alert("Please provide full delivery address in Nigeria.");
      return;
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId: selectedProduct.id, 
          address: orderAddress 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      alert(`Preorder successful! Order ID: ${data.id}`);
      setSelectedProduct(null);
      fetchOrders();
      // Update local wallet balance if we have user state
      if (user) setUser({ ...user, walletBalance: user.walletBalance - selectedProduct.price });
    } catch (e: any) {
      alert(e.message || "Preorder failed. Check your wallet balance.");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setActiveView('landing');
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({  message: userMsg, productContext: products })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Service unavailable." }]);
    }
  };

  // --- Components ---

  const Navbar = () => (
    <nav className="fixed top-0 w-full z-50 bg-aura-black/80 backdrop-blur-xl px-8 py-6 flex justify-between items-center h-20 border-white/5 border-b">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('landing')}>
        <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center p-1">
           <div className="w-full h-full bg-white rounded-full" />
        </div>
        <span className="font-display font-medium text-lg uppercase tracking-widest text-white">AURA</span>
      </div>
      
      <div className="hidden md:flex gap-10 items-center text-[10px] font-bold uppercase tracking-[0.3em] text-white">
        <button onClick={() => setActiveView('landing')} className="hover:text-aura-gold transition-colors">Curations</button>
        <button onClick={() => setActiveView('track')} className="hover:text-aura-gold transition-colors">Track Order</button>
        <button onClick={() => {
          const supportSection = document.getElementById('support-center');
          if (supportSection) supportSection.scrollIntoView({ behavior: 'smooth' });
          else setActiveView('landing'); 
        }} className="hover:text-aura-gold transition-colors">Concierge</button>
        
        <div className="h-4 w-px bg-white/10 mx-2" />

        {user ? (
          <>
            <button onClick={() => setActiveView('dashboard')} className="hover:text-aura-gold transition-colors text-aura-gold/80">My Aura</button>
            <button onClick={() => setActiveView('wallet')} className="hover:text-aura-gold transition-colors flex items-center gap-2">
              <Wallet size={12} className="text-aura-gold" /> ${user.walletBalance}
            </button>
            {user.role === 'admin' && (
              <button onClick={() => setActiveView('admin')} className="text-aura-gold hover:text-white transition-colors border border-aura-gold/30 px-3 py-1 rounded-full bg-aura-gold/5">Control</button>
            )}
            <button onClick={handleLogout} className="hover:text-white transition-colors flex items-center gap-2 text-white/40"><LogOut size={14} /> Exit</button>
          </>
        ) : (
          <button onClick={() => setActiveView('auth')} className="bg-white text-aura-black px-6 py-2 rounded-full hover:bg-aura-silver transition-all shadow-lg">Sign In</button>
        )}
      </div>

      <button className="md:hidden text-white p-2 hover:bg-white/5 rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 top-20 bg-aura-black z-40 p-8 flex flex-col gap-6 md:hidden overflow-y-auto"
          >
            <button onClick={() => { setActiveView('landing'); setIsMenuOpen(false); }} className="text-2xl font-display font-bold uppercase text-left border-b border-white/5 pb-4">Curations</button>
            <button onClick={() => { setActiveView('track'); setIsMenuOpen(false); }} className="text-2xl font-display font-bold uppercase text-left border-b border-white/5 pb-4">Track Order</button>
            <button onClick={() => { 
                setActiveView('landing'); 
                setIsMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('support-center')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }} className="text-2xl font-display font-bold uppercase text-left border-b border-white/5 pb-4">Concierge</button>
            
            {user ? (
              <>
                <button onClick={() => { setActiveView('dashboard'); setIsMenuOpen(false); }} className="text-2xl font-display font-bold uppercase text-left border-b border-white/5 pb-4 text-aura-gold">My Aura</button>
                <button onClick={() => { setActiveView('wallet'); setIsMenuOpen(false); }} className="text-2xl font-display font-bold uppercase text-left border-b border-white/5 pb-4 flex justify-between items-center px-2 py-2 bg-white/5 rounded-xl">
                  Wallet <span className="text-aura-gold">${user.walletBalance}</span>
                </button>
                {user.role === 'admin' && (
                  <button onClick={() => { setActiveView('admin'); setIsMenuOpen(false); }} className="text-2xl font-display font-bold uppercase text-left border-b border-white/5 pb-4 text-aura-gold">Admin Panel</button>
                )}
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-2xl font-display font-bold uppercase text-left text-white/40 mt-auto">Logout</button>
              </>
            ) : (
              <button onClick={() => { setActiveView('auth'); setIsMenuOpen(false); }} className="w-full py-4 bg-white text-aura-black rounded-2xl font-bold uppercase text-sm tracking-widest mt-auto">Sign In</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );

  return (
    <div className="min-h-screen font-sans bg-aura-black text-white selection:bg-white selection:text-aura-black">
      <Navbar />

      <main className="pt-20">
        <AnimatePresence mode="wait">
          {activeView === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Hero Carousel */}
              <section className="relative h-[90vh] w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-aura-black via-aura-black/20 to-transparent z-10" />
                    <img 
                      src={HERO_SLIDES[currentSlide].image} 
                      className="w-full h-full object-cover" 
                      alt="Hero" 
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-8">
                  <motion.div 
                    key={`text-${currentSlide}`}
                    initial={{ y: 30, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-[0.5em] text-aura-gold mb-4 block">
                      {HERO_SLIDES[currentSlide].subtitle}
                    </span>
                    <h1 className="text-6xl md:text-[8vw] font-display font-bold uppercase leading-none tracking-tighter mb-8 text-gradient">
                      {HERO_SLIDES[currentSlide].title.split(' ')[0]} <br/> 
                      {HERO_SLIDES[currentSlide].title.split(' ').slice(1).join(' ')}
                    </h1>
                    <p className="max-w-md mx-auto text-white/60 text-lg font-light mb-12">
                      {HERO_SLIDES[currentSlide].description}
                    </p>
                    <a href="#shop" className="px-12 py-5 bg-white text-aura-black rounded-full font-bold uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-transform inline-flex items-center gap-4">
                      Explore Collection <ArrowRight size={14}/>
                    </a>
                  </motion.div>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
                  {HERO_SLIDES.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        "h-1 transition-all duration-500 rounded-full",
                        currentSlide === i ? "w-12 bg-white" : "w-6 bg-white/20"
                      )}
                    />
                  ))}
                </div>
              </section>

              {/* Collections Grid */}
              <section id="shop" className="py-32 px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-aura-gold">Seasonal Drops</span>
                    <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight italic">Curations</h2>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold border border-white/10 px-4 py-2 rounded-full">Secure Global Shipping</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-12 lg:gap-20 max-w-6xl mx-auto">
                  {products.map((p, idx) => (
                    <motion.div 
                      key={p.id} 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: (idx % 2) * 0.1 + Math.floor(idx / 2) * 0.05 }}
                      className="group flex flex-col"
                    >
                      <div className="relative aspect-[4/5] rounded-2xl md:rounded-[40px] overflow-hidden mb-4 md:mb-8 bg-aura-gray/50 border border-white/5 shadow-2xl">
                        <img 
                          src={p.image} 
                          className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-1000 ease-in-out" 
                          alt={p.name} 
                        />
                        <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
                           <span className="px-4 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/80">
                             {p.status}
                           </span>
                           {p.category && (
                             <span className="px-4 py-1.5 bg-aura-gold/20 backdrop-blur-xl border border-aura-gold/30 rounded-full text-[9px] font-bold uppercase tracking-widest text-aura-gold">
                               {p.category}
                             </span>
                           )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-aura-black/90 via-aura-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                        <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 flex flex-col md:flex-row justify-between items-start md:items-end z-10 gap-2">
                           <div className="max-w-full md:max-w-[60%]">
                              <h3 className="text-sm md:text-3xl font-display font-bold uppercase tracking-tight text-white mb-0.5 md:mb-1 leading-none">{p.name}</h3>
                              <p className="text-[7px] md:text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">{p.tagline}</p>
                           </div>
                           <button 
                              onClick={() => {
                                if (!user) setActiveView('auth');
                                else setSelectedProduct(p);
                              }}
                              className="w-full md:w-auto px-4 md:px-8 py-2 md:py-4 bg-white text-aura-black rounded-lg md:rounded-2xl font-bold uppercase text-[8px] md:text-[10px] tracking-widest active:scale-95 transition-transform"
                           >
                             Preorder
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Manifesto */}
              <section className="py-40 px-8 bg-white text-aura-black">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                   <span className="text-[10px] uppercase font-bold tracking-[0.6em] text-aura-black/40">Our Philosophy</span>
                   <h2 className="text-4xl md:text-6xl font-display font-bold uppercase leading-tight tracking-tighter">
                     We believe in products that respect your time, your space, and your attention.
                   </h2>
                   <p className="text-xl md:text-2xl font-light italic text-aura-black/60">
                     "Simplicity is the ultimate sophistication."
                   </p>
                </div>
              </section>
            </motion.div>
          )}

          {activeView === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center h-[90vh] px-8">
              <div className="w-full max-w-md glass-panel p-12 rounded-[40px] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aura-gold to-transparent opacity-50" />
                <div className="text-center">
                  <h2 className="text-3xl font-display font-bold uppercase tracking-tight italic">{isLogin ? "Welcome" : "Initiate"}</h2>
                  <p className="text-[10px] text-white/40 mt-2 font-bold uppercase tracking-widest leading-relaxed">
                    {isLogin ? "Aura Key Required for Vault Access" : "Join the world's most exclusive collective"}
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleAuth}>
                  {!isLogin && (
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:border-aura-gold transition-colors outline-none" 
                      placeholder="Identified Name" 
                      value={authForm.name} 
                      onChange={e => setAuthForm({...authForm, name: e.target.value})}
                      required
                    />
                  )}
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:border-aura-gold transition-colors outline-none" 
                    placeholder="Email Address" 
                    type="email"
                    value={authForm.email}
                    onChange={e => setAuthForm({...authForm, email: e.target.value})}
                    required
                  />
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:border-aura-gold transition-colors outline-none" 
                    placeholder="Security Passphrase" 
                    type="password"
                    value={authForm.password}
                    onChange={e => setAuthForm({...authForm, password: e.target.value})}
                    required
                  />
                  <button className="w-full py-5 bg-white text-aura-black rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-aura-silver transition-all shadow-xl disabled:opacity-50" disabled={isLoading}>
                    {isLoading ? "Validating..." : (isLogin ? "Enter Vault" : "Register ID")}
                  </button>
                </form>
                <div className="pt-4 border-t border-white/5 text-center">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">
                    {isLogin ? "Credentials missing?" : "Already possess an ID?"}
                  </p>
                  <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-aura-gold hover:text-white transition-colors">
                    {isLogin ? "Register Aura ID" : "Login to Account"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                  <div className="p-6 glass-panel rounded-[32px] mb-8">
                    <p className="text-[10px] uppercase font-bold text-white/30 mb-1">Aura Member</p>
                    <h3 className="text-xl font-display font-bold uppercase">{user.name}</h3>
                  </div>
                  <button onClick={() => setActiveView('dashboard')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 text-white text-xs font-bold uppercase tracking-widest">
                    <LayoutDashboard size={16}/> Overview
                  </button>
                  <button onClick={() => setActiveView('wallet')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest">
                    <Wallet size={16}/> Wallet
                  </button>
                  <button onClick={() => setActiveView('track')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest">
                    <Package size={16}/> Track Orders
                  </button>
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-8 glass-panel rounded-[32px]">
                         <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Total Assets</span>
                         <h4 className="text-4xl font-display font-bold mt-2">${user.walletBalance}</h4>
                      </div>
                      <div className="p-8 glass-panel rounded-[32px]">
                         <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Recent Preorders</span>
                         <h4 className="text-4xl font-display font-bold mt-2">{orders.length}</h4>
                      </div>
                   </div>

                   <div className="glass-panel rounded-[32px] overflow-hidden">
                      <div className="p-8 border-b border-white/5 flex justify-between items-center">
                         <h3 className="text-lg font-display font-bold uppercase">Preorder Status</h3>
                         <button className="text-[10px] uppercase font-bold text-aura-gold underline">View All</button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {orders.length === 0 ? (
                          <div className="p-20 text-center text-white/20 text-xs font-bold uppercase tracking-[0.2em]">No preorders found</div>
                        ) : (
                          orders.map(o => (
                            <div key={o.id} className="p-6 flex justify-between items-center hover:bg-white/5 transition-colors">
                              <div>
                                <p className="text-sm font-bold uppercase">{o.productName}</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{o.id} • {new Date(o.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                  o.status === "Preordered" ? "border-aura-gold text-aura-gold" : "border-green-500 text-green-500"
                                )}>
                                  {o.status}
                                </span>
                                <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-bold">Track: {o.tracking}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'wallet' && user && (
            <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-8 py-12 space-y-12">
               <div className="text-center space-y-4">
                  <h2 className="text-5xl font-display font-bold uppercase">Your Digital Vault</h2>
                  <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-bold">Secure funds for rapid preorders</p>
               </div>
               
               <div className="p-12 glass-panel rounded-[48px] bg-linear-to-br from-white/[0.08] to-transparent text-center">
                  <Wallet size={48} className="mx-auto mb-6 text-white/20" />
                  <p className="text-[10px] uppercase font-bold text-white/30 tracking-[0.4em] mb-2">Available Balance</p>
                  <h3 className="text-7xl font-display font-bold">${user.walletBalance}</h3>
               </div>

               <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest">Fund Wallet</h4>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        value={fundAmount} 
                        onChange={e => setFundAmount(Number(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                        placeholder="Amount in USD"
                      />
                      <button onClick={handleFundWallet} className="px-8 bg-white text-aura-black rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-aura-silver">
                        Fund
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       {[100, 500, 1000].map(amt => (
                         <button onClick={() => setFundAmount(amt)} className="py-3 border border-white/5 rounded-xl text-[10px] font-bold opacity-40 hover:opacity-100 transition-opacity">+${amt}</button>
                       ))}
                    </div>
                  </div>
                  <div className="p-8 border border-white/5 rounded-[32px] space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Secure Infrastructure</h4>
                    <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-widest font-medium">Your funds are stored in an encrypted vault, strictly for use within the Aura ecosystem. All transactions are immutable.</p>
                  </div>
               </div>
            </motion.div>
          )}

          {activeView === 'admin' && user?.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-8 py-12 space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-display font-bold uppercase">Control Center</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mt-2">Inventory • Logistics • Revenue</p>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white hover:text-aura-black">New Product</button>
                </div>
              </div>

              {adminStats && (
                <div className="grid md:grid-cols-4 gap-4">
                   <div className="p-6 glass-panel rounded-3xl">
                     <p className="text-[9px] uppercase font-bold text-white/30 mb-2">Total Users</p>
                     <h4 className="text-3xl font-display font-bold">{adminStats.totalUsers}</h4>
                   </div>
                   <div className="p-6 glass-panel rounded-3xl">
                     <p className="text-[9px] uppercase font-bold text-white/30 mb-2">Orders Placed</p>
                     <h4 className="text-3xl font-display font-bold">{adminStats.totalOrders}</h4>
                   </div>
                   <div className="p-6 glass-panel rounded-3xl">
                     <p className="text-[9px] uppercase font-bold text-white/30 mb-2">Total Revenue</p>
                     <h4 className="text-3xl font-display font-bold text-aura-gold">${adminStats.totalRevenue}</h4>
                   </div>
                   <div className="p-6 glass-panel rounded-3xl">
                     <p className="text-[9px] uppercase font-bold text-white/30 mb-2">Active SKUs</p>
                     <h4 className="text-3xl font-display font-bold">{adminStats.products.length}</h4>
                   </div>
                </div>
              )}

              <div className="glass-panel rounded-[40px] overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-white/5 border-b border-white/5">
                     <tr>
                        <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-white/40">Product</th>
                        <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-white/40">Price</th>
                        <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-white/40">Stock</th>
                        <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-white/40">Orders</th>
                        <th className="p-6 text-right"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {adminStats?.products.map((p: any) => (
                       <tr key={p.id} className="hover:bg-white/2">
                          <td className="p-6 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-aura-gray overflow-hidden">
                              <img src={p.image} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-bold uppercase">{p.name}</span>
                          </td>
                          <td className="p-6 text-xs font-medium">${p.price}</td>
                          <td className="p-6 text-xs font-medium">{p.inventory}</td>
                          <td className="p-6 text-xs font-medium">12</td>
                          <td className="p-6 text-right">
                             <button className="text-[10px] uppercase font-bold text-white/30 hover:text-white">Edit</button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Preorder Modal with Location */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-aura-black rounded-[48px] border border-white/10 overflow-hidden grid md:grid-cols-2"
            >
              <div className="hidden md:block h-full bg-aura-gray overflow-hidden">
                <img src={selectedProduct.image} className="w-full h-full object-cover" />
              </div>
              <div className="p-12 space-y-8 flex flex-col max-h-[90vh] overflow-y-auto">
                <div>
                  <h2 className="text-4xl font-display font-bold uppercase">{selectedProduct.name}</h2>
                  <p className="text-xs text-aura-gold mt-2 font-bold uppercase tracking-widest italic">{selectedProduct.tagline}</p>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
                     <MapPin size={14}/> Delivery Destination (Nigeria)
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <select 
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs outline-none"
                        value={orderAddress.state}
                        onChange={e => setOrderAddress({...orderAddress, state: e.target.value, lga: ''})}
                      >
                         <option value="">Select State</option>
                         {Object.keys(NIGERIA_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select 
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs outline-none"
                        disabled={!orderAddress.state}
                        value={orderAddress.lga}
                        onChange={e => setOrderAddress({...orderAddress, lga: e.target.value})}
                      >
                         <option value="">Select L.G.A</option>
                         {orderAddress.state && NIGERIA_STATES[orderAddress.state].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                   </div>
                   <input 
                      placeholder="Shipping Address (Street, Building, etc.)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs outline-none"
                      value={orderAddress.street}
                      onChange={e => setOrderAddress({...orderAddress, street: e.target.value})}
                   />
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                   <div className="flex justify-between items-center text-[10px] uppercase font-bold text-white/40 tracking-widest">
                     <span>Item Price</span> <span>${selectedProduct.price}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] uppercase font-bold text-white/40 tracking-widest">
                     <span>Shipping (Secure)</span> <span>Calculated</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-white/5">
                     <span className="text-xs uppercase font-bold">Total Reservation</span>
                     <span className="text-xl font-display font-bold">${selectedProduct.price}</span>
                   </div>
                </div>

                <button 
                  onClick={handlePreorder}
                  className="w-full py-6 bg-white text-aura-black rounded-2xl font-bold uppercase text-xs tracking-[0.3em] hover:bg-aura-silver"
                >
                  Confirm Preorder from Wallet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Concierge */}
      <div className="fixed bottom-8 right-8 z-[150]">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-20 right-0 w-80 md:w-96 glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-aura-gold" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Concierge</p>
                </div>
                <button onClick={() => setIsChatOpen(false)}><X size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[11px] font-light leading-relaxed">
                 {chatHistory.map((c, i) => (
                   <div key={i} className={cn("max-w-[85%] p-3 rounded-2xl", c.role === 'user' ? "ml-auto bg-white text-aura-black" : "bg-white/10 border border-white/5")}>
                     {c.text}
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                <input 
                  value={chatMessage} 
                  onChange={e => setChatMessage(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-aura-black/50 border border-white/10 rounded-xl px-4 py-3 text-[10px] outline-none"
                  placeholder="Inquire about Aura..."
                />
                <button onClick={handleSendMessage} className="p-3 bg-white text-aura-black rounded-xl"><Send size={14}/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 bg-white text-aura-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
          {isChatOpen ? <X size={20}/> : <MessageSquare size={20}/>}
        </button>
      </div>
    </div>
  );
}

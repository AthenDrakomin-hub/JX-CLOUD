
import React, { useState, useMemo, useEffect } from 'react';
import { Dish, Order, OrderStatus, PaymentMethod, PaymentMethodConfig, SystemConfig } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { api } from '../services/api';
import { CATEGORIES } from '../constants';
import { 
  Plus, Minus, Globe, Search,
  ChevronRight, ShoppingCart, 
  Flame, Loader2, CheckCircle2,
  Banknote, Wallet, CreditCard, BellRing, Filter
} from 'lucide-react';

interface GuestOrderProps {
  roomId: string;
  dishes: Dish[];
  onSubmitOrder: (order: Partial<Order>) => Promise<void>;
  lang: Language;
  onToggleLang: () => void;
  onRescan: () => void;
}

const GuestOrder: React.FC<GuestOrderProps> = ({ roomId, dishes, onSubmitOrder, lang, onToggleLang, onRescan }) => {
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availablePayments, setAvailablePayments] = useState<PaymentMethodConfig[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const t = (key: keyof typeof translations.zh) => getTranslation(lang, key);
  const C = t('currency');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const pAll = await api.payments.getAll();
    const active = pAll.filter(p => p.isActive);
    setAvailablePayments(active);
    if (active.length > 0) setSelectedPayment(active[0].type);
  };

  const visibleDishes = useMemo(() => dishes.filter(d => d.isAvailable !== false), [dishes]);

  const filteredDishes = useMemo(() => {
    return visibleDishes.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [visibleDishes, searchTerm, activeCategory]);

  const cartItems = useMemo(() => {
    return (Object.entries(cart) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const dish = visibleDishes.find(d => d.id === id);
        return { dish, quantity: qty };
      })
      .filter(item => item.dish !== undefined);
  }, [cart, visibleDishes]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + (item.dish!.price * item.quantity), 0), [cartItems]);
  const totalAmount = subtotal * 1.12; // Simple 12% VAT logic for demo

  const handlePlaceOrder = async () => {
    if (!selectedPayment) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const newOrder: Partial<Order> = {
      roomId,
      items: cartItems.map(item => ({
        dishId: item.dish!.id,
        name: lang === 'zh' ? item.dish!.name : (item.dish!.nameEn || item.dish!.name),
        quantity: item.quantity,
        price: item.dish!.price
      })),
      totalAmount: Math.round(totalAmount),
      status: OrderStatus.PENDING,
      paymentMethod: selectedPayment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSubmitOrder(newOrder);
      setIsSuccess(true);
    } catch (e) {
      alert('Order Failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const QuantitySelector = ({ dishId }: { dishId: string }) => {
    const qty = cart[dishId] || 0;
    if (qty === 0) {
      return (
        <button onClick={() => setCart(p => ({...p, [dishId]: 1}))} className="px-6 py-2 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
          <Plus size={14} className="inline mr-1" />{t('addToCart')}
        </button>
      );
    }
    return (
      <div className="flex items-center p-1 bg-slate-100 rounded-full">
        <button onClick={() => setCart(p => ({...p, [dishId]: Math.max(0, qty - 1)}))} className="w-8 h-8 flex items-center justify-center text-slate-500"><Minus size={14} /></button>
        <span className="w-8 text-center text-sm font-black">{qty}</span>
        <button onClick={() => setCart(p => ({...p, [dishId]: qty + 1}))} className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md"><Plus size={14} /></button>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 text-[#d4af37] rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(212,175,55,0.4)] animate-bounce border border-[#d4af37]/30">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-serif italic text-white mb-4 tracking-tighter">下单成功</h2>
        <p className="text-slate-300 mb-12">美食正在制作中，房间 {roomId} 将在 30 分钟内送达。</p>
        <button onClick={() => { setIsSuccess(false); setIsCheckout(false); setCart({}); }} className="px-12 py-5 bg-[#d4af37] text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl">继续点餐</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto relative shadow-2xl font-sans text-slate-900 overflow-hidden">
      <header className="bg-white/80 px-8 py-6 sticky top-0 z-[60] flex items-center justify-between border-b border-slate-50 backdrop-blur-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#d4af37] shadow-xl font-black text-lg italic font-serif">
            {roomId}
          </div>
          <h1 className="text-xl font-serif italic tracking-tighter text-slate-900 leading-none">江西云厨</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onToggleLang} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-2">
            <Globe size={16} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{lang === 'zh' ? 'EN' : '中'}</span>
          </button>
        </div>
      </header>

      {!isCheckout ? (
        <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar bg-[#fcfcfc] pb-40">
           <div className="p-6">
              <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d4af37]" size={18} />
                  <input type="text" placeholder={t('searchDishes')} className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm outline-none shadow-sm focus:ring-8 focus:ring-slate-50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>

           {/* 吸顶分类栏 */}
           <div className="sticky top-[89px] z-50 bg-white/90 backdrop-blur-xl border-y border-slate-50 px-6 py-4 flex items-center space-x-3 overflow-x-auto no-scrollbar shadow-sm">
              <button
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0
                  ${activeCategory === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {t('allCategories')}
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0
                    ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
           </div>

           <div className="p-6 space-y-10">
              <div className="space-y-8">
                  <div className="px-2 flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">{activeCategory === 'All' ? t('curatedMenu') : activeCategory}</h2>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{filteredDishes.length} {t('itemsCount')}</span>
                  </div>
                  
                  {filteredDishes.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                       <Filter size={48} className="opacity-20 mb-4" />
                       <p className="text-xs font-black uppercase tracking-[0.2em]">暂无相关菜品</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-12">
                      {filteredDishes.map((dish, idx) => (
                        <div key={dish.id} className="group animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                          <div className="relative aspect-[4/3] rounded-[3.5rem] overflow-hidden shadow-xl mb-6 bg-slate-100">
                              <img src={dish.imageUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={dish.name} loading="lazy" />
                              {dish.isRecommended && <div className="absolute top-8 left-8 bg-slate-950 text-[#d4af37] text-[10px] font-black uppercase px-5 py-2.5 rounded-full shadow-2xl flex items-center border border-white/5 backdrop-blur-md"><Flame size={16} className="mr-2" /> 精选推荐</div>}
                          </div>
                          <div className="flex items-center justify-between px-2">
                              <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{dish.name}</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-3">{dish.nameEn}</p>
                                <p className="text-2xl font-serif italic text-slate-900 tracking-tighter">{C}{Math.round(dish.price)}</p>
                              </div>
                              <div className="shrink-0">
                                <QuantitySelector dishId={dish.id} />
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
           </div>
           
           {subtotal > 0 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 z-40">
               <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-950 text-white h-20 rounded-[2.5rem] flex items-center justify-between px-8 font-black shadow-[0_30px_60px_-10px_rgba(0,0,0,0.6)] active:scale-95 transition-all border border-white/20 animate-in slide-in-from-bottom duration-300">
                 <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-[#d4af37] rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
                     <ShoppingCart size={24} />
                   </div>
                   <div className="flex flex-col text-left">
                     <span className="text-[10px] uppercase tracking-[0.3em] opacity-60">Total</span>
                     <span className="text-xl font-serif italic">{C}{Math.round(totalAmount)}</span>
                   </div>
                 </div>
                 <ChevronRight size={24} className="text-[#d4af37]" />
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white animate-in slide-in-from-right duration-500 p-8">
           <div className="flex items-center space-x-4 mb-10">
             <button onClick={() => setIsCheckout(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-900">
               <ChevronRight className="rotate-180" size={24} />
             </button>
             <h2 className="text-3xl font-bold tracking-tighter">确认账单</h2>
           </div>
           
           <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-32">
              <div className="bg-slate-50 rounded-[3rem] p-10 space-y-4">
                 <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-black uppercase tracking-widest">小计</span>
                    <span className="font-bold">{C}{Math.round(subtotal)}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-black uppercase tracking-widest">{t('tax')}</span>
                    <span className="font-bold">{C}{Math.round(subtotal * 0.12)}</span>
                 </div>
                 <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('total')}</span>
                    <span className="text-4xl font-serif italic text-[#d4af37]">{C}{Math.round(totalAmount)}</span>
                 </div>
              </div>

              <div className="space-y-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">支付方式</p>
                <div className="grid grid-cols-1 gap-3">
                   {availablePayments.map(method => (
                      <button 
                        key={method.id} 
                        onClick={() => setSelectedPayment(method.type)} 
                        className={`p-6 rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${selectedPayment === method.type ? 'border-[#d4af37] bg-amber-50/40' : 'border-slate-50 hover:bg-slate-50'}`}
                      >
                         <span className="font-black uppercase tracking-widest text-sm text-slate-900">{method.name}</span>
                         {selectedPayment === method.type && <CheckCircle2 size={24} className="text-[#d4af37]" />}
                      </button>
                   ))}
                </div>
              </div>
           </div>

           <div className="p-8 bg-white safe-area-bottom absolute bottom-0 left-0 w-full border-t border-slate-50">
             <button onClick={handlePlaceOrder} disabled={isProcessing || !selectedPayment} className="w-full h-20 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] bg-slate-950 text-white shadow-2xl flex items-center justify-center space-x-4 active:scale-95 transition-all disabled:opacity-50">
               {isProcessing ? <Loader2 size={24} className="animate-spin text-[#d4af37]" /> : <span>{t('processSecurePayment')}</span>}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestOrder;
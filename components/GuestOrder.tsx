
import React, { useState, useMemo, useEffect } from 'react';
import { Dish, Order, OrderStatus, PaymentMethod, PaymentMethodConfig } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { api } from '../services/api';
import { 
  Plus, Minus, Globe, Search,
  ChevronRight, ShoppingCart, 
  Flame, Loader2, CheckCircle2,
  ArrowLeft, CreditCard, Filter, Smartphone, Banknote, Wallet
} from 'lucide-react';

interface GuestOrderProps {
  roomId: string;
  dishes: Dish[];
  onSubmitOrder: (order: Partial<Order>) => Promise<void>;
  lang: Language;
  onToggleLang: () => void;
  onRescan: () => void;
}

const GuestOrder: React.FC<GuestOrderProps> = ({ roomId, dishes, onSubmitOrder, lang, onToggleLang }) => {
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availablePayments, setAvailablePayments] = useState<PaymentMethodConfig[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const t = (key: string) => getTranslation(lang, key);
  
  const tc = (cat: string) => {
    if (cat === 'All') return '全部分类 / All';
    return cat;
  };
  const C = t('currency');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const [pAll, cats] = await Promise.all([api.payments.getAll(), api.categories.getAll()]);
    const active = pAll.filter(p => p.isActive);
    setAvailablePayments(active);
    setDynamicCategories(cats);
    if (active.length > 0) setSelectedPayment(active[0].type);
  };

  const filteredDishes = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return dishes.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(lowerSearchTerm) || (d.nameEn || '').toLowerCase().includes(lowerSearchTerm);
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      return matchSearch && matchCategory && d.isAvailable !== false;
    });
  }, [dishes, searchTerm, activeCategory]);

  const cartItems = useMemo(() => {
    const result = [];
    for (const [id, qty] of Object.entries(cart)) {
      if (qty > 0) {
        const dish = dishes.find(d => d.id === id);
        if (dish) {
          result.push({ dish, quantity: qty });
        }
      }
    }
    return result;
  }, [cart, dishes]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + (item.dish!.price * item.quantity), 0), [cartItems]);
  const totalAmount = subtotal * 1.12; 

  const getMethodIcon = (iconType: string) => {
    switch (iconType) {
      case 'smartphone': return <Smartphone size={20} />;
      case 'wallet': return <Wallet size={20} />;
      case 'banknote': return <Banknote size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl border-2 border-emerald-500/30 animate-bounce"><CheckCircle2 size={48} /></div>
        <h2 className="text-3xl font-bold text-white mb-2">下单成功 / Success</h2>
        <p className="text-slate-400 mb-12">{`房间 ${roomId} 订单已确认。`} <br/> {`Room ${roomId} order confirmed.`}</p>
        <button onClick={() => { setIsSuccess(false); setIsCheckout(false); setCart({}); }} className="px-12 py-5 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl">继续点餐 / Order More</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto relative shadow-2xl font-sans text-slate-900 border-x border-slate-300">
      <header className="bg-white/90 px-8 py-6 sticky top-0 z-[60] flex items-center justify-between border-b border-slate-300 backdrop-blur-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl font-black text-lg italic border border-slate-800">{roomId}</div>
          <h1 className="text-xl font-serif italic text-slate-900 leading-none">JX Cloud | 江西云厨</h1>
        </div>
        <button onClick={onToggleLang} className="px-4 h-10 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 font-bold text-[10px] flex items-center gap-2 active:bg-blue-600 active:text-white transition-all shadow-sm">
          <Globe size={14} />
          {lang === 'zh' ? 'EN Mode' : '中文模式'}
        </button>
      </header>

      {!isCheckout ? (
        <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar bg-slate-50/30 pb-40">
           <div className="p-6">
              <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="搜索菜品 (Search Dishes)..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-300 rounded-[2rem] text-sm outline-none shadow-sm focus:ring-8 focus:ring-blue-50/50 transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>

           <div className="sticky top-[89px] z-50 bg-white/95 backdrop-blur-xl border-y border-slate-300 px-6 py-4 flex items-center space-x-3 overflow-x-auto no-scrollbar shadow-sm">
              <button onClick={() => setActiveCategory('All')} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategory === 'All' ? 'bg-blue-600 border-blue-700 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>{tc('All')}</button>
              {dynamicCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategory === cat ? 'bg-blue-600 border-blue-700 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>{cat}</button>
              ))}
           </div>

           <div className="p-6 space-y-10">
              {filteredDishes.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300"><Filter size={48} className="opacity-20 mb-4" /><p className="text-xs font-black uppercase tracking-widest">No Matches / 暂无结果</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredDishes.map((dish) => (
                    <div key={dish.id} className="group animate-in fade-in slide-in-from-bottom-4">
                      <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-premium mb-6 bg-slate-200 border-2 border-white">
                          <img src={dish.imageUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={dish.name} />
                          {dish.isRecommended && <div className="absolute top-6 left-6 bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-full shadow-2xl flex items-center border border-blue-500"><Flame size={12} className="mr-1" /> Chef's Pick</div>}
                          {dish.stock <= 0 && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white font-black text-sm uppercase tracking-[0.3em]">Sold Out / 售罄</div>}
                      </div>
                      <div className="flex items-start justify-between px-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            {/* 双语名称并排显示 */}
                            <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-tight truncate">{dish.name}</h3>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-1 truncate">
                              {dish.nameEn || dish.name}
                            </p>
                            <p className="text-2xl font-serif italic text-blue-700">{C}{Math.round(dish.price)}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-4 ml-2">
                             {dish.stock > 0 && (
                               cart[dish.id] ? (
                                 <div className="flex items-center bg-slate-100 rounded-full border p-1">
                                   <button onClick={() => setCart(p => ({...p, [dish.id]: Math.max(0, p[dish.id]-1)}))} className="w-8 h-8 flex items-center justify-center text-slate-500 rounded-l-full"><Minus size={16} /></button>
                                   <span className="w-6 text-center font-black text-sm">{cart[dish.id]}</span>
                                   <button onClick={() => setCart(p => ({...p, [dish.id]: Math.min(dish.stock, p[dish.id]+1)}))} className="w-8 h-8 bg-slate-950 text-white rounded-r-full flex items-center justify-center"><Plus size={16} /></button>
                                 </div>
                               ) : (
                                 <button onClick={() => setCart(p => ({...p, [dish.id]: 1}))} className="px-4 py-2 bg-slate-950 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl">点餐</button>
                               )
                             )}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
           
           {subtotal > 0 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 z-40">
               <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-950 text-white h-20 rounded-[2.5rem] flex items-center justify-between px-8 font-black shadow-2xl active-scale transition-all border-2 border-slate-800 animate-in slide-in-from-bottom">
                 <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><ShoppingCart size={24} /></div>
                   <div className="flex flex-col text-left">
                     <span className="text-[10px] uppercase tracking-widest text-slate-500">应付总计 / TOTAL</span>
                     <span className="text-xl font-serif italic">{C}{Math.round(totalAmount)}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 text-blue-500"><span className="text-[10px] tracking-widest uppercase">结算 / CHECKOUT</span><ChevronRight size={24} /></div>
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white animate-in slide-in-from-right duration-500 p-8">
           <button onClick={() => setIsCheckout(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-900 border border-slate-200 active-scale mb-10"><ArrowLeft size={24} /></button>
           <h2 className="text-2xl font-bold tracking-tighter mb-1">订单确认 / Confirm Order</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">请核对账单 / Verify Billing Details</p>
           
           <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-32">
              <div className="bg-slate-50 rounded-[3rem] p-8 space-y-4 border-2 border-slate-200 shadow-inner">
                 {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed last:border-0">
                       <div className="pr-4">
                        <p className="font-bold text-slate-950">{item.dish?.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">{item.dish?.nameEn || item.dish?.name}</p>
                       </div>
                       <span className="font-black text-blue-700 shrink-0">x{item.quantity}</span>
                    </div>
                 ))}
                 <div className="pt-6 mt-4 space-y-2 border-t border-slate-300">
                    <div className="flex justify-between text-xs text-slate-500"><span>小计 / Subtotal</span><span>{C}{Math.round(subtotal)}</span></div>
                    <div className="flex justify-between text-xs text-slate-500"><span>税费 / Tax (12%)</span><span>{C}{Math.round(subtotal * 0.12)}</span></div>
                    <div className="pt-4 flex justify-between items-center"><span className="text-sm font-black text-slate-950 uppercase">应付总计 / Total Bill</span><span className="text-4xl font-serif italic text-blue-700">{C}{Math.round(totalAmount)}</span></div>
                 </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">支付方式 / Payment Method</p>
                {availablePayments.map(method => (
                  <button key={method.id} onClick={() => setSelectedPayment(method.type)} className={`w-full p-6 rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${selectedPayment === method.type ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
                     <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${selectedPayment === method.type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {getMethodIcon(method.iconType)}
                        </div>
                        <span className="font-bold uppercase tracking-widest text-xs">{method.name}</span>
                     </div>
                     {selectedPayment === method.type && <CheckCircle2 size={24} className="text-blue-600" />}
                  </button>
                ))}
              </div>
           </div>

           <div className="p-8 bg-white absolute bottom-0 left-0 w-full border-t border-slate-300">
             <button onClick={async () => { if(!selectedPayment) return; setIsProcessing(true); await onSubmitOrder({ roomId, items: cartItems.map(i=>({dishId:i.dish!.id, name:i.dish!.name, quantity:i.quantity, price:i.dish!.price})), totalAmount: Math.round(totalAmount), status: OrderStatus.PENDING, paymentMethod: selectedPayment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); setIsSuccess(true); setIsProcessing(false); }} disabled={isProcessing || !selectedPayment} className="w-full h-20 rounded-[2.5rem] font-black text-sm uppercase tracking-widest bg-slate-950 text-white shadow-2xl flex items-center justify-center space-x-4 active-scale transition-all">
               {isProcessing ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <span>提交订单 / PLACE ORDER</span>}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestOrder;
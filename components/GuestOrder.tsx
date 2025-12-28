
import React, { useState, useMemo, useEffect } from 'react';
import { Dish, Order, OrderStatus, PaymentMethod, PaymentMethodConfig, SystemConfig } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { api } from '../services/api';
import { 
  Plus, Minus, Globe, Search,
  ChevronRight, ShoppingCart, 
  Smartphone, ArrowLeft, Flame, Loader2, CheckCircle2,
  Banknote, Wallet, ShoppingBag, CreditCard, Info, Coins, BellRing
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
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availablePayments, setAvailablePayments] = useState<PaymentMethodConfig[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isCallingService, setIsCallingService] = useState(false);
  
  const t = (key: keyof typeof translations.zh) => getTranslation(lang, key);
  const C = t('currency');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const [pAll, sysConfig] = await Promise.all([
      api.payments.getAll(),
      api.config.get()
    ]);
    const active = pAll.filter(p => p.isActive);
    setAvailablePayments(active);
    setConfig(sysConfig);
    if (active.length > 0) setSelectedPayment(active[0].type);
  };

  const handleCallService = () => {
    setIsCallingService(true);
    setTimeout(() => setIsCallingService(false), 3000);
    // 实际生产中这里会发送 Webhook 或 Socket 消息给前台
  };

  const visibleDishes = useMemo(() => dishes.filter(d => d.isAvailable !== false), [dishes]);
  const recommendedDishes = useMemo(() => visibleDishes.filter(d => d.isRecommended), [visibleDishes]);

  const filteredDishes = useMemo(() => {
    return visibleDishes.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visibleDishes, searchTerm]);

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
  const tax = subtotal * 0.12; 
  const serviceCharge = config ? (subtotal * (config.serviceChargeRate / 100)) : 0;
  const totalAmount = subtotal + tax + serviceCharge;

  const totalCNY = config ? Math.round(totalAmount / config.exchangeRateCNY) : 0;
  const totalUSDT = config ? Math.round(totalAmount / config.exchangeRateUSDT) : 0;

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
      taxAmount: Math.round(tax),
      serviceCharge: Math.round(serviceCharge),
      status: OrderStatus.PENDING,
      paymentMethod: selectedPayment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSubmitOrder(newOrder);
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      alert('Order Submission Failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const QuantitySelector = ({ dishId }: { dishId: string }) => {
    const qty = cart[dishId] || 0;
    
    if (qty === 0) {
      return (
        <div className="flex items-center">
          <button 
            onClick={() => setCart(p => ({...p, [dishId]: 1}))}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 hover:bg-[#d4af37] transition-all animate-in fade-in zoom-in-95 duration-200"
          >
            <Plus size={14} />
            <span>{t('addToCart')}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center p-1 bg-slate-950 rounded-full shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => setCart(p => ({...p, [dishId]: Math.max(0, qty - 1)}))} 
          className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors hover:bg-white/5 rounded-full"
        >
          <Minus size={18} />
        </button>
        <div className="w-10 flex flex-col items-center">
          <span className="text-sm font-black text-white">{qty}</span>
        </div>
        <button 
          onClick={() => setCart(p => ({...p, [dishId]: qty + 1}))} 
          className="w-10 h-10 flex items-center justify-center bg-[#d4af37] text-white rounded-full shadow-lg active:scale-90 transition-all hover:bg-amber-500"
        >
          <Plus size={18} />
        </button>
      </div>
    );
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'smartphone': return <Smartphone size={24} />;
      case 'wallet': return <Wallet size={24} />;
      case 'banknote': return <Banknote size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
        <div className="w-24 h-24 bg-emerald-500/20 text-[#d4af37] rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(212,175,55,0.4)] animate-bounce border border-[#d4af37]/30">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-serif italic text-white mb-4 tracking-tighter">{lang === 'zh' ? '尊享点餐成功' : 'Order Received'}</h2>
        <p className="text-slate-300 font-medium mb-12 max-w-xs mx-auto leading-relaxed text-sm">
          {lang === 'zh' 
            ? `您的美味正在由江西云厨精心准备。房间 ${roomId} 将在 20-30 分钟内送达。`
            : `Delicacies for Room ${roomId} are being prepared. Estimated delivery: 20-30 mins.`}
        </p>
        <button 
          onClick={() => { setIsSuccess(false); setIsCheckout(false); setCart({}); }} 
          className="px-12 py-5 bg-[#d4af37] text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
        >
          {lang === 'zh' ? '继续点购' : 'Back to Menu'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto relative shadow-2xl font-sans text-slate-900 overflow-hidden border-x border-slate-100">
      <div className="bg-[#0f172a] text-[9px] text-white py-2.5 flex items-center justify-center space-x-2 font-black uppercase tracking-[0.3em] relative z-50">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
        <span>JX Cloud Enterprise Node • Secure Checkout</span>
      </div>

      <header className="bg-white/80 px-8 py-6 sticky top-0 z-40 flex items-center justify-between border-b border-slate-50 backdrop-blur-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-[#d4af37] shadow-xl font-black text-lg italic font-serif border border-white/5">
            {roomId}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-serif italic tracking-tighter text-slate-900 leading-none">江西云厨</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Smart Suite</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleCallService} className={`p-3 rounded-2xl border transition-all flex items-center space-x-2 active:scale-95 ${isCallingService ? 'bg-emerald-500 text-white border-transparent shadow-lg' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}>
            {isCallingService ? <CheckCircle2 size={16} /> : <BellRing size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{isCallingService ? (lang === 'zh' ? '已呼叫' : 'Sent') : (lang === 'zh' ? '呼叫' : 'Call')}</span>
          </button>
          <button onClick={onToggleLang} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-2 active:bg-slate-100 transition-colors">
            <Globe size={16} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{lang === 'zh' ? 'EN' : '中'}</span>
          </button>
        </div>
      </header>

      {!isCheckout ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-10 no-scrollbar bg-[#fcfcfc] pb-40 relative">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#d4af37]" size={18} />
              <input type="text" placeholder={t('searchDishes')} className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm outline-none shadow-sm focus:ring-8 focus:ring-slate-50 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>

           {recommendedDishes.length > 0 && !searchTerm && (
             <div className="space-y-6 animate-in slide-in-from-left duration-700">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center space-x-2 text-[#d4af37]">
                      <ShoppingBag size={18} />
                      <h2 className="text-lg font-black uppercase tracking-widest">{t('recommendedForYou')}</h2>
                   </div>
                </div>
                <div className="flex overflow-x-auto no-scrollbar space-x-6 pb-4 -mx-6 px-6">
                   {recommendedDishes.map((dish) => (
                      <div key={dish.id} className="min-w-[280px] bg-white rounded-[3rem] border border-slate-50 shadow-xl overflow-hidden group relative flex flex-col">
                         <div className="relative aspect-[4/3] overflow-hidden">
                            <img src={dish.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={dish.name} />
                            <div className="absolute top-4 left-4">
                               <div className="bg-[#d4af37] text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-md flex items-center space-x-1">
                                  <Flame size={12} />
                                  <span>Top Pick</span>
                               </div>
                            </div>
                         </div>
                         <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                               <div className="space-y-0.5">
                                  <h3 className="text-lg font-bold text-slate-900 truncate max-w-[150px]">{dish.name}</h3>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dish.nameEn}</p>
                               </div>
                               <p className="text-xl font-serif italic text-slate-900 tracking-tighter">{C}{Math.round(dish.price)}</p>
                            </div>
                            <div className="flex justify-end pt-2">
                               <QuantitySelector dishId={dish.id} />
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           <div className="space-y-8">
              <div className="px-2">
                 <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">{t('curatedMenu')}</h2>
              </div>
              <div className="grid grid-cols-1 gap-14">
                {filteredDishes.map((dish, idx) => (
                   <div key={dish.id} className="group animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                     <div className="relative aspect-[4/3] rounded-[3.5rem] overflow-hidden shadow-2xl mb-6 bg-slate-100 border-2 border-white">
                        <img src={dish.imageUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={dish.name} loading="lazy" />
                        {dish.isRecommended && <div className="absolute top-8 left-8 bg-slate-950 text-[#d4af37] text-[10px] font-black uppercase px-5 py-2.5 rounded-full shadow-2xl flex items-center border border-white/5 backdrop-blur-md"><Flame size={16} className="mr-2" /> {lang === 'zh' ? '主厨推荐' : 'Chef Special'}</div>}
                     </div>
                     <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                           <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{dish.name}</h3>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-3">{dish.nameEn}</p>
                           <p className="text-2xl font-serif italic text-slate-900 tracking-tighter">{C}{Math.round(dish.price)}</p>
                        </div>
                        <div className="shrink-0 flex items-center">
                           <QuantitySelector dishId={dish.id} />
                        </div>
                     </div>
                   </div>
                ))}
              </div>
           </div>
           
           {subtotal > 0 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 z-40">
               <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-950 text-white h-20 rounded-[2.5rem] flex items-center justify-between px-8 font-black shadow-[0_30px_60px_-10px_rgba(0,0,0,0.6)] active:scale-95 transition-all border border-white/20 animate-in slide-in-from-bottom duration-300">
                 <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-[#d4af37] rounded-2xl flex items-center justify-center relative shadow-lg">
                     <ShoppingCart size={24} className="text-slate-950" />
                   </div>
                   <div className="flex flex-col text-left">
                     <span className="text-[10px] uppercase tracking-[0.3em] opacity-60 leading-none mb-1">Total Bill</span>
                     <span className="text-xl font-serif italic">{C}{Math.round(totalAmount)}</span>
                   </div>
                 </div>
                 <div className="flex items-center space-x-4">
                   <span className="bg-[#d4af37] text-slate-950 px-3 py-1 rounded-full text-xs font-black">
                     {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items
                   </span>
                   <ChevronRight size={24} className="text-[#d4af37]" />
                 </div>
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white animate-in slide-in-from-right duration-500">
           <div className="p-8 flex items-center space-x-6 border-b border-slate-50">
             <button onClick={() => setIsCheckout(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-900 hover:bg-slate-200 transition-all"><ArrowLeft size={24} /></button>
             <h2 className="text-3xl font-bold tracking-tighter">Confirm & Pay</h2>
           </div>
           
           <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="bg-[#fdfdfd] rounded-[3.5rem] p-10 space-y-4 border border-slate-100 shadow-inner">
                 <div className="flex justify-between items-center text-slate-500">
                    <span className="text-sm font-black uppercase tracking-[0.3em]">Subtotal</span>
                    <span className="text-base font-bold">{C}{Math.round(subtotal)}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-500">
                    <span className="text-sm font-black uppercase tracking-[0.3em]">{t('tax')}</span>
                    <span className="text-base font-bold">{C}{Math.round(tax)}</span>
                 </div>
                 {serviceCharge > 0 && (
                   <div className="flex justify-between items-center text-slate-500">
                      <span className="text-sm font-black uppercase tracking-[0.3em]">{t('serviceCharge')}</span>
                      <span className="text-base font-bold">{C}{Math.round(serviceCharge)}</span>
                   </div>
                 )}
                 <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">{t('total')}</span>
                    <span className="text-4xl font-serif italic text-[#d4af37]">{C}{Math.round(totalAmount)}</span>
                 </div>
                 
                 {config && (
                    <div className="pt-4 flex flex-col space-y-3">
                       <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-black text-[10px]">¥</div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. CNY</span>
                          </div>
                          <span className="text-lg font-bold text-slate-900">¥ {totalCNY}</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-slate-100">
                          <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Coins size={14} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. USDT</span>
                          </div>
                          <span className="text-lg font-bold text-slate-900">{totalUSDT} USDT</span>
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] ml-2">{lang === 'zh' ? '支付方式' : 'Payment Method'}</p>
                <div className="grid grid-cols-1 gap-3">
                   {availablePayments.map(method => (
                      <button 
                        key={method.id} 
                        onClick={() => setSelectedPayment(method.type)} 
                        className={`p-6 rounded-[2.5rem] border-2 flex flex-col transition-all text-left ${selectedPayment === method.type ? 'border-[#d4af37] bg-amber-50/40 shadow-xl' : 'border-slate-50 hover:bg-slate-50'}`}
                      >
                         <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-5">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm text-slate-900 border border-slate-100`}>
                                  {getPaymentIcon(method.iconType)}
                               </div>
                               <span className="font-black uppercase tracking-widest text-sm text-slate-900">{method.name}</span>
                            </div>
                            {selectedPayment === method.type && <CheckCircle2 size={28} className="text-[#d4af37]" />}
                         </div>
                         {selectedPayment === method.type && method.instructions && (
                           <div className="mt-6 p-4 bg-white/60 rounded-2xl border border-amber-100 flex items-start space-x-3">
                              <Info size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">{method.instructions}</p>
                           </div>
                         )}
                      </button>
                   ))}
                </div>
              </div>
           </div>

           <div className="p-8 bg-white safe-area-bottom border-t border-slate-50 absolute bottom-0 left-0 w-full">
             <button onClick={handlePlaceOrder} disabled={isProcessing || !selectedPayment} className="w-full h-20 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] bg-slate-950 text-white shadow-2xl flex items-center justify-center space-x-4 active:scale-95 transition-all disabled:opacity-50 border border-white/10">
               {isProcessing ? <Loader2 size={24} className="animate-spin text-[#d4af37]" /> : <span>{t('processSecurePayment')}</span>}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestOrder;

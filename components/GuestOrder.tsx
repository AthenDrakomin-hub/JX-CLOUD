
import React, { useState, useMemo } from 'react';
import { Dish, Order, OrderStatus, PaymentMethod } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { 
  Plus, Minus, Globe, Search, Sparkles, Utensils,
  ChevronRight, ShoppingCart, ShieldCheck, CreditCard, Wallet,
  Smartphone, Lock, ArrowLeft, Flame, Loader2, CheckCircle2,
  Banknote, Info
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.GCASH);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = (key: keyof typeof translations.zh) => getTranslation(lang, key);
  const C = t('currency');

  const visibleDishes = useMemo(() => dishes.filter(d => d.isAvailable !== false), [dishes]);
  
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
  const tax = subtotal * 0.12; // 12% PH VAT
  const totalAmount = subtotal + tax;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500)); // 模拟网关握手
    
    const newOrder: Partial<Order> = {
      roomId,
      items: cartItems.map(item => ({
        dishId: item.dish!.id,
        name: lang === 'zh' ? item.dish!.name : (item.dish!.nameEn || item.dish!.name),
        quantity: item.quantity,
        price: item.dish!.price
      })),
      totalAmount,
      taxAmount: tax,
      status: OrderStatus.PENDING,
      paymentMethod: selectedPayment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pointsEarned: Math.floor(totalAmount / 10)
    };

    try {
      await onSubmitOrder(newOrder);
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      alert('Order Submission Failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-serif italic text-slate-900 mb-4">{lang === 'zh' ? '订单已收到！' : 'Order Received!'}</h2>
        <p className="text-slate-400 font-medium mb-12 max-w-xs mx-auto">
          {lang === 'zh' 
            ? `房间 ${roomId} 的订单已发送至厨房。${selectedPayment === PaymentMethod.CASH ? '请准备好现金以便支付。' : '请稍候片刻。'}`
            : `Your order for Room ${roomId} has been sent to the kitchen. ${selectedPayment === PaymentMethod.CASH ? 'Please have your cash ready.' : 'Please wait for delivery.'}`}
        </p>
        <button 
          onClick={() => { setIsSuccess(false); setIsCheckout(false); setCart({}); }} 
          className="px-12 py-5 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
        >
          {lang === 'zh' ? '返回菜单' : 'Back to Menu'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto relative shadow-2xl font-sans text-slate-900 overflow-hidden border-x border-slate-100">
      <div className="bg-[#0f172a] text-[8px] text-white py-1 flex items-center justify-center space-x-2 font-black uppercase tracking-[0.2em] relative z-50">
        <Lock size={10} className="text-[#d4af37]" />
        <span>JX Cloud Enterprise Gateway • SSL v3</span>
      </div>

      <header className="bg-white px-8 py-8 sticky top-0 z-40 flex items-center justify-between border-b border-slate-50 backdrop-blur-xl bg-white/90">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-[#d4af37] shadow-xl font-black text-lg italic font-serif">
            {roomId}
          </div>
          <h1 className="text-2xl font-serif italic tracking-tighter text-slate-900">{lang === 'zh' ? '云厨点餐' : 'JX Kitchen'}</h1>
        </div>
        <button onClick={onToggleLang} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-2">
          <Globe size={16} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'zh' ? 'EN' : '中'}</span>
        </button>
      </header>

      {!isCheckout ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#fcfcfc] pb-32">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors" size={16} />
              <input type="text" placeholder={t('searchDishes')} className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-full text-sm outline-none shadow-sm focus:ring-4 focus:ring-[#d4af37]/10 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>

           <div className="grid grid-cols-1 gap-12">
             {filteredDishes.map((dish, idx) => (
                <div key={dish.id} className="group animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="relative aspect-[3/2] rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
                     <img src={dish.imageUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={dish.name} />
                     {dish.isRecommended && <div className="absolute top-6 left-6 bg-[#d4af37] text-white text-[8px] font-black uppercase px-4 py-2 rounded-full shadow-2xl flex items-center"><Flame size={12} className="mr-1.5" /> Chef Pick</div>}
                  </div>
                  <div className="flex items-end justify-between px-2">
                     <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{dish.name}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-4">{dish.nameEn}</p>
                        <p className="text-2xl font-serif italic text-slate-900">{C}{dish.price}</p>
                     </div>
                     <div className="flex items-center p-1 bg-slate-900 rounded-full shadow-2xl">
                        <button onClick={() => setCart(p => ({...p, [dish.id]: Math.max(0, (p[dish.id] || 0) - 1)}))} className="w-10 h-10 flex items-center justify-center text-white/40"><Minus size={18} /></button>
                        <span className="w-8 text-center text-xs font-black text-white">{cart[dish.id] || 0}</span>
                        <button onClick={() => setCart(p => ({...p, [dish.id]: (p[dish.id] || 0) + 1}))} className="w-10 h-10 flex items-center justify-center bg-[#d4af37] text-white rounded-full"><Plus size={18} /></button>
                     </div>
                  </div>
                </div>
             ))}
           </div>
           
           {subtotal > 0 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 z-40">
               <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-950 text-white h-20 rounded-[2.5rem] flex items-center justify-between px-8 font-black shadow-2xl active:scale-95 transition-all">
                 <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-[#d4af37] rounded-2xl flex items-center justify-center relative shadow-lg">
                     <ShoppingCart size={22} className="text-slate-950" />
                   </div>
                   <span className="text-[10px] uppercase tracking-[0.3em]">{t('total')}</span>
                 </div>
                 <div className="flex items-center space-x-3">
                   <span className="text-2xl font-serif italic">{C}{totalAmount.toFixed(2)}</span>
                   <ChevronRight size={20} className="text-[#d4af37]" />
                 </div>
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white animate-in slide-in-from-right duration-500">
           <div className="p-8 flex items-center space-x-6 border-b border-slate-50">
             <button onClick={() => setIsCheckout(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-900"><ArrowLeft size={24} /></button>
             <h2 className="text-3xl font-bold tracking-tighter">{t('payNow')}</h2>
           </div>
           
           <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="bg-[#fdfdfd] rounded-[3.5rem] p-10 space-y-6 border border-slate-50 shadow-inner">
                 <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Subtotal</span>
                    <span className="text-sm font-bold">{C}{subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('tax')}</span>
                    <span className="text-sm font-bold">{C}{tax.toFixed(2)}</span>
                 </div>
                 <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">{t('total')}</span>
                    <span className="text-4xl font-serif italic text-[#d4af37]">{C}{totalAmount.toFixed(2)}</span>
                 </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">{lang === 'zh' ? '支付方式' : 'Payment Method'}</p>
                <div className="grid grid-cols-1 gap-3 pb-8">
                   {[
                      { id: PaymentMethod.CASH, label: t('cash'), icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { id: PaymentMethod.GCASH, label: 'GCash', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { id: PaymentMethod.MAYA, label: 'Maya', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                      { id: PaymentMethod.CARD, label: 'Credit Card', icon: CreditCard, color: 'text-slate-900', bg: 'bg-slate-100' }
                   ].map(method => (
                      <button 
                        key={method.id} 
                        onClick={() => setSelectedPayment(method.id as PaymentMethod)} 
                        className={`p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all ${selectedPayment === method.id ? 'border-[#d4af37] bg-amber-50/20' : 'border-slate-50'}`}
                      >
                         <div className="flex items-center space-x-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method.bg} ${method.color}`}><method.icon size={24} /></div>
                            <span className="font-black uppercase tracking-widest text-xs text-slate-900">{method.label}</span>
                         </div>
                         {selectedPayment === method.id && <ShieldCheck size={20} className="text-[#d4af37]" />}
                      </button>
                   ))}
                </div>

                {selectedPayment === PaymentMethod.CASH && (
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start space-x-4 animate-in slide-in-from-top-2">
                      <Info size={18} className="text-[#d4af37] mt-1 shrink-0" />
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">{t('cashNote')}</p>
                   </div>
                )}
              </div>
           </div>

           <div className="p-8 bg-white safe-area-bottom border-t border-slate-50">
             <div className="flex items-center justify-center space-x-3 mb-6 opacity-40">
                <Lock size={12} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t('gatewayEncrypt')}</span>
             </div>
             <button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full h-20 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] bg-slate-950 text-white shadow-2xl flex items-center justify-center space-x-4 active:scale-95 transition-all disabled:opacity-50">
               {isProcessing ? <Loader2 size={24} className="animate-spin text-[#d4af37]" /> : <span>{t('processSecurePayment')}</span>}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestOrder;

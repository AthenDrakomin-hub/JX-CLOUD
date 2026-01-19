
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Dish, Order, OrderStatus, Category, PaymentMethodConfig } from '../types';
import { Language, getTranslation } from '../translations';
import { api } from '../services/api';
import { 
  Plus, Minus, Globe, Search,
  ChevronRight, ShoppingCart, 
  Loader2, CheckCircle2,
  ArrowLeft, CreditCard, Sparkles,
  Check, ChevronLeft,
  UtensilsCrossed, ScanLine
} from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface GuestOrderProps {
  roomId: string;
  dishes: Dish[];
  categories?: Category[];
  onSubmitOrder: (order: Partial<Order>) => Promise<void>;
  lang: Language;
  onToggleLang: () => void;
  onRescan: () => void;
}

const GuestOrder: React.FC<GuestOrderProps> = ({ 
  roomId, dishes = [], categories = [], onSubmitOrder, lang, onToggleLang, onRescan
}) => {
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [isCheckout, setIsCheckout] = useState(false);
  const [isPaymentDetails, setIsPaymentDetails] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availablePayments, setAvailablePayments] = useState<PaymentMethodConfig[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  const [paymentProof, setPaymentProof] = useState('');

  const t = useCallback((key: string, params?: any) => getTranslation(lang, key, params), [lang]);

  useEffect(() => {
    api.payments.getAll().then(pAll => {
      const active = pAll.filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
      setAvailablePayments(active);
      if (active.length > 0) setSelectedPaymentId(active[0].id);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategoryId]);

  const filteredDishes = useMemo(() => {
    return (dishes || []).filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchCat = true;
      if (activeCategoryId !== 'All') {
        const cat = categories.find(c => c.id === activeCategoryId);
        if (cat?.level === 1) {
          const subs = categories.filter(c => c.parentId === activeCategoryId).map(c => c.id);
          matchCat = d.categoryId === activeCategoryId || subs.includes(d.categoryId);
        } else {
          matchCat = d.categoryId === activeCategoryId;
        }
      }
      return matchSearch && matchCat && d.isAvailable;
    });
  }, [dishes, searchTerm, activeCategoryId, categories]);

  const paginatedDishes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDishes.slice(start, start + pageSize);
  }, [filteredDishes, currentPage]);

  const totalPages = Math.ceil(filteredDishes.length / pageSize);

  const totalAmount = useMemo(() => 
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const dish = dishes.find(d => d.id === id);
      return sum + (dish ? dish.price * (qty as number) : 0);
    }, 0)
  , [cart, dishes]);

  const cartTotalItems = useMemo(() => 
    Object.values(cart).reduce((a, b) => (a as number) + (b as number), 0)
  , [cart]);

  const handleFinalSubmit = async () => {
    if (!selectedPaymentId) return;
    setIsProcessing(true);
    try {
      await onSubmitOrder({ 
        tableId: roomId, 
        items: Object.entries(cart).filter(([_, q]) => (q as number) > 0).map(([id, q]) => {
          const d = dishes.find(x => x.id === id)!;
          return { dishId: id, name: lang === 'zh' ? d.name : (d.nameEn || d.name), quantity: q as number, price: d.price, partnerId: d.partnerId };
        }), 
        totalAmount: totalAmount, 
        status: OrderStatus.PENDING, 
        paymentMethod: selectedPaymentId, 
        paymentProof: paymentProof,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsSuccess(true);
    } catch (err) {
      alert(t('error'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
         <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] mb-8 animate-bounce">
            <CheckCircle2 size={48} />
         </div>
         <h2 className="text-3xl font-black text-slate-900 tracking-tight">{lang === 'zh' ? '订单已成功发送' : 'Order Placed!'}</h2>
         <p className="text-slate-500 mt-2 font-medium max-w-[240px] leading-relaxed">
            {lang === 'zh' ? '主厨已收到您的点餐，请在桌位稍候。' : 'Kitchen has received your order. Please wait at your station.'}
         </p>
         <div className="mt-12 space-y-4 w-full max-w-xs">
            <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl active-scale transition-all">
                {lang === 'zh' ? '继续加菜' : 'Order More Dishes'}
            </button>
            <button onClick={onRescan} className="w-full py-5 bg-white border border-slate-200 text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">
                {lang === 'zh' ? '返回主页' : 'Return to Home'}
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto font-sans text-slate-900 pb-32 relative overflow-x-hidden">
      <header className="px-6 py-4 sticky top-0 z-[60] bg-white/90 backdrop-blur-xl flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 text-blue-500 rounded-[1rem] flex items-center justify-center font-black italic shadow-lg">{roomId}</div>
          <div>
            <h1 className="text-sm font-black tracking-tighter leading-none">JX CLOUD</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onToggleLang} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 transition-all active:scale-95">
                <Globe size={18} />
            </button>
            <button onClick={onRescan} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 transition-all active:scale-95">
                <ScanLine size={18} />
            </button>
        </div>
      </header>

      {!isCheckout ? (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="p-4 space-y-6">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder={lang === 'zh' ? '搜索美味佳肴...' : 'Search delicious dishes...'}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.75rem] text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                 <button onClick={() => setActiveCategoryId('All')} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${activeCategoryId === 'All' ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {lang === 'zh' ? '全部' : 'All'}
                 </button>
                 {categories.filter(c => c.level === 1).map(cat => (
                   <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${activeCategoryId === cat.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {lang === 'zh' ? cat.name : (cat.nameEn || cat.name)}
                   </button>
                 ))}
              </div>

              <div className="space-y-4">
                {paginatedDishes.length > 0 ? paginatedDishes.map(dish => (
                  <div key={dish.id} className="bg-white border border-slate-100 p-4 rounded-[2rem] flex gap-4 transition-all hover:shadow-lg active:scale-[0.98] group">
                    <div className="w-24 h-24 rounded-[1.5rem] bg-slate-100 overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                      <OptimizedImage src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <div className="flex items-start justify-between">
                            <h3 className="font-black text-slate-900 text-base truncate pr-2">{lang === 'zh' ? dish.name : (dish.nameEn || dish.name)}</h3>
                            {dish.isRecommended && <div className="p-1 bg-amber-50 text-amber-500 rounded-md"><Sparkles size={12} fill="currentColor" /></div>}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="space-y-0.5">
                            <span className="text-blue-600 font-black text-xl tracking-tighter">₱{dish.price}</span>
                        </div>
                        <div className="flex items-center bg-slate-50 rounded-[1rem] border border-slate-200 p-1 shadow-sm">
                           {(cart[dish.id] || 0) > 0 && (
                             <>
                               <button onClick={() => setCart(p => ({...p, [dish.id]: Math.max(0, (p[dish.id] || 0)-1)}))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><Minus size={14}/></button>
                               <span className="w-6 text-center text-xs font-black text-slate-900">{cart[dish.id]}</span>
                             </>
                           )}
                           <button onClick={() => setCart(p => ({...p, [dish.id]: (p[dish.id]||0)+1}))} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-[0.75rem] shadow-md transition-all active:scale-90"><Plus size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-200 opacity-50 space-y-4">
                        <UtensilsCrossed size={64} className="stroke-[1px]" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">{lang === 'zh' ? '当前分类暂无供应' : 'No Supply in Category'}</p>
                    </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 pt-6 pb-12 border-t border-slate-50">
                  <button onClick={() => { setCurrentPage(p => Math.max(1, p-1)); window.scrollTo(0,0); }} disabled={currentPage === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 disabled:opacity-20 text-slate-600 transition-all">
                    <ChevronLeft size={20}/>
                  </button>
                  <span className="text-[11px] font-bold text-slate-600">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p+1)); window.scrollTo(0,0); }} disabled={currentPage === totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 disabled:opacity-20 text-slate-600 transition-all">
                    <ChevronRight size={20}/>
                  </button>
                </div>
              )}
           </div>
           
           {totalAmount > 0 && (
             <div className="fixed bottom-8 left-6 right-6 z-[70] animate-in slide-in-from-bottom-10">
               <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-950 text-white h-20 rounded-[1.75rem] flex items-center justify-between px-8 font-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all ring-4 ring-white/10">
                 <div className="flex items-center space-x-4">
                   <div className="relative">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                        <ShoppingCart size={20} className="text-blue-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-black border-2 border-slate-950">
                         {cartTotalItems}
                      </div>
                   </div>
                   <div className="text-left">
                        <span className="text-[9px] uppercase text-slate-400 tracking-widest">{lang === 'zh' ? '预计消费' : 'Est. Total'}</span>
                        <br/>
                        <span className="text-2xl font-serif italic text-white tracking-tight">₱{totalAmount}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-blue-400">
                    <span className="text-[10px] tracking-[0.2em] font-black uppercase">{lang === 'zh' ? '去结算' : 'CHECKOUT'}</span>
                    <ChevronRight size={20} />
                 </div>
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 p-6 animate-in slide-in-from-right-10 duration-500 bg-slate-50/50">
           <button onClick={() => setIsCheckout(false)} className="mb-8 flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">
             <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white"><ArrowLeft size={14} /></div>
             {lang === 'zh' ? '返回菜单' : 'Back to Menu'}
           </button>

           <h2 className="text-4xl font-black mb-8 tracking-tighter uppercase">{lang === 'zh' ? '确认订单' : 'Order Audit'}</h2>
           
           <div className="bg-white p-8 rounded-[2.5rem] mb-10 shadow-sm border border-slate-100">
              <div className="flex justify-between items-end font-black text-2xl mb-8 border-b border-slate-50 pb-8 uppercase">
                <div>
                    <p className="text-[9px] text-slate-400 mb-1 tracking-widest">Total Bill</p>
                    <span className="text-blue-600 font-serif italic text-4xl leading-none">₱{totalAmount}</span>
                </div>
              </div>
              <div className="space-y-5">
                 {Object.entries(cart).filter(([_, q]) => (q as number) > 0).map(([id, q]) => (
                   <div key={id} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300">x{q}</div>
                        <span className="text-sm font-bold text-slate-700">{lang === 'zh' ? dishes.find(d => d.id === id)?.name : dishes.find(d => d.id === id)?.nameEn}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-400">₱{(dishes.find(d => d.id === id)?.price || 0) * (q as number)}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           {!isPaymentDetails ? (
             <button onClick={() => setIsPaymentDetails(true)} className="w-full py-6 bg-slate-950 text-white rounded-[1.75rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all active-scale">
                {lang === 'zh' ? '选择支付方式' : 'Select Payment Strategy'}
             </button>
           ) : (
             <div className="space-y-8 animate-in duration-500">
                <div className="grid grid-cols-1 gap-4">
                   {availablePayments.map(p => (
                     <button key={p.id} onClick={() => setSelectedPaymentId(p.id)} className={`p-6 rounded-[1.75rem] border-2 flex items-center justify-between transition-all group ${selectedPaymentId === p.id ? 'border-blue-600 bg-blue-50 ring-8 ring-blue-500/5' : 'border-white bg-white hover:border-slate-100 shadow-sm'}`}>
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-active:scale-90 ${selectedPaymentId === p.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><CreditCard size={20} /></div>
                           <div className="text-left"><p className="font-black text-sm uppercase tracking-tight">{lang === 'zh' ? p.name : p.nameEn}</p></div>
                        </div>
                        {selectedPaymentId === p.id ? <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div> : <div className="w-6 h-6 rounded-full border-2 border-slate-100" />}
                     </button>
                   ))}
                </div>
                <div className="space-y-4">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">{lang === 'zh' ? '支付凭证 / 留言' : 'Proof of Payment / Note'}</p>
                   <input value={paymentProof} onChange={e => setPaymentProof(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:border-blue-600 font-bold text-sm shadow-sm transition-all" placeholder={lang === 'zh' ? '如已转账，请输入流水号或备注...' : 'Enter TxID or Table Note...'} />
                </div>
                <button onClick={handleFinalSubmit} disabled={isProcessing || !selectedPaymentId} className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 active-scale-95 disabled:opacity-30 transition-all">
                   {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={20} /><span>{lang === 'zh' ? '立即提交下单' : 'DEPOY ORDER'}</span></>}
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default GuestOrder;

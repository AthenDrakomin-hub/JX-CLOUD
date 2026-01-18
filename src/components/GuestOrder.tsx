
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dish, Order, OrderStatus, Category, PaymentMethodConfig } from '../types';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api-client';
import { 
  Plus, Minus, Globe, Search,
  ChevronRight, ShoppingCart, 
  Loader2, CheckCircle2,
  ArrowLeft, CreditCard, Sparkles,
  Copy, Check, Image as ImageIcon, ChevronLeft
} from 'lucide-react';
import OptimizedImage from './OptimizedImage';

// 复制按钮组件
const CopyToClipboardButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <button
      onClick={copyToClipboard}
      className={`p-2 rounded-lg ${copied ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-700'} transition-colors`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

interface GuestOrderProps {
  roomId: string;
  dishes: Dish[];
  categories?: Category[];
  onSubmitOrder: (order: Partial<Order>) => Promise<void>;
  lang?: Language;
  onToggleLang?: () => void;
  onRescan: () => void;
}

const GuestOrder: React.FC<GuestOrderProps> = ({ 
  roomId, dishes = [], categories = [], onSubmitOrder, lang, onToggleLang
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
  const pageSize = 8;
  
  const [paymentProof, setPaymentProof] = useState('');

  const { t, i18n } = useTranslation();

  useEffect(() => {
    api.payments.getAll().then(pAll => {
      const active = pAll.filter(p => p.isActive).sort((a, b) => a.sort_order - b.sort_order);
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
                          (d.name_en || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchCat = true;
      if (activeCategoryId !== 'All') {
        const cat = categories.find(c => c.id === activeCategoryId);
        if (cat?.level === 1) {
          const subs = categories.filter(c => c.parent_id === activeCategoryId).map(c => c.id);
          matchCat = d.category === activeCategoryId || subs.includes(d.category);
        } else {
          matchCat = d.category === activeCategoryId;
        }
      }
      return matchSearch && matchCat && d.is_available;
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

  const handleFinalSubmit = async () => {
    if (!selectedPaymentId) return;
    setIsProcessing(true);
    try {
      // 根据支付方式设置订单状态
      let orderStatus: OrderStatus = OrderStatus.PENDING;
      
      // 如果是现金支付，设置为已确认未付款状态
      if (selectedPaymentId === 'cash_php') {
        orderStatus = 'confirmed_unpaid' as OrderStatus;
      }
      
      await onSubmitOrder({ 
        roomId, 
        items: Object.entries(cart).filter(([_, q]) => (q as number) > 0).map(([id, q]) => {
          const d = dishes.find(x => x.id === id)!;
          return { dishId: id, name: lang === 'zh' ? d.name : (d.name_en || d.name), quantity: q as number, price: d.price, partnerId: d.partnerId };
        }), 
        totalAmount: totalAmount, 
        status: orderStatus, 
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
         <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl mb-8 animate-bounce"><CheckCircle2 size={48} /></div>
         <h2 className="text-3xl font-black text-slate-950 uppercase">{t('guest_order_issued')}</h2>
         <p className="text-sm text-slate-400 mt-2 font-medium">{t('guest_kitchen_wait')}</p>
         <button onClick={() => window.location.reload()} className="mt-12 w-full max-w-xs py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest">{t('guest_order_more')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto font-sans text-slate-900 pb-32">
      <header className="px-6 py-5 sticky top-0 z-[60] bg-white/80 backdrop-blur-md flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-blue-500 font-black italic">{roomId}</div>
          <h1 className="text-lg font-black tracking-tighter">JX CLOUD</h1>
        </div>
        <button onClick={onToggleLang} className="px-3 h-9 bg-slate-100 rounded-lg text-slate-900 font-bold text-[10px] flex items-center gap-1.5 uppercase">
          <Globe size={14} /> {lang === 'zh' ? 'English' : '中文'}
        </button>
      </header>

      {!isCheckout ? (
        <div className="flex-1">
           <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder={t('search_dishes')}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                 <button onClick={() => setActiveCategoryId('All')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategoryId === 'All' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{t('all_cats')}</button>
                 {categories.filter(c => c.level === 1).map(cat => (
                   <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategoryId === cat.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{lang === 'zh' ? cat.name : (cat.name_en || cat.name)}</button>
                 ))}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {paginatedDishes.map(dish => (
                  <div key={dish.id} className="bg-slate-50 p-4 rounded-3xl flex gap-4 transition-all hover:shadow-md active:scale-[0.98]">
                    <div className="w-24 h-24 rounded-2xl bg-white p-1 overflow-hidden shrink-0 border border-slate-100">
                      <OptimizedImage src={dish.image_url} alt={dish.name} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">{lang === 'zh' ? dish.name : (dish.name_en || dish.name)}</h3>
                        {dish.description && <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{dish.description}</p>}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-blue-600 font-black text-lg">₱{dish.price.toFixed(2)}</span>
                        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                           {cart[dish.id] > 0 && (
                             <>
                               <button onClick={() => setCart(p => ({...p, [dish.id]: Math.max(0, p[dish.id]-1)}))} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus size={14}/></button>
                               <span className="w-6 text-center text-xs font-black">{cart[dish.id]}</span>
                             </>
                           )}
                           <button onClick={() => setCart(p => ({...p, [dish.id]: (p[dish.id]||0)+1}))} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg"><Plus size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 disabled:opacity-30"><ChevronLeft size={18}/></button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('page_info', { current: currentPage, total: totalPages })}
                  </span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 disabled:opacity-30"><ChevronRight size={18}/></button>
                </div>
              )}

              {filteredDishes.length === 0 && (
                <div className="py-20 text-center opacity-30">
                   <p className="text-xs font-black uppercase tracking-widest">{t('noData')}</p>
                </div>
              )}
           </div>
           
           {totalAmount > 0 && (
             <div className="fixed bottom-6 left-4 right-4 z-[70] animate-in slide-in-from-bottom-10">
               <button onClick={() => setIsCheckout(true)} className="w-full bg-slate-950 text-white h-18 rounded-2xl flex items-center justify-between px-6 font-black shadow-2xl active-scale">
                 <div className="flex items-center space-x-3">
                   <div className="relative">
                      <ShoppingCart size={18} />
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full text-[8px] flex items-center justify-center">
                         {Object.values(cart).reduce((a, b) => (a as number) + (b as number), 0)}
                      </div>
                   </div>
                   <div className="text-left"><span className="text-[8px] uppercase text-slate-400">{t('bill_total')}</span><br/><span className="text-lg font-serif italic">₱{totalAmount.toFixed(2)}</span></div>
                 </div>
                 <div className="flex items-center gap-1.5 text-blue-400"><span className="text-[9px] tracking-widest uppercase">{t('checkout')}</span><ChevronRight size={18} /></div>
               </button>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 p-6">
           <button onClick={() => setIsCheckout(false)} className="mb-6 flex items-center gap-2 text-slate-400 font-bold text-sm uppercase"><ArrowLeft size={18} /> {t('back')}</button>
           <h2 className="text-2xl font-black mb-6 uppercase">{t('guest_checkout_title')}</h2>
           <div className="bg-slate-50 p-6 rounded-3xl mb-8">
              <div className="flex justify-between font-black text-xl mb-4 border-b pb-4 uppercase"><span>{t('bill_total')}</span><span className="text-blue-600 font-serif">₱{totalAmount}</span></div>
              <div className="space-y-3">
                 {Object.entries(cart).filter(([_, q]) => (q as number) > 0).map(([id, q]) => (
                   <div key={id} className="flex justify-between text-sm font-bold text-slate-600">
                      <span>{lang === 'zh' ? dishes.find(d => d.id === id)?.name : dishes.find(d => d.id === id)?.name_en} x {q}</span>
                      <span>₱{((dishes.find(d => d.id === id)?.price || 0) * (q as number)).toFixed(2)}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           {!isPaymentDetails ? (
             <button onClick={() => setIsPaymentDetails(true)} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">{t('select_payment')}</button>
           ) : (
             <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                   {availablePayments.map(p => (
                     <div key={p.id} className="space-y-2">
                       <button 
                          onClick={() => setSelectedPaymentId(p.id)}
                          className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedPaymentId === p.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                       >
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPaymentId === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <CreditCard size={18} />
                             </div>
                             <div className="text-left">
                                <p className="font-black text-sm">{lang === 'zh' ? p.name : p.name_en}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{p.currency}</p>
                             </div>
                          </div>
                          {selectedPaymentId === p.id && <CheckCircle2 size={18} className="text-blue-600" />}
                       </button>
                       
                       {/* GCash 二维码显示 */}
                       {selectedPaymentId === p.id && p.paymentType === 'digital' && p.walletAddress && (
                         <div className="bg-white p-4 rounded-xl border border-slate-200">
                           <div className="flex items-center justify-between mb-2">
                             <p className="text-sm font-bold text-slate-700">扫描支付</p>
                             <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">QR Code</span>
                           </div>
                           
                           {p.qr_url && (
                             <div className="flex flex-col items-center mb-3">
                               <div className="bg-white p-2 rounded-lg border border-slate-200 mb-2">
                                 <img 
                                   src={p.qr_url} 
                                   alt={`${p.name} QR Code`} 
                                   className="w-40 h-40 object-contain"
                                   onError={(e) => {
                                     const target = e.target as HTMLImageElement;
                                     target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%2364748b">QR Code</text></svg>`;
                                   }}
                                 />
                               </div>
                               <p className="text-xs text-slate-500 text-center">打开 {p.name} 扫描上方二维码</p>
                             </div>
                           )}
                           
                           {/* 钱包地址显示和复制功能 */}
                           <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                             <div>
                               <p className="text-xs text-slate-500">钱包地址</p>
                               <p className="font-mono font-bold break-all">{p.walletAddress}</p>
                             </div>
                             <CopyToClipboardButton text={p.walletAddress} />
                           </div>
                         </div>
                       )}
                       
                       {/* USDT 汇率显示 */}
                       {selectedPaymentId === p.id && p.id === 'usdt_trc20' && (
                         <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                           <p className="text-xs text-amber-800 font-bold mb-1">汇率参考</p>
                           <p className="text-sm">
                             ₱{totalAmount.toFixed(2)} ≈ {(totalAmount / (p.exchangeRate || 54.5)).toFixed(2)} USDT
                           </p>
                           <p className="text-xs text-amber-600">汇率: 1 USDT = ₱{p.exchangeRate || 54.5}</p>
                         </div>
                       )}
                     </div>
                   ))}
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('guest_proof_required')}</p>
                   <input 
                     value={paymentProof}
                     onChange={e => setPaymentProof(e.target.value)}
                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white font-bold text-sm"
                     placeholder={t('proof_placeholder')}
                   />
                </div>

                <button 
                  onClick={handleFinalSubmit}
                  disabled={isProcessing || !selectedPaymentId}
                  className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active-scale disabled:opacity-50"
                >
                   {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                   <span>{t('submit')}</span>
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default GuestOrder;

import React, { useState, useMemo, useCallback } from 'react';
import { HotelRoom, Dish, Order, OrderStatus, PaymentMethod, RoomStatus, Category } from '../types';
import { 
  QrCode, Printer, X, ShoppingCart, Plus, Minus, Search, Loader2, Sparkles, MonitorPlay, ChevronRight, Utensils
} from 'lucide-react';
import { Language, getTranslation } from '../translations';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';

interface RoomGridProps {
  rooms: HotelRoom[];
  dishes: Dish[];
  categories: Category[];
  onUpdateRoom: (room: HotelRoom) => void;
  onRefresh: () => void;
  lang: Language;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, dishes, categories = [], onUpdateRoom, onRefresh, lang }) => {
  const [activeRoom, setActiveRoom] = useState<HotelRoom | null>(null);
  const [viewMode, setViewMode] = useState<'options' | 'qr' | 'manualOrder' | 'bulkPrint' | null>(null);
  
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);
  
  const filteredDishes = useMemo(() => {
    return (dishes || []).filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (d.name_en || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      
      let matchCategory = false;
      if (activeCategoryId === 'All') {
        matchCategory = true;
      } else {
        const targetCat = categories.find(c => c.id === activeCategoryId);
        if (targetCat?.level === 1) {
          const subCatIds = categories.filter(c => c.parent_id === activeCategoryId).map(c => c.id);
          matchCategory = d.category === activeCategoryId || subCatIds.includes(d.category);
        } else {
          matchCategory = d.category === activeCategoryId;
        }
      }
      return matchSearch && matchCategory && d.is_available !== false;
    });
  }, [dishes, searchTerm, activeCategoryId, categories]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([id, qty]) => {
        const dish = (dishes || []).find(d => d.id === id);
        return { dish, quantity: qty as number };
      })
      .filter(item => item.dish !== undefined);
  }, [cart, dishes]);

  const subtotal = useMemo(() => 
    cartItems.reduce((acc, item) => acc + (item.dish!.price * item.quantity), 0)
  , [cartItems]);

  const getQRUrl = (id: string) => `${window.location.origin}${window.location.pathname}?room=${id}`;

  const closeModal = () => {
    setActiveRoom(null);
    setViewMode(null);
    setCart({});
    setSearchTerm('');
    setActiveCategoryId('All');
  };

  const handleManualOrderSubmit = async () => {
    if (!activeRoom || cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const order: Order = {
        id: `manual-${Date.now()}`,
        roomId: activeRoom.id,
        items: cartItems.map(item => ({
          dishId: item.dish!.id,
          name: item.dish!.name,
          quantity: item.quantity,
          price: item.dish!.price,
          partnerId: item.dish!.partnerId
        })),
        totalAmount: Math.round(subtotal),
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.CASH_PHP,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await api.orders.create(order);
      await onUpdateRoom({ ...activeRoom, status: RoomStatus.ORDERING });
      closeModal();
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium no-print">
        <div className="flex items-center space-x-4">
           <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-inner border border-blue-200 dark:border-blue-800"><MonitorPlay size={20} /></div>
           <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{t('stationManagement')}</h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Real-time Space Registry</p>
           </div>
        </div>
        <button onClick={() => setViewMode('bulkPrint')} className="px-6 h-11 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active-scale flex items-center space-x-2 shadow-md"><Printer size={16} /><span>{t('generateAllQR')}</span></button>
      </div>

      <div className="no-print space-y-8">
        {useMemo(() => {
          const floors = Array.from(new Set((rooms || []).map(r => (r.id || '').substring(0, 2)))).sort();
          return floors.map((floor) => (
            <div key={floor} className="space-y-4 animate-fade-up">
              <div className="flex items-center space-x-3 px-1">
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{t('zone')} {floor}</span>
                 <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {(rooms || []).filter(r => (r.id || '').startsWith(floor)).map((room) => (
                  <div key={room.id} className="group relative">
                    <div 
                      className={`relative w-full aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 active-scale cursor-pointer 
                        ${room.status === 'ordering' 
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 shadow-md' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg'}`} 
                      onClick={() => { setActiveRoom(room); setViewMode('options'); }}
                    >
                      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${room.status === 'ordering' ? 'bg-amber-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-500 group-hover:scale-110 border 
                        ${room.status === 'ordering' 
                          ? 'bg-amber-100 dark:bg-amber-800/40 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500'}`}>
                        {room.status === 'ordering' ? <ShoppingCart size={18} /> : <QrCode size={18} />}
                      </div>

                      <div className="text-center">
                         <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none block">
                           {room.id || 'N/A'}
                         </span>
                         <p className={`text-[9px] uppercase font-black mt-1 tracking-widest ${room.status === 'ordering' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-slate-600'}`}>
                           {room.status === 'ordering' ? (lang === 'zh' ? '服务中' : 'Active') : t('ready')}
                         </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        }, [rooms, t, lang])}
      </div>

      {activeRoom && viewMode === 'manualOrder' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 no-print">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in" onClick={closeModal} />
          <div className="relative w-full h-full lg:h-[95vh] lg:max-w-[95vw] bg-white dark:bg-slate-950 lg:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-2 border-slate-300 dark:border-slate-800 animate-in slide-in-from-bottom-10">
             <div className="px-8 py-6 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-30">
                <div className="flex items-center space-x-6">
                   <div className="w-16 h-16 bg-slate-950 text-[#d4af37] rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border-2 border-white dark:border-slate-800">{activeRoom.id}</div>
                   <div><h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{t('manualOrder')}</h3><div className="flex items-center space-x-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('station_pos_terminal')}</span><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /></div></div>
                </div>
                <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-950 dark:hover:text-white rounded-xl transition-all"><X size={24} /></button>
             </div>
             {/* 内部点餐逻辑保持不变，但容器增加了深色适配 */}
             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden min-w-0 border-r border-slate-200 dark:border-slate-800">
                   <div className="p-6 space-y-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder={t('search')} className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:text-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                         <button onClick={() => setActiveCategoryId('All')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategoryId === 'All' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{lang === 'zh' ? '全部' : 'All'}</button>
                         {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeCategoryId === cat.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{lang === 'zh' ? cat.name : (cat.name_en || cat.name)}</button>
                         ))}
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                         {filteredDishes.map((dish) => {
                            const inCart = cart[dish.id] || 0;
                            return (
                               <div key={dish.id} className={`relative bg-white dark:bg-slate-900 p-3 rounded-3xl border-2 transition-all cursor-pointer group shadow-sm active-scale flex flex-col ${inCart > 0 ? 'border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-300'}`} onClick={() => setCart(p => ({...p, [dish.id]: (p[dish.id] || 0) + 1}))}>
                                  {inCart > 0 && <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg border-2 border-white dark:border-slate-900 z-10">{inCart}</div>}
                                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-800 border border-slate-50 dark:border-slate-800"><img src={dish.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={dish.name} /></div>
                                  <div className="space-y-1 flex-1"><h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate leading-tight">{lang === 'zh' ? dish.name : (dish.name_en || dish.name)}</h4><p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">₱{Math.round(dish.price)}</p></div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                </div>
                {/* 购物车面板保持原有深色适配逻辑 */}
                <div className="w-full lg:w-[450px] bg-white dark:bg-slate-900 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                       <ShoppingCart size={18} className="text-blue-600" />
                       <span className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white">{t('orderSummary')}</span>
                     </div>
                     <button onClick={() => setCart({})} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all">{t('clear')}</button>
                   </div>
                   <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                      {cartItems.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-60"><ShoppingCart size={48} className="mb-4 opacity-10" /><p className="text-[10px] font-black uppercase tracking-widest">{t('emptyCart')}</p></div> : 
                        cartItems.map((item, i) => (
                               <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-right-4 transition-all">
                                  <div className="flex-1 min-w-0 pr-4"><p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{lang === 'zh' ? item.dish?.name : (item.dish?.name_en || item.dish?.name)}</p><p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">₱{Math.round(item.dish!.price)}</p></div>
                                  <div className="flex items-center space-x-3 bg-white dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <button onClick={(e) => { e.stopPropagation(); setCart(p => ({...p, [item.dish!.id]: Math.max(0, p[item.dish!.id] - 1)})); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><Minus size={14} /></button>
                                    <span className="text-xs font-black w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setCart(p => ({...p, [item.dish!.id]: p[item.dish!.id] + 1})); }} className="w-8 h-8 flex items-center justify-center bg-slate-900 dark:bg-slate-600 text-white rounded-lg shadow-md transition-all"><Plus size={14} /></button>
                                  </div>
                               </div>
                        ))}
                   </div>
                   <div className="p-8 bg-slate-950 text-white space-y-6">
                      <div className="space-y-2"><div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em]"><span className="text-slate-400">{t('totalBill')}</span><span className="text-3xl font-serif italic text-[#d4af37]">₱{Math.round(subtotal)}</span></div></div>
                      <button onClick={handleManualOrderSubmit} disabled={isSubmitting || cartItems.length === 0} className="w-full h-18 bg-[#d4af37] text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center space-x-3 active-scale transition-all hover:bg-white disabled:opacity-20">{isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={18} /><span>{t('placeOrder')}</span></>}</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 弹窗部分增加 dark:bg-slate-900 适配 */}
      {activeRoom && viewMode === 'options' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-800 animate-in zoom-in-95">
             <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div><h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('station')} {activeRoom.id}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('space_registry_node')}</p></div>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700"><X size={20} /></button>
             </div>
             <div className="p-8 space-y-4">
                <button onClick={() => setViewMode('qr')} className="w-full p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-3xl flex items-center justify-between group active-scale transition-all border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><QrCode size={24} /></div>
                    <div className="text-left"><p className="font-bold text-sm leading-tight">{t('guestQRCode')}</p><p className="text-[9px] opacity-40 uppercase tracking-widest">{t('displayQRDesc')}</p></div>
                  </div>
                  <ChevronRight size={20} />
                </button>
                <button onClick={() => setViewMode('manualOrder')} className="w-full p-6 bg-blue-600 text-white rounded-3xl flex items-center justify-between group active-scale transition-all border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Plus size={24} /></div>
                    <div className="text-left"><p className="font-bold text-sm leading-tight">{t('manualOrder')}</p><p className="text-[9px] opacity-40 uppercase tracking-widest">{t('staff_operated_desc')}</p></div>
                  </div>
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>
      )}

      {activeRoom && viewMode === 'qr' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in" onClick={closeModal} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl overflow-hidden border border-white dark:border-slate-800 p-10 text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-20">
             <div className="space-y-2">
               <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 mb-2"><Sparkles size={14} /><span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('digital_table_access')}</span></div>
               <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{t('station')} {activeRoom.id}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('displayQRDesc')}</p>
             </div>
             <div className="p-10 bg-white rounded-[3rem] shadow-inner inline-block border-4 border-slate-50 dark:border-slate-800">
               <QRCodeSVG value={getQRUrl(activeRoom.id)} size={200} level="H" />
             </div>
             <div className="space-y-4">
               <button onClick={() => window.print()} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active-scale transition-all"><Printer size={16} /><span>{t('printTicket')}</span></button>
               <button onClick={closeModal} className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-950 dark:hover:text-white transition-colors">{t('cancel')}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomGrid;
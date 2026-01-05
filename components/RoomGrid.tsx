
import React, { useState, useMemo, useEffect } from 'react';
import { HotelRoom, Dish, Order, OrderStatus, PaymentMethod, RoomStatus } from '../types';
import { 
  QrCode, Printer, Copy, Check, X,
  ShoppingCart, ArrowRight, Plus, Minus, Search, Loader2,
  Sparkles, MonitorPlay, ChevronRight, Tag, Utensils,
  History, CreditCard, Banknote
} from 'lucide-react';
import { translations, Language } from '../translations';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';

interface RoomGridProps {
  rooms: HotelRoom[];
  dishes: Dish[];
  onUpdateRoom: (room: HotelRoom) => void;
  onRefresh: () => void;
  isSyncing?: boolean;
  lang: Language;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, dishes, onUpdateRoom, onRefresh, lang }) => {
  const [activeRoom, setActiveRoom] = useState<HotelRoom | null>(null);
  const [viewMode, setViewMode] = useState<'options' | 'qr' | 'manualOrder' | 'bulkPrint' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [cart, setCart] = useState<{ [dishId: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  useEffect(() => {
    if (viewMode === 'manualOrder') {
      api.categories.getAll().then(setDynamicCategories);
    }
  }, [viewMode]);

  const floors = useMemo(() => {
    return Array.from(new Set((rooms || []).map(r => (r.id || '').substring(0, 2)))).sort();
  }, [rooms]);

  const filteredDishes = useMemo(() => {
    return (dishes || []).filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (d.nameEn || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      return matchSearch && matchCategory && d.isAvailable !== false;
    });
  }, [dishes, searchTerm, activeCategory]);

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

  const totalAmount = subtotal * 1.12;

  const getQRUrl = (id: string) => `${window.location.origin}${window.location.pathname}?room=${id}`;

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getQRUrl(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const closeModal = () => {
    setActiveRoom(null);
    setViewMode(null);
    setCart({});
    setSearchTerm('');
    setActiveCategory('All');
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
        totalAmount: Math.round(totalAmount),
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        taxAmount: Math.round(subtotal * 0.12)
      };
      // 核心修正：确保先成功创建订单，再更新房间状态，最后刷新顶层数据
      await api.orders.create(order);
      const updatedRoom = { ...activeRoom, status: RoomStatus.ORDERING };
      await onUpdateRoom(updatedRoom);
      
      closeModal();
      onRefresh(); // 触发全站数据拉取，确保调度中心同步
    } catch (error) {
      console.error('Manual order failed:', error);
      alert('下单失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 批量打印预览遮罩 */}
      {viewMode === 'bulkPrint' && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto p-10 print:p-0">
           <div className="max-w-4xl mx-auto no-print mb-10 flex items-center justify-between bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-white/10">
              <div>
                 <h3 className="text-xl font-bold">桌贴二维码预览 (共 {(rooms || []).length} 间)</h3>
                 <p className="text-xs opacity-60">请使用 A4 或专用标签纸打印，建议开启“背景图形”</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={closeModal} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all">关闭预览</button>
                 <button onClick={() => window.print()} className="px-8 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <Printer size={18} />
                    立即打印
                 </button>
              </div>
           </div>
           
           <div className="print-grid flex flex-wrap justify-center bg-white">
              {(rooms || []).map(room => (
                <div key={room.id} className="print-label border border-slate-200 m-2 p-6 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-sm">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">江西云厨 · JX CLOUD</p>
                   <div className="p-4 border border-slate-100 rounded-2xl mb-4">
                     <QRCodeSVG value={getQRUrl(room.id)} size={140} level="H" />
                   </div>
                   <h4 className="text-3xl font-black tracking-tighter text-slate-900">{room.id}</h4>
                   <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">扫描上方二维码在线点餐</p>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 增强型头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-300 shadow-premium no-print">
        <div className="flex items-center space-x-4">
           <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shadow-inner border border-blue-200">
              <MonitorPlay size={20} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{t('stationManagement')}</h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                Real-time Space Registry
              </p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setViewMode('bulkPrint')}
             className="px-6 h-11 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active-scale flex items-center space-x-2 group shadow-md"
           >
              <Printer size={16} className="group-hover:text-white" />
              <span>生成所有桌贴二维码</span>
           </button>
        </div>
      </div>

      {/* 楼层/区域网格 */}
      <div className="no-print space-y-8">
        {floors.map((floor, floorIdx) => (
          <div key={floor} className="space-y-3 animate-fade-up" style={{ animationDelay: `${floorIdx * 50}ms` }}>
            <div className="flex items-center space-x-3 px-1">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  {t('zone')} {floor}
               </span>
               <div className="h-[1px] flex-1 bg-slate-300" />
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
              {(rooms || []).filter(r => (r.id || '').startsWith(floor)).map((room) => (
                <div key={room.id} className="group relative">
                  <div
                    className={`relative w-full aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 active-scale cursor-pointer 
                      ${room.status === 'ordering' 
                        ? 'bg-amber-100 border-amber-400 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg'}`}
                    onClick={() => { setActiveRoom(room); setViewMode('options'); }}
                  >
                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white ${room.status === 'ordering' ? 'bg-amber-600 animate-pulse' : 'bg-slate-300'}`} />
                    
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-all z-10 flex flex-col space-y-1">
                      <button 
                        onClick={(e) => handleCopyLink(room.id, e)} 
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-md transition-all border ${copiedId === room.id ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-slate-300 text-slate-500 hover:text-blue-600'}`}
                        title="Copy Guest Link"
                      >
                        {copiedId === room.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-500 group-hover:scale-110 border ${room.status === 'ordering' ? 'bg-amber-200 border-amber-300 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-blue-600 group-hover:border-blue-700 group-hover:text-white'}`}>
                      {room.status === 'ordering' ? <ShoppingCart size={18} /> : <QrCode size={18} />}
                    </div>
                    
                    <div className="text-center">
                      <span className="text-lg font-black tracking-tighter text-slate-950 leading-none">{room.id}</span>
                      <p className={`text-[8px] uppercase font-black mt-1 tracking-widest ${room.status === 'ordering' ? 'text-amber-700' : 'text-slate-400'}`}>
                        {room.status === 'ordering' ? 'Active' : 'Ready'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Order Modal (POS Interface) - 经过重构以优化购物车显示 */}
      {activeRoom && viewMode === 'manualOrder' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 no-print">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in" onClick={closeModal} />
          <div className="relative w-full h-full lg:h-[95vh] lg:max-w-[95vw] bg-white lg:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-2 border-slate-300 animate-in slide-in-from-bottom-10">
             
             {/* POS Header */}
             <div className="px-8 py-6 border-b-2 border-slate-200 flex items-center justify-between bg-white sticky top-0 z-30">
                <div className="flex items-center space-x-6">
                   <div className="w-16 h-16 bg-slate-950 text-[#d4af37] rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border-2 border-white">
                      {activeRoom.id}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{t('manualOrder')}</h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Station POS Terminal</span>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                   </div>
                </div>
                <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-950 rounded-xl transition-all">
                   <X size={24} />
                </button>
             </div>
             
             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* 左侧：菜单选择区 */}
                <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden min-w-0 border-r border-slate-200">
                   <div className="p-6 space-y-4 bg-white border-b border-slate-100">
                      <div className="relative group">
                         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input 
                            type="text" 
                            placeholder={t('searchDishesPlaceholder')} 
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                         />
                      </div>
                      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                         <button 
                            onClick={() => setActiveCategory('All')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border
                              ${activeCategory === 'All' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}
                         >
                            {t('cat_All')}
                         </button>
                         {dynamicCategories.map(cat => (
                            <button 
                               key={cat}
                               onClick={() => setActiveCategory(cat)}
                               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border
                                  ${activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}
                            >
                               {cat}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                         {filteredDishes.map((dish) => {
                            const inCart = cart[dish.id] || 0;
                            return (
                               <div 
                                  key={dish.id} 
                                  className={`relative bg-white p-3 rounded-3xl border-2 transition-all cursor-pointer group shadow-sm active-scale flex flex-col
                                    ${inCart > 0 ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 hover:border-blue-300'}`}
                                  onClick={() => setCart(p => ({...p, [dish.id]: (p[dish.id] || 0) + 1}))}
                               >
                                  {inCart > 0 && (
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg border-2 border-white z-10">
                                       {inCart}
                                    </div>
                                  )}
                                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-50">
                                     <img src={dish.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={dish.name} />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                     <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate leading-tight">{dish.name}</h4>
                                     <p className="text-[10px] font-bold text-blue-600">₱{dish.price}</p>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                </div>

                {/* 右侧：购物车明细区 - 优化宽度和布局 */}
                <div className="w-full lg:w-[450px] bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
                   <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <ShoppingCart size={18} className="text-blue-600" />
                         <span className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-900">{t('orderSummary')}</span>
                      </div>
                      <button onClick={() => setCart({})} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">清空重选</button>
                   </div>

                   <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                      {cartItems.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                            <ShoppingCart size={48} className="mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">请从左侧选择菜品</p>
                         </div>
                      ) : (
                         cartItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-right-4 transition-all">
                               <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-sm font-bold text-slate-900 truncate leading-tight">{item.dish?.name}</p>
                                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">₱{item.dish?.price}</p>
                               </div>
                               <div className="flex items-center space-x-3 bg-white p-1 rounded-xl border border-slate-200">
                                  <button onClick={(e) => { e.stopPropagation(); setCart(p => ({...p, [item.dish!.id]: Math.max(0, p[item.dish!.id] - 1)})); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><Minus size={14} /></button>
                                  <span className="text-xs font-black w-6 text-center text-slate-900">{item.quantity}</span>
                                  <button onClick={(e) => { e.stopPropagation(); setCart(p => ({...p, [item.dish!.id]: p[item.dish!.id] + 1})); }} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg shadow-md transition-all"><Plus size={14} /></button>
                               </div>
                            </div>
                         ))
                      )}
                   </div>

                   {/* 底部结算区 */}
                   <div className="p-8 bg-slate-950 text-white space-y-6">
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>小计 / Subtotal</span>
                            <span>₱{Math.round(subtotal)}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em]">
                            <span className="text-slate-400">应付总额 / Total</span>
                            <span className="text-3xl font-serif italic text-[#d4af37]">₱{Math.round(totalAmount)}</span>
                         </div>
                      </div>

                      <button 
                        onClick={handleManualOrderSubmit} 
                        disabled={isSubmitting || cartItems.length === 0} 
                        className="w-full h-18 bg-[#d4af37] text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center space-x-3 active-scale transition-all hover:bg-white disabled:opacity-20"
                      >
                         {isSubmitting ? (
                           <Loader2 size={24} className="animate-spin" />
                         ) : (
                           <>
                             <Sparkles size={18} />
                             <span>确认下单推送</span>
                           </>
                         )}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Room Options Modal */}
      {activeRoom && viewMode === 'options' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-300 animate-in zoom-in-95">
             <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{t('station')} {activeRoom.id}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Space Registry Node</p>
                </div>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-200"><X size={20} /></button>
             </div>
             <div className="p-8 space-y-4">
                <button onClick={() => setViewMode('qr')} className="w-full p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between group active-scale transition-all border border-white/10">
                  <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><QrCode size={24} /></div>
                     <div className="text-left"><p className="font-bold text-sm leading-tight">{t('guestQRCode')}</p><p className="text-[9px] opacity-40 uppercase tracking-widest">{t('displayQRDesc')}</p></div>
                  </div>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => setViewMode('manualOrder')} className="w-full p-6 bg-blue-600 text-white rounded-3xl flex items-center justify-between group active-scale transition-all border border-white/10">
                  <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Plus size={24} /></div>
                     <div className="text-left"><p className="font-bold text-sm leading-tight">{t('manualOrder')}</p><p className="text-[9px] opacity-40 uppercase tracking-widest">{t('staffOperatedDesc')}</p></div>
                  </div>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* QR View Modal */}
      {activeRoom && viewMode === 'qr' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in" onClick={closeModal} />
          <div className="relative w-full max-w-sm bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-white p-10 text-center space-y-8 animate-in zoom-in-95 slide-in-from-bottom-20">
             <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2"><Sparkles size={14} /><span className="text-[10px] font-black uppercase tracking-[0.4em]">Digital Table Access</span></div>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">{t('station')} {activeRoom.id}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('displayQRDesc')}</p>
             </div>
             <div id="single-qr-print" className="p-10 bg-white border-2 border-slate-100 rounded-[3rem] shadow-inner inline-block transform transition-transform hover:scale-105 duration-500">
                <QRCodeSVG value={getQRUrl(activeRoom.id)} size={200} level="H" includeMargin={false} />
             </div>
             <div className="space-y-4">
                <button onClick={() => window.print()} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active-scale transition-all">
                  <Printer size={16} />
                  <span>打印此桌贴</span>
                </button>
                <button onClick={() => setViewMode('options')} className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-950 transition-colors">{t('cancel')}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomGrid;

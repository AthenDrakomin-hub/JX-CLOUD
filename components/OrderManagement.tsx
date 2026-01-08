
import React, { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { 
  Printer, ChefHat, CheckCircle2, Search, Clock, Package, 
  Eye, X, LayoutGrid, MonitorPlay, Timer, Info, 
  CreditCard, Banknote, Calendar, Hash, MapPin, Sparkles, Loader2, ChevronRight
} from 'lucide-react';

interface OrderManagementProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  lang: Language;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onUpdateStatus, lang }) => {
  const [printing, setPrinting] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isKdsMode, setIsKdsMode] = useState(false);
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  const handlePrint = (order: Order) => {
    // 1. 设置打印状态以渲染票据
    setPrinting(order);
    
    // 2. 如果是待接单状态，自动流转为制作中
    if (order.status === OrderStatus.PENDING) {
      onUpdateStatus(order.id, OrderStatus.PREPARING);
    }
    
    // 3. 延迟触发浏览器打印，给 DOM 渲染票据的时间
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 300);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-orange-600';
      case OrderStatus.PREPARING: return 'bg-blue-600';
      case OrderStatus.COMPLETED: return 'bg-emerald-600';
      case OrderStatus.CANCELLED: return 'bg-slate-500';
      default: return 'bg-slate-900';
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 80mm 标准热敏打印票据模版 (浏览器打印触发) */}
      <div className="hidden print:block">
        {printing && (
          <div className="thermal-ticket font-mono text-black">
            <div className="text-center space-y-1 mb-4">
              <h1 className="text-xl font-bold uppercase tracking-tighter">
                {lang === 'zh' ? '江西云厨 · 厨房制作单' : 'JX CLOUD · KITCHEN TICKET'}
              </h1>
              <p className="text-[10px] opacity-70">TERMINAL ID: {window.location.hostname}</p>
            </div>
            
            <div className="border-t-2 border-black border-dashed my-3"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-bold">{lang === 'zh' ? '桌号 / 房号:' : 'STATION / ROOM:'}</span>
              <span className="text-4xl font-black">{printing.roomId}</span>
            </div>
            
            <div className="border-t border-black border-dashed my-3"></div>
            
            <div className="space-y-4 py-2">
              {printing.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-lg">
                  <span className="font-bold flex-1 pr-4">{it.name}</span>
                  <span className="font-black whitespace-nowrap">x {it.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t-2 border-black border-dashed my-3"></div>
            
            <div className="text-[10px] space-y-1 opacity-80">
              <p className="flex justify-between">
                <span>{lang === 'zh' ? '流水单号:' : 'ORDER ID:'}</span>
                <span>#{printing.id.slice(-8).toUpperCase()}</span>
              </p>
              <p className="flex justify-between">
                <span>{lang === 'zh' ? '下单时间:' : 'TIME:'}</span>
                <span>{new Date(printing.createdAt).toLocaleString()}</span>
              </p>
              <p className="flex justify-between">
                <span>{t('paymentMethodLabel')}:</span>
                <span>{printing.paymentMethod}</span>
              </p>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest italic">JX-Cloud Hospitality Systems</p>
            </div>
          </div>
        )}
      </div>

      {/* 控制条 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print">
         <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl transition-all ${isKdsMode ? 'bg-slate-900 text-blue-500 shadow-lg' : 'bg-blue-50 text-blue-600 shadow-inner'}`}>
               <MonitorPlay size={24} />
            </div>
            <div>
               <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">{lang === 'zh' ? '订单流转看板' : 'Order Flow Monitor'}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Order Dispatcher</p>
            </div>
         </div>
         <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button onClick={() => setIsKdsMode(false)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isKdsMode ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('standardMode')}</button>
            <button onClick={() => setIsKdsMode(true)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isKdsMode ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('kdsMode')}</button>
         </div>
      </div>

      {/* 订单列表 */}
      <div className={`grid gap-8 no-print ${isKdsMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {orders.map(o => (
          <div 
            key={o.id} 
            className={`bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-200 shadow-sm relative group overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-blue-200 cursor-pointer ${isKdsMode ? 'p-6 md:p-10' : 'p-6 md:p-8'}`}
            onClick={() => setViewingOrder(o)}
          >
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl z-10 transition-colors ${getStatusColor(o.status)}`}>
              {t(`status_${o.status}` as any)}
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`${isKdsMode ? 'text-4xl md:text-7xl' : 'text-3xl md:text-5xl'} font-black text-slate-950 tracking-tighter`}>{o.roomId}</h3>
                <div className="flex items-center space-x-2 mt-2">
                   <Timer size={14} className="text-slate-300" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(o.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 no-print" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handlePrint(o)} 
                  className="w-12 h-12 flex items-center justify-center bg-slate-950 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95 group/btn"
                  title={t(lang === 'zh' ? 'printTicketAndSync' : 'printAndPrep')}
                >
                  <Printer size={22} className="group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            <div className={`space-y-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100`}>
              {o.items.slice(0, 3).map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span className="truncate pr-4">{it.name}</span>
                  <span className="text-slate-900 font-black">x{it.quantity}</span>
                </div>
              ))}
              {o.items.length > 3 && (
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pt-2">
                  + {o.items.length - 3} {lang === 'zh' ? '更多项目' : 'more items'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{lang === 'zh' ? '结算金额' : 'AMOUNT'}</span>
                  <span className="text-xl font-serif italic text-blue-700">₱{Math.round(o.totalAmount)}</span>
               </div>
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ChevronRight size={18} />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* 订单详情模态框 */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md no-print">
          <div className="relative w-full max-w-lg bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{t('orderDetails')}</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Order Registry: #{viewingOrder.id.slice(-8)}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-all shadow-sm">
                   <X size={24} />
                </button>
             </div>
             
             <div className="p-10 space-y-8 overflow-y-auto no-scrollbar flex-1">
                <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('station')}</p>
                      <p className="text-5xl font-black text-slate-950 tracking-tighter">{viewingOrder.roomId}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('totalBill')}</p>
                      <p className="text-4xl font-serif italic text-blue-700">₱{Math.round(viewingOrder.totalAmount)}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{lang === 'zh' ? '商品明细' : 'ITEMIZED BILL'}</p>
                   <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden">
                      {viewingOrder.items.map((it, idx) => (
                        <div key={idx} className="px-8 py-5 border-b border-slate-50 last:border-0 flex justify-between items-center group hover:bg-slate-50 transition-all">
                           <div className="flex-1 pr-4">
                              <p className="font-bold text-slate-900 text-sm leading-tight">{it.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">₱{it.price}</p>
                           </div>
                           <span className="font-black text-slate-950">x {it.quantity}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('statusActive')}</p>
                      <p className="text-xs font-black text-slate-900">{t(`status_${viewingOrder.status}` as any)}</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('paymentMethodLabel')}</p>
                      <p className="text-xs font-black text-slate-900">{viewingOrder.paymentMethod}</p>
                   </div>
                </div>
             </div>

             <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4 sticky bottom-0 z-10">
                {viewingOrder.status === OrderStatus.PENDING && (
                  <button 
                    onClick={() => { onUpdateStatus(viewingOrder.id, OrderStatus.PREPARING); setViewingOrder(null); }}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <ChefHat size={18} />
                    <span>{t('acceptOrder')}</span>
                  </button>
                )}
                {viewingOrder.status === OrderStatus.PREPARING && (
                  <button 
                    onClick={() => { onUpdateStatus(viewingOrder.id, OrderStatus.COMPLETED); setViewingOrder(null); }}
                    className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={18} />
                    <span>{t('completeOrder')}</span>
                  </button>
                )}
                {viewingOrder.status !== OrderStatus.COMPLETED && viewingOrder.status !== OrderStatus.CANCELLED && (
                  <button 
                    onClick={() => { if(confirm(lang === 'zh' ? '确定取消该订单吗？' : 'Cancel this order?')) { onUpdateStatus(viewingOrder.id, OrderStatus.CANCELLED); setViewingOrder(null); } }}
                    className="px-8 py-5 text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-widest border border-red-100"
                  >
                    {lang === 'zh' ? '取消订单' : 'Cancel'}
                  </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

import React, { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { 
  Printer, ChefHat, CheckCircle, Search, Clock, Package, 
  Eye, X, LayoutGrid, MonitorPlay, Timer, Info, 
  CreditCard, Banknote, Calendar, Hash, MapPin, Sparkles
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
    setPrinting(order);
    if (order.status === OrderStatus.PENDING) {
      onUpdateStatus(order.id, OrderStatus.PREPARING);
    }
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 500);
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
      {/* 80mm 热敏打印预览 */}
      <div className="hidden print:block">
        {printing && (
          <div className="thermal-ticket">
            <h1 style={{fontSize: '22px', textAlign: 'center', fontWeight: 'bold'}}>{lang === 'zh' ? '江西云厨 · 制作单' : 'JX Cloud · Production Ticket'}</h1>
            <p style={{textAlign: 'center', fontSize: '11px'}}># {printing.id.slice(-8)}</p>
            <div style={{borderTop:'2px dashed #000', margin:'12px 0'}}></div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'16px', fontWeight:'bold'}}>
              <span>{lang === 'zh' ? '桌号/房号:' : 'Table/Room:'}</span>
              <span style={{fontSize:'32px'}}>{printing.roomId}</span>
            </div>
            <div style={{borderTop:'1px dashed #000', margin:'12px 0'}}></div>
            <div style={{padding:'8px 0'}}>
              {printing.items.map((it, idx) => (
                <div key={idx} style={{display:'flex', justifyContent:'space-between', fontSize:'18px', fontWeight:'bold', marginBottom:'8px'}}>
                  <span>{it.name}</span>
                  <span>x{it.quantity}</span>
                </div>
              ))}
            </div>
            <div style={{borderTop:'2px dashed #000', margin:'12px 0'}}></div>
            <p style={{fontSize:'12px'}}>{lang === 'zh' ? '下单时间' : 'Order Time'}: {new Date(printing.createdAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* 控制条 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 no-print">
         <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-xl transition-all ${isKdsMode ? 'bg-slate-900 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
               <MonitorPlay size={20} />
            </div>
            <div>
               <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">{lang === 'zh' ? '订单流转看板' : 'Order Flow Monitor'}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Order Dispatcher</p>
            </div>
         </div>
         <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setIsKdsMode(false)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isKdsMode ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>{t('standardMode')}</button>
            <button onClick={() => setIsKdsMode(true)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isKdsMode ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>{t('kdsMode')}</button>
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
            <div className={`absolute top-0 right-0 px-4 md:px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl ${getStatusColor(o.status)}`}>
              {t(`status_${o.status}` as any)}
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`${isKdsMode ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl'} font-black text-slate-900 tracking-tighter`}>{o.roomId}</h3>
                <div className="flex items-center space-x-2 mt-2">
                   <Timer size={12} className="text-slate-300" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(o.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 no-print" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handlePrint(o)} 
                  className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                  title={lang === 'zh' ? '打印制作单' : 'Print Ticket'}
                >
                  <Printer size={18} md:size={20} />
                </button>
              </div>
            </div>

            <div className={`space-y-3 mb-8 bg-slate-50 p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-inner overflow-y-auto no-scrollbar ${isKdsMode ? 'min-h-[150px] md:min-h-[200px]' : 'max-h-[120px]'}`}>
              {o.items.map((it, i) => (
                <div key={i} className={`flex justify-between font-bold text-slate-800 ${isKdsMode ? 'text-base md:text-lg py-1' : 'text-xs'}`}>
                  <span className="truncate pr-4">{it.name}</span>
                  <span className="text-blue-600 shrink-0 font-black">x {it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
              <span className="text-xl md:text-2xl font-serif italic text-blue-700">{t('currency')}{o.totalAmount}</span>
              <div className="flex gap-2">
                {o.status === OrderStatus.PENDING && (
                  <button onClick={() => onUpdateStatus(o.id, OrderStatus.PREPARING)} className="px-4 md:px-8 py-3 md:py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg active-scale">
                    <ChefHat size={14} md:size={16} /> {t('acceptOrder')}
                  </button>
                )}
                {o.status === OrderStatus.PREPARING && (
                  <button onClick={() => onUpdateStatus(o.id, OrderStatus.COMPLETED)} className="px-4 md:px-8 py-3 md:py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active-scale">
                    <CheckCircle size={14} md:size={16} /> {t('completeOrder')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 订单详情模态框 */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setViewingOrder(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-4 md:space-x-6">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${getStatusColor(viewingOrder.status)}`}>
                  <Package size={20} md:size={28} />
                </div>
                <div>
                  <h3 className="text-xl md:text-3xl font-black text-slate-950 tracking-tighter uppercase">{t('orderDetails')}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[120px] md:max-w-none">#{viewingOrder.id.slice(-8)} · {viewingOrder.roomId}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setViewingOrder(null)} 
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-all"
              >
                <X size={20} md:size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-10 no-scrollbar">
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border border-slate-100 space-y-2">
                   <div className="flex items-center space-x-2 text-slate-400">
                      <MapPin size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'zh' ? '房间/桌号' : 'Table / Room'}</span>
                   </div>
                   <p className="text-lg md:text-xl font-black text-slate-900">{viewingOrder.roomId}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border border-slate-100 space-y-2">
                   <div className="flex items-center space-x-2 text-slate-400">
                      <CreditCard size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'zh' ? '支付方式' : 'Payment Method'}</span>
                   </div>
                   <p className="text-lg md:text-xl font-black text-slate-900">{viewingOrder.paymentMethod}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border border-slate-100 space-y-2">
                   <div className="flex items-center space-x-2 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'zh' ? '下单时间' : 'Created At'}</span>
                   </div>
                   <p className="text-[11px] md:text-xs font-bold text-slate-700">{new Date(viewingOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border border-slate-100 space-y-2">
                   <div className="flex items-center space-x-2 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'zh' ? '最后更新' : 'Updated At'}</span>
                   </div>
                   <p className="text-[11px] md:text-xs font-bold text-slate-700">{new Date(viewingOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-400 mb-2">
                  <LayoutGrid size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'zh' ? '商品清单' : 'Item Checklist'}</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[400px]">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 md:px-8 py-4">{lang === 'zh' ? '品名' : 'Name'}</th>
                          <th className="px-6 md:px-8 py-4 text-center">{lang === 'zh' ? '数量' : 'Qty'}</th>
                          <th className="px-6 md:px-8 py-4 text-right">{lang === 'zh' ? '单价' : 'Price'}</th>
                          <th className="px-6 md:px-8 py-4 text-right">{lang === 'zh' ? '总计' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {viewingOrder.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 md:px-8 py-4 text-xs font-bold text-slate-900">{it.name}</td>
                            <td className="px-6 md:px-8 py-4 text-center text-xs font-black text-blue-600">x{it.quantity}</td>
                            <td className="px-6 md:px-8 py-4 text-right text-xs font-mono text-slate-500">{t('currency')}{it.price}</td>
                            <td className="px-6 md:px-8 py-4 text-right text-xs font-black text-slate-900">{t('currency')}{it.price * it.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Financials Summary */}
              <div className="bg-slate-900 p-6 md:p-10 rounded-2xl md:rounded-[3rem] text-white space-y-4">
                <div className="flex justify-between items-center text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  <span>{t('subtotal')}</span>
                  <span>{t('currency')}{Math.round(viewingOrder.totalAmount - (viewingOrder.taxAmount || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  <span>{t('tax')} (12%)</span>
                  <span>{t('currency')}{Math.round(viewingOrder.taxAmount || 0)}</span>
                </div>
                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('totalBill')}</span>
                    <span className="text-2xl md:text-4xl font-serif italic text-white tracking-tighter">{t('currency')}{viewingOrder.totalAmount}</span>
                  </div>
                  <div className="px-4 md:px-6 py-2 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{viewingOrder.paymentMethod === 'Cash' ? 'Settlement Pending' : 'Paid Online'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 no-print">
              <button 
                onClick={() => handlePrint(viewingOrder)} 
                className="flex-1 h-14 md:h-16 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center space-x-3 hover:bg-blue-600 transition-all shadow-xl active-scale"
              >
                <Printer size={16} md:size={18} />
                <span>{t('printTicket')}</span>
              </button>
              <button 
                onClick={() => setViewingOrder(null)}
                className="px-6 md:px-10 h-14 md:h-16 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-950 hover:border-slate-300 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

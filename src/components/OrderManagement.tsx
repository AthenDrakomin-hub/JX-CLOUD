
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Order, OrderStatus, User, SystemConfig } from '../types';
import { Language, getTranslation } from '../constants/translations';
import { 
  Printer, ChefHat, CheckCircle2, Search, Clock, 
  X, MonitorPlay, ChevronRight, HandCoins
} from 'lucide-react';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface OrderManagementProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  lang: Language;
  currentUser: User | null;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onUpdateStatus, lang, currentUser }) => {
  const [printing, setPrinting] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isKdsMode, setIsKdsMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  const t = (key: string) => getTranslation(lang, key);

  useEffect(() => {
    api.config.get().then(setSystemConfig);
  }, []);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      // Fix: Changed 'roomId' to 'tableId' to match Order interface
      o.tableId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handlePrint = useCallback((order: Order) => {
    setPrinting(order);
    if (order.status === OrderStatus.PENDING) {
      onUpdateStatus(order.id, OrderStatus.PREPARING);
    }
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 300);
  }, [onUpdateStatus]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-orange-600 shadow-orange-500/20';
      case OrderStatus.PREPARING: return 'bg-blue-600 shadow-blue-500/20';
      case OrderStatus.COMPLETED: return 'bg-emerald-600 shadow-emerald-500/20';
      case OrderStatus.CANCELLED: return 'bg-slate-500 shadow-slate-500/20';
      default: return 'bg-slate-900';
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 打印模版省略，保持逻辑一致 */}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print">
         <div className="flex items-center space-x-6">
            <div className={`p-4 rounded-2xl transition-all ${isKdsMode ? 'bg-slate-900 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
               <MonitorPlay size={28} />
            </div>
            <div className="relative group w-full md:w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 placeholder={t('search')}
                 className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
               />
            </div>
         </div>
         <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {/* Fix: Corrected typo 'setIsMode' to 'setIsKdsMode' */}
            <button onClick={() => setIsKdsMode(false)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isKdsMode ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400'}`}>{t('standardMode')}</button>
            <button onClick={() => setIsKdsMode(true)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isKdsMode ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400'}`}>{t('kdsMode')}</button>
         </div>
      </div>

      <div className={`grid gap-8 no-print ${isKdsMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {filteredOrders.map(o => (
          <div key={o.id} className="bg-white rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl cursor-pointer relative overflow-hidden group p-8 border-slate-100" onClick={() => setViewingOrder(o)}>
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg z-10 ${getStatusColor(o.status)}`}>
              {t(`status_${o.status}` as any)}
            </div>
            <div className="flex justify-between items-start mb-8">
              <div>
                {/* Fix: Changed 'roomId' to 'tableId' to match Order interface */}
                <h3 className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{o.tableId}</h3>
                <div className="flex items-center space-x-2 mt-4 text-slate-400">
                   <Clock size={14} />
                   <p className="text-[10px] font-bold uppercase tracking-widest">{new Date(o.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handlePrint(o); }} className="w-14 h-14 flex items-center justify-center bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl"><Printer size={24} /></button>
            </div>
            <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-50">
              {o.items.slice(0, 3).map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span className="truncate pr-4">{it.name}</span>
                  <span className="text-slate-900 font-black">x{it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
               <span className="text-2xl font-serif italic text-blue-700 leading-none">₱{Math.round(o.totalAmount)}</span>
               <ChevronRight size={14} className="opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {viewingOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md no-print">
          <div className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{t('viewAudit')}</h3>
                <button onClick={() => setViewingOrder(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 shadow-sm transition-all"><X size={24} /></button>
             </div>
             <div className="p-10 space-y-8 overflow-y-auto no-scrollbar flex-1">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-inner">
                   {/* Fix: Changed 'roomId' to 'tableId' to match Order interface */}
                   <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('station')}</p><p className="text-5xl font-black text-slate-950 tracking-tighter">{viewingOrder.tableId}</p></div>
                   <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('totalBill')}</p><p className="text-4xl font-serif italic text-blue-700">₱{Math.round(viewingOrder.totalAmount)}</p></div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t('orderSummary')}</p>
                   <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden">
                      {viewingOrder.items.map((it, idx) => (
                        <div key={idx} className="px-8 py-5 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50 transition-all">
                           <div className="flex-1 pr-4"><p className="font-bold text-slate-900 text-sm leading-tight">{it.name}</p></div>
                           <span className="font-black text-slate-950">x {it.quantity}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4">
                {viewingOrder.status === OrderStatus.PENDING && (
                  <button onClick={() => { onUpdateStatus(viewingOrder.id, OrderStatus.PREPARING); setViewingOrder(null); }} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl active-scale-95 transition-all"><ChefHat size={18} /><span>{t('acceptOrder')}</span></button>
                )}
                {viewingOrder.status === OrderStatus.PREPARING && (
                  <button onClick={() => { onUpdateStatus(viewingOrder.id, OrderStatus.COMPLETED); setViewingOrder(null); }} className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl active-scale-95 transition-all"><CheckCircle2 size={18} /><span>{t('completeOrder')}</span></button>
                )}
                <button onClick={() => { if(confirm(t('voidOrder') + '?')) { onUpdateStatus(viewingOrder.id, OrderStatus.CANCELLED); setViewingOrder(null); } }} className="px-8 py-5 text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-widest border border-red-100">{t('delete')}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

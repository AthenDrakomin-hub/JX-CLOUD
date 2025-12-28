
import React, { useState } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { Clock, ChefHat, Truck, CheckCircle, Filter, Sparkles, Ban, Printer, Banknote } from 'lucide-react';
import { translations, Language } from '../translations';
import ConfirmationModal from './ConfirmationModal';

interface OrderManagementProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  lang: Language;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onUpdateStatus, lang }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'ongoing' | 'finished'>('all');
  const [confirmCancel, setConfirmCancel] = useState<{ isOpen: boolean; orderId: string | null }>({ isOpen: false, orderId: null });
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'pending') return o.status === OrderStatus.PENDING;
    if (filter === 'ongoing') return [OrderStatus.PREPARING, OrderStatus.DELIVERING].includes(o.status);
    if (filter === 'finished') return [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status);
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-amber-500';
      case OrderStatus.PREPARING: return 'bg-blue-500';
      case OrderStatus.DELIVERING: return 'bg-purple-500';
      case OrderStatus.COMPLETED: return 'bg-emerald-500';
      case OrderStatus.CANCELLED: return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map(i => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding: 8px 0;">
        <span style="flex: 1;">${i.name}</span>
        <span style="width: 40px; text-align: center;">x${i.quantity}</span>
        <span style="width: 80px; text-align: right;">₱${(i.price * i.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kitchen Ticket #${order.id.slice(-6)}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 30px; line-height: 1.4; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; margin-bottom: 5px; }
            .info { margin-bottom: 25px; font-size: 14px; }
            .items { margin-bottom: 25px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 15px; }
            .payment-badge { 
              display: inline-block; padding: 4px 10px; border-radius: 4px; border: 1px solid #000; 
              margin-top: 10px; font-size: 12px; font-weight: bold;
            }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">JX CLOUD KITCHEN</div>
            <div>Hospitality Order Receipt</div>
          </div>
          <div class="info">
            <strong>ROOM/STATION:</strong> <span style="font-size: 24px;">${order.roomId}</span><br/>
            <strong>ORDER ID:</strong> #${order.id}<br/>
            <strong>TIMESTAMP:</strong> ${new Date(order.createdAt).toLocaleString()}<br/>
            <div class="payment-badge">PAYMENT: ${(order.paymentMethod || 'N/A').toUpperCase()}</div>
          </div>
          <div class="items">
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
              <span>ITEM</span>
              <span>QTY</span>
              <span>PRICE</span>
            </div>
            ${itemsHtml}
          </div>
          <div class="total-row">
            <span>TOTAL AMOUNT</span>
            <span>₱${order.totalAmount.toFixed(2)}</span>
          </div>
          <div class="footer">
            THANK YOU FOR DINING WITH US<br/>
            System Sovereign Enterprise v3.1
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filterOptions = [
    { id: 'all', label: t('filterAll') },
    { id: 'pending', label: t('filterPending') },
    { id: 'ongoing', label: t('filterOngoing') },
    { id: 'finished', label: t('filterFinished') },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('liveQueue')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('kitchenWorkspace')}</h2>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-full border border-slate-300 shadow-sm">
          {filterOptions.map((f) => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id as any)} 
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                ${filter === f.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:text-slate-800'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredOrders.map((order, idx) => (
          <div 
            key={order.id} 
            className={`group bg-[#0f172a] rounded-[3.5rem] overflow-hidden shadow-2xl text-white transition-all duration-700 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-10 ${order.status === OrderStatus.CANCELLED ? 'opacity-50 grayscale' : ''}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
             <div className="p-10 space-y-8">
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-3xl font-bold tracking-tight">{t('station')} {order.roomId}</h4>
                        <button 
                          onClick={() => handlePrint(order)}
                          className="p-2 bg-white/5 hover:bg-[#d4af37] text-white rounded-xl transition-all"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{order.id.slice(-6)}</p>
                   </div>
                   <div className="flex flex-col items-end space-y-2">
                      <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${getStatusColor(order.status)}`} style={{ boxShadow: `0 0 15px ${getStatusColor(order.status)}` }} />
                      {order.paymentMethod === PaymentMethod.CASH && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/20">
                           <Banknote size={10} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{t('cash')}</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-4 max-h-48 overflow-y-auto no-scrollbar py-2">
                   {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/20 p-4 rounded-2xl border border-white/20">
                         <div className="flex items-center space-x-4">
                            <span className="w-8 h-8 bg-[#d4af37] text-[#0f172a] rounded-lg flex items-center justify-center font-black text-xs">{item.quantity}</span>
                            <span className="text-sm font-bold text-slate-100">{item.name}</span>
                         </div>
                         <span className="text-xs font-serif italic text-slate-300">₱{item.price * item.quantity}</span>
                      </div>
                   ))}
                </div>

                <div className="flex items-end justify-between pt-6 border-t border-white/30">
                   <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{t('totalBill')}</p>
                      <p className="text-3xl font-serif italic text-[#d4af37]">₱{order.totalAmount}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('timestamp')}</p>
                      <p className="text-xs font-bold text-slate-200">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                </div>

                <div className="pt-4 flex flex-col space-y-3">
                   {order.status === OrderStatus.PENDING && (
                     <button 
                       onClick={() => {
                         onUpdateStatus(order.id, OrderStatus.PREPARING);
                         handlePrint(order); 
                       }}
                       className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] hover:text-white transition-all active:scale-95 flex items-center justify-center space-x-3"
                     >
                       <ChefHat size={16} />
                       <span>{t('initPrep')}</span>
                     </button>
                   )}
                   {order.status === OrderStatus.PREPARING && (
                     <button 
                       onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERING)}
                       className="w-full py-5 bg-[#d4af37] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center space-x-3"
                     >
                       <Truck size={16} />
                       <span>{t('dispatch')}</span>
                     </button>
                   )}
                   {order.status === OrderStatus.DELIVERING && (
                     <button 
                       onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED)}
                       className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center space-x-3"
                     >
                       <CheckCircle size={16} />
                       <span>{t('confirmArrival')}</span>
                     </button>
                   )}
                   
                   {![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status) && (
                     <button 
                       onClick={() => setConfirmCancel({ isOpen: true, orderId: order.id })}
                       className="w-full py-4 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest"
                     >
                       <Ban size={14} />
                       <span>{t('voidOrder')}</span>
                     </button>
                   )}
                </div>
             </div>
          </div>
        ))}
      </div>

      <ConfirmationModal 
        isOpen={confirmCancel.isOpen}
        title={t('voidOrder')}
        message={lang === 'zh' 
          ? '您确定要取消该笔订单吗？此操作将记录在安全审计日志中。' 
          : 'Are you sure you want to cancel this order? This action will be logged in the security audit.'
        }
        confirmLabel={t('cancelled')}
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmCancel.orderId) onUpdateStatus(confirmCancel.orderId, OrderStatus.CANCELLED);
          setConfirmCancel({ isOpen: false, orderId: null });
        }}
        onCancel={() => setConfirmCancel({ isOpen: false, orderId: null })}
        lang={lang}
      />
    </div>
  );
};

export default OrderManagement;
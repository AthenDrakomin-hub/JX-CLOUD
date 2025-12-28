
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { 
  Clock, ChefHat, Truck, CheckCircle, Filter, Sparkles, Ban, Printer, 
  Banknote, Timer, AlertCircle, X, ShoppingBag, CreditCard, Hash, 
  Search, Loader2, ArrowRight, Receipt, Calendar, Info
} from 'lucide-react';
import { translations, Language } from '../translations';
import ConfirmationModal from './ConfirmationModal';

interface OrderManagementProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  lang: Language;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onUpdateStatus, lang }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmCancel, setConfirmCancel] = useState<{ isOpen: boolean; orderId: string | null }>({ isOpen: false, orderId: null });
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  // 计算各个状态的订单数量
  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    preparing: orders.filter(o => o.status === OrderStatus.PREPARING).length,
    delivering: orders.filter(o => o.status === OrderStatus.DELIVERING).length,
    completed: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
    cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
  }), [orders]);

  // 组合过滤逻辑 (状态 + 搜索)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filter === 'all' || o.status === filter;
      const matchSearch = 
        o.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filter, searchQuery]);

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

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<string, string> = {
      [OrderStatus.PENDING]: t('filterPending'),
      [OrderStatus.PREPARING]: lang === 'zh' ? '制作中' : 'Preparing',
      [OrderStatus.DELIVERING]: lang === 'zh' ? '配送中' : 'Delivering',
      [OrderStatus.COMPLETED]: lang === 'zh' ? '已完成' : 'Completed',
      [OrderStatus.CANCELLED]: lang === 'zh' ? '已取消' : 'Cancelled',
    };
    return labels[status] || status;
  };

  // 增强型后厨打印引擎
  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map(i => `
      <div style="display: flex; align-items: center; border-bottom: 2px solid #000; padding: 12px 0;">
        <div style="font-size: 32px; font-weight: 900; width: 70px; text-align: center; border-right: 3px solid #000; margin-right: 15px;">${i.quantity}x</div>
        <div style="flex: 1;">
          <div style="font-size: 24px; font-weight: 800; line-height: 1.1; text-transform: uppercase;">${i.name}</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KITCHEN TICKET - RM ${order.roomId}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 20px; 
              width: 360px; 
              color: #000; 
              background: #fff;
              line-height: 1.2;
            }
            .header { text-align: center; border-bottom: 8px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
            .room-number { font-size: 84px; font-weight: 900; margin: 0; padding: 0; line-height: 1; }
            .meta { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; margin-bottom: 15px; padding: 8px 0; border-bottom: 2px dashed #000; }
            .footer { text-align: center; border-top: 4px solid #000; padding-top: 15px; font-size: 14px; font-weight: 900; margin-top: 20px; }
            .urgent { background: #000; color: #fff; padding: 8px; margin-top: 10px; font-size: 20px; letter-spacing: 4px; font-weight: 900; }
            .order-id { font-size: 12px; margin-top: 5px; opacity: 0.7; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 14px; font-weight: 900; letter-spacing: 5px;">ROOM / STATION</div>
            <div class="room-number">${order.roomId}</div>
          </div>
          <div class="meta">
            <span>#${order.id.slice(-6).toUpperCase()}</span>
            <span>${new Date(order.createdAt).toLocaleTimeString([], { hour12: false })}</span>
          </div>
          <div style="margin-bottom: 20px;">${itemsHtml}</div>
          <div class="footer">
            <div class="urgent">*** KITCHEN COPY ***</div>
            <div class="order-id">TX: ${order.id}</div>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(() => window.close(), 500); 
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filterOptions = [
    { id: 'all', label: t('filterAll'), count: counts.all, color: 'bg-slate-900' },
    { id: OrderStatus.PENDING, label: t('filterPending'), count: counts.pending, color: 'bg-amber-500' },
    { id: OrderStatus.PREPARING, label: lang === 'zh' ? '制作中' : 'Preparing', count: counts.preparing, color: 'bg-blue-500' },
    { id: OrderStatus.DELIVERING, label: lang === 'zh' ? '配送中' : 'Delivering', count: counts.delivering, color: 'bg-purple-500' },
    { id: OrderStatus.COMPLETED, label: lang === 'zh' ? '已完成' : 'Completed', count: counts.completed, color: 'bg-emerald-500' },
    { id: OrderStatus.CANCELLED, label: lang === 'zh' ? '已取消' : 'Cancelled', count: counts.cancelled, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* 4. 搜索与过滤器头部 */}
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
             <div className="flex items-center space-x-2 text-[#d4af37]">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('liveQueue')}</span>
             </div>
             <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('kitchenWorkspace')}</h2>
          </div>

          <div className="relative group w-full lg:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={lang === 'zh' ? "搜索房间号或订单号..." : "Search Room or Order ID..."}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-8 focus:ring-slate-50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 状态过滤导航 (含计数) */}
        <div className="flex bg-white/40 backdrop-blur-md p-2 rounded-[2.5rem] border border-white shadow-sm overflow-x-auto no-scrollbar max-w-full">
          {filterOptions.map((f) => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id)} 
              className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center space-x-3 shrink-0
                ${filter === f.id ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}
            >
              <span>{f.label}</span>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black transition-colors ${filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. 订单网格列表 */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/40 rounded-[4rem] border border-dashed border-slate-200 animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
            {searchQuery ? (lang === 'zh' ? '未找到相关订单' : 'No matching orders found') : (lang === 'zh' ? `暂无${getStatusLabel(filter as OrderStatus)}订单` : `No ${getStatusLabel(filter as OrderStatus).toLowerCase()} orders`)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {filteredOrders.map((order, idx) => (
            <div 
              key={order.id} 
              onClick={() => setDetailOrder(order)}
              className={`group bg-[#0f172a] rounded-[3.5rem] overflow-hidden shadow-2xl text-white transition-all duration-700 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-10 cursor-pointer relative ${order.status === OrderStatus.CANCELLED ? 'opacity-60 grayscale' : ''}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
               {/* 状态指示灯 */}
               <div className={`absolute top-10 right-10 w-3 h-3 rounded-full animate-pulse shadow-[0_0_20px] ${getStatusColor(order.status)}`} style={{ boxShadow: `0 0 20px ${getStatusColor(order.status)}` }} />

               <div className="p-10 space-y-8">
                  <div className="flex items-start justify-between">
                     <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-3xl font-bold tracking-tight">{t('station')} {order.roomId}</h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                            title={lang === 'zh' ? "打印票据" : "Print Ticket"}
                            className="p-3 bg-white/5 hover:bg-[#d4af37] text-white/40 hover:text-slate-900 rounded-2xl transition-all active:scale-90 border border-white/5"
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{order.id.slice(-8)}</p>
                     </div>
                  </div>

                  {/* 价格与时间摘要 */}
                  <div className="flex items-end justify-between pt-6 border-t border-white/10">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('totalBill')}</p>
                        <p className="text-3xl font-serif italic text-[#d4af37]">₱{Math.round(order.totalAmount)}</p>
                     </div>
                     <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('timestamp')}</p>
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                          <Timer size={12} className="text-slate-500" />
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                     </div>
                  </div>

                  {/* 状态快速操作 */}
                  <div className="pt-4 flex flex-col space-y-3">
                     {order.status === OrderStatus.PENDING && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, OrderStatus.PREPARING); }}
                         className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] hover:text-white transition-all active:scale-95 flex items-center justify-center space-x-3 group"
                       >
                         <ChefHat size={16} />
                         <span>{t('initPrep')}</span>
                       </button>
                     )}
                     {order.status === OrderStatus.PREPARING && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, OrderStatus.DELIVERING); }}
                         className="w-full py-5 bg-[#d4af37] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center space-x-3"
                       >
                         <Truck size={16} />
                         <span>{t('dispatch')}</span>
                       </button>
                     )}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. 订单深度详情模态框 */}
      {detailOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setDetailOrder(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-500 flex flex-col max-h-[90vh]">
             {/* 模态框头部 */}
             <div className="p-10 lg:p-12 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center space-x-6">
                   <div className="w-16 h-16 bg-[#0f172a] text-[#d4af37] rounded-3xl flex items-center justify-center text-3xl font-serif italic shadow-2xl">
                      {detailOrder.roomId}
                   </div>
                   <div>
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{lang === 'zh' ? '订单深度明细' : 'Order Intelligence'}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <Hash size={14} className="text-[#d4af37]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">TXID: {detailOrder.id}</p>
                      </div>
                   </div>
                </div>
                <div className="flex items-center space-x-4">
                   <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white flex items-center space-x-2 ${getStatusColor(detailOrder.status)}`}>
                      <span>{getStatusLabel(detailOrder.status)}</span>
                   </div>
                   <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
                      {/* 选项：顶部打印按钮 */}
                      <button 
                        onClick={() => handlePrint(detailOrder)}
                        title={lang === 'zh' ? "重新打印票据" : "Re-print Ticket"}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-[#d4af37] hover:text-white transition-all shadow-sm border border-slate-100"
                      >
                         <Printer size={20} />
                      </button>
                      <button onClick={() => setDetailOrder(null)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-100">
                         <X size={20} />
                      </button>
                   </div>
                </div>
             </div>

             {/* 模态框主体内容 */}
             <div className="flex-1 overflow-y-auto p-10 lg:p-12 no-scrollbar space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {/* 左侧：商品清单 */}
                   <div className="space-y-8">
                      <div className="space-y-4">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center space-x-2">
                           <ShoppingBag size={14} />
                           <span>{lang === 'zh' ? '所购商品' : 'Items List'}</span>
                         </h5>
                         <div className="space-y-3">
                            {detailOrder.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
                                 <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-900 shadow-sm border border-slate-100">
                                       {item.quantity}
                                    </div>
                                    <p className="font-bold text-slate-900">{item.name}</p>
                                 </div>
                                 <span className="text-lg font-serif italic text-slate-900">₱{Math.round(item.price * item.quantity)}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* 右侧：账单摘要与审计 */}
                   <div className="space-y-10">
                      <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">{lang === 'zh' ? '财务摘要' : 'Financials'}</h5>
                         <div className="space-y-6">
                            <div className="flex justify-between text-slate-400">
                               <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                               <span className="font-bold">₱{Math.round(detailOrder.totalAmount - (detailOrder.taxAmount || 0) - (detailOrder.serviceCharge || 0))}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                               <span className="text-xs font-black uppercase tracking-widest">VAT (12%)</span>
                               <span className="font-bold">₱{Math.round(detailOrder.taxAmount || 0)}</span>
                            </div>
                            {detailOrder.serviceCharge && (
                              <div className="flex justify-between text-slate-400">
                                <span className="text-xs font-black uppercase tracking-widest">Service Charge</span>
                                <span className="font-bold">₱{Math.round(detailOrder.serviceCharge)}</span>
                              </div>
                            )}
                            <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                               <span className="text-sm font-black text-[#d4af37] uppercase tracking-[0.3em]">Total Billing</span>
                               <span className="text-4xl font-serif italic text-[#d4af37]">₱{Math.round(detailOrder.totalAmount)}</span>
                            </div>
                         </div>
                         <div className="mt-10 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center space-x-3">
                               <CreditCard size={18} className="text-slate-500" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{lang === 'zh' ? '支付渠道' : 'Method'}</span>
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">{detailOrder.paymentMethod}</span>
                         </div>
                      </div>

                      {/* 时间戳审计 */}
                      <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-6">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{lang === 'zh' ? '操作审计' : 'Audit Trail'}</h5>
                         <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                               <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Created At</p>
                                  <p className="text-sm font-bold text-slate-900">{new Date(detailOrder.createdAt).toLocaleString()}</p>
                               </div>
                            </div>
                            <div className="flex items-start space-x-4">
                               <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Update</p>
                                  <p className="text-sm font-bold text-slate-900">{new Date(detailOrder.updatedAt).toLocaleString()}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* 模态框底部操作 */}
             <div className="p-8 lg:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <button 
                  onClick={() => handlePrint(detailOrder)}
                  className="w-full sm:flex-1 h-16 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all flex items-center justify-center space-x-3 shadow-sm group"
                >
                   <Printer size={18} className="group-hover:text-[#d4af37] transition-colors" />
                   <span>{lang === 'zh' ? '重新打印后厨票据' : 'Re-print Kitchen Ticket'}</span>
                </button>
                {![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(detailOrder.status) && (
                  <button 
                    onClick={() => { setConfirmCancel({ isOpen: true, orderId: detailOrder.id }); }}
                    className="w-full sm:flex-1 h-16 bg-red-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-700 transition-all flex items-center justify-center space-x-3 shadow-xl"
                  >
                     <Ban size={18} />
                     <span>{t('voidOrder')}</span>
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* 取消确认模态框 */}
      <ConfirmationModal 
        isOpen={confirmCancel.isOpen}
        title={t('voidOrder')}
        message={lang === 'zh' ? '确定要取消该订单吗？此操作不可逆。' : 'Are you sure you want to cancel this order?'}
        confirmLabel={t('cancelled')}
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmCancel.orderId) onUpdateStatus(confirmCancel.orderId, OrderStatus.CANCELLED);
          setConfirmCancel({ isOpen: false, orderId: null });
          setDetailOrder(null);
        }}
        onCancel={() => setConfirmCancel({ isOpen: false, orderId: null })}
        lang={lang}
      />
    </div>
  );
};

export default OrderManagement;

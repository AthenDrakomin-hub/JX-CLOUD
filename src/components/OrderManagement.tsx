import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Order, OrderStatus, User, SystemConfig } from '../../types';
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
      o.room_id.toLowerCase().includes(searchTerm.toLowerCase())
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
         
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-slate-600">标准模式</span>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isKdsMode}
                    onChange={(e) => setIsKdsMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
               </label>
               <span className="text-sm font-bold text-slate-600">KDS模式</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
               <Clock size={16} className="text-slate-400" />
               <span className="text-sm font-bold text-slate-600">
                  {filteredOrders.length} {t('orders')}
               </span>
            </div>
         </div>
      </div>

      {/* 订单列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map(o => (
          <div 
            key={o.id} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => setViewingOrder(o)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">
                    订单 #{o.id.slice(-6)}
                  </h3>
                  {/* Fix: Changed 'roomId' to 'room_id' to match database structure */}
                  <p className="text-slate-500 font-bold mt-1">房间 {o.room_id}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getStatusColor(o.status)}`}>
                  {t(o.status)}
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {o.items.slice(0, 2).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="text-slate-500">x{item.quantity}</span>
                  </div>
                ))}
                {o.items.length > 2 && (
                  <div className="text-center text-slate-400 text-sm font-bold">
                    +{o.items.length - 2} 更多项
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-serif italic text-slate-900 font-bold">
                    ₱{o.total_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(o.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {o.status === OrderStatus.PENDING && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(o.id, OrderStatus.PREPARING);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                    >
                      <ChefHat size={16} />
                      接受
                    </button>
                  )}
                  {o.status === OrderStatus.PREPARING && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(o.id, OrderStatus.COMPLETED);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                    >
                      <CheckCircle2 size={16} />
                      完成
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrint(o);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredOrders.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">暂无订单</h3>
            <p className="text-slate-500">没有找到匹配的订单记录</p>
          </div>
        )}
      </div>

      {/* 订单详情模态框 */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">
                订单详情
              </h2>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Fix: Changed 'roomId' to 'room_id' to match database structure */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {t('station')}
                  </p>
                  <p className="text-5xl font-black text-slate-950 tracking-tighter">
                    {viewingOrder.room_id}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    状态
                  </p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-black uppercase ${getStatusColor(viewingOrder.status)}`}>
                    {t(viewingOrder.status)}
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    总额
                  </p>
                  <p className="text-3xl font-black text-slate-950 tracking-tighter">
                    ₱{viewingOrder.total_amount.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    时间
                  </p>
                  <p className="text-lg font-bold text-slate-700">
                    {new Date(viewingOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-black text-lg text-slate-900 mb-4">订单项</h3>
                <div className="space-y-3">
                  {viewingOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">单价: ₱{item.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">x{item.quantity}</p>
                        <p className="text-sm text-slate-500">小计: ₱{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                {viewingOrder.status === OrderStatus.PENDING && (
                  <button
                    onClick={() => {
                      onUpdateStatus(viewingOrder.id, OrderStatus.PREPARING);
                      setViewingOrder(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.75rem] font-bold transition-colors"
                  >
                    <ChefHat className="w-5 h-5" />
                    接受订单
                  </button>
                )}
                {viewingOrder.status === OrderStatus.PREPARING && (
                  <button
                    onClick={() => {
                      onUpdateStatus(viewingOrder.id, OrderStatus.COMPLETED);
                      setViewingOrder(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.75rem] font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    完成订单
                  </button>
                )}
                <button
                  onClick={() => {
                    handlePrint(viewingOrder);
                    setViewingOrder(null);
                  }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[1.75rem] font-bold transition-colors"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 打印样式（隐藏元素） */}
      {printing && (
        <div className="print-container hidden">
          <div className="p-8 max-w-xs mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-slate-900 mb-2">江西云厨</h1>
              <p className="text-sm text-slate-500">订单 #{printing.id.slice(-6)}</p>
              <p className="text-lg font-bold mt-2">房间 {printing.room_id}</p>
            </div>
            
            <div className="border-t border-slate-200 pt-4 mb-6">
              {printing.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-slate-500">x{item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center text-lg font-black">
                <span>总计:</span>
                <span>₱{printing.total_amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <QRCodeSVG value={printing.id} size={120} />
              <p className="text-xs text-slate-500 mt-2">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
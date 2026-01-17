import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import { Language, getTranslation } from '../translations';
import { api } from '../services/api';
import { notificationService } from '../services/notification';
import { createSupabaseClient } from '../services/supabaseClient';
import { Clock, Package, CheckCircle, MapPin, Phone, ChefHat, CalendarCheck } from 'lucide-react';

interface DeliveryDashboardProps {
  lang: Language;
  currentUser: any; // 传递当前用户信息
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ lang, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeOrders, setRealtimeOrders] = useState<Order[]>([]);
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  // 使用全局 Supabase 客户端
  const supabase = createSupabaseClient();

  // 加载待送餐订单
  const loadReadyOrders = useCallback(async () => {
    try {
      const allOrders = await api.orders.getAll(currentUser);
      // 过滤出待送餐的订单
      const readyOrders = allOrders.filter(
        order => order.status === 'ready_for_delivery' || order.status === 'preparing'
      );
      setOrders(readyOrders);
      setRealtimeOrders(readyOrders);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 实时监听订单状态变更
  useEffect(() => {
    if (!supabase || !currentUser) return;

    // 订阅订单状态变更
    const channel = supabase
      .channel('delivery_orders_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=in.(ready_for_delivery,delivered,completed)'
        },
        (payload) => {
          const updatedOrder = {
            ...payload.new,
            totalAmount: Number(payload.new.total_amount),
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at
          } as Order;

          // 更新订单列表
          setRealtimeOrders(prev => {
            const existingIndex = prev.findIndex(order => order.id === updatedOrder.id);
            if (existingIndex >= 0) {
              const newOrders = [...prev];
              newOrders[existingIndex] = updatedOrder;
              return newOrders;
            } else {
              return [...prev, updatedOrder];
            }
          });

          // 如果是新变为待送餐状态，播放通知
          if (payload.old.status !== 'ready_for_delivery' && payload.new.status === 'ready_for_delivery') {
            notificationService.broadcastOrderVoice(updatedOrder, lang);
            
            // 显示浏览器通知
            if (Notification.permission === 'granted') {
              new Notification('待送餐订单', {
                body: `房间 ${updatedOrder.roomId} 的订单已准备好，请及时送餐！`,
                icon: '/favicon.ico',
                tag: `delivery-${updatedOrder.id}`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, currentUser, lang]);

  // 刷新订单
  useEffect(() => {
    loadReadyOrders();
  }, [loadReadyOrders]);

  // 更新订单状态
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.orders.updateStatus(orderId, newStatus as any);
      await loadReadyOrders(); // 重新加载订单
    } catch (error) {
      console.error('更新订单状态失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Package size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {t('delivery_dashboard')}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              {t('real_time_tracking')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {realtimeOrders.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-500 mb-2">{t('no_pending_deliveries')}</h3>
            <p className="text-slate-400">{t('all_deliveries_completed')}</p>
          </div>
        ) : (
          realtimeOrders.map(order => (
            <div 
              key={order.id} 
              className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden transition-all hover:shadow-lg ${
                order.status === 'ready_for_delivery' ? 'border-green-200 bg-green-50' : 
                order.status === 'preparing' ? 'border-yellow-200 bg-yellow-50' : 
                'border-slate-200'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin size={16} className="text-blue-600" />
                      <span className="font-black text-lg">房间 {order.roomId}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <CalendarCheck size={14} />
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'ready_for_delivery' ? 'bg-green-100 text-green-800' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {order.status === 'ready_for_delivery' ? (lang === 'zh' ? '待送餐' : 'Ready for Delivery') :
                     order.status === 'preparing' ? (lang === 'zh' ? '制作中' : 'Preparing') :
                     order.status}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-slate-700 mb-2">{t('order_items')}:</h4>
                  <ul className="space-y-1">
                    {(order.items || []).map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex justify-between">
                        <span>{item.name || item.dishId} × {item.quantity}</span>
                        {item.note && <span className="text-xs text-orange-600">{item.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready_for_delivery')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ChefHat size={14} />
                      <span>{t('mark_ready')}</span>
                    </button>
                  )}
                  
                  {order.status === 'ready_for_delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Package size={14} />
                      <span>{t('deliver')}</span>
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle size={14} />
                      <span>{t('complete')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
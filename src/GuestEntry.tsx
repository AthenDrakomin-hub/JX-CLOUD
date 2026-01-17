import React, { useState, useEffect, useCallback } from 'react';
import { Dish, Order, Category, PaymentMethodConfig } from './types';
import { Language, getTranslation } from './translations';
import { api } from './services/api';
import GuestOrder from './components/GuestOrder';

/**
 * 客户点餐入口页面
 * 处理通过二维码扫描进入的匿名点餐流程
 */
const GuestEntry: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('zh');

  const t = useCallback((key: string, params?: any) => getTranslation(lang, params ? key : key, params), [lang]);

  useEffect(() => {
    // 从 URL 参数获取房间 ID
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (!roomParam) {
      setError('无效的房间链接。请通过房间二维码进入点餐界面。');
      setLoading(false);
      return;
    }

    setRoomId(roomParam);

    // 加载菜品数据
    const loadData = async () => {
      try {
        // 以演示模式加载数据（无需认证）
        const loadedDishes = await api.dishes.getAll();
        const loadedCategories = await api.categories.getAll();
        
        setDishes(loadedDishes);
        setCategories(loadedCategories);
        setLoading(false);
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('加载菜单数据失败，请稍后重试。');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOrderSubmit = async (order: Partial<Order>) => {
    if (!roomId) return;

    try {
      // 提交订单到数据库
      const newOrder: Order = {
        ...order,
        id: `ORD-${Date.now()}`,
        roomId: roomId,
        customerId: undefined,
        items: order.items || [],
        totalAmount: order.totalAmount || 0,
        status: 'pending',
        paymentMethod: order.paymentMethod || '',
        paymentProof: order.paymentProof || '',
        cash_received: order.cash_received || 0,
        cash_change: order.cash_change || 0,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
      };

      await api.orders.create(newOrder);

      // 检查是否需要自动打印
      const systemConfig = await api.config.get();
      if (systemConfig.autoPrintOrder) {
        // 在实际部署中，这里会连接到后端打印服务
        console.log('Auto-print enabled, order would be sent to printer');
        
        // 模拟打印行为 - 在实际应用中，这会调用打印服务API
        setTimeout(() => {
          console.log(`Order ${newOrder.id} sent to kitchen printer for room ${roomId}`);
        }, 1000);
      }

      // 显示成功消息
      alert('订单提交成功！厨房已收到您的订单。');
    } catch (err) {
      console.error('提交订单失败:', err);
      alert('订单提交失败，请稍后重试。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载菜单...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">错误</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return null;
  }

  return (
    <GuestOrder 
      roomId={roomId}
      dishes={dishes}
      categories={categories}
      onSubmitOrder={handleOrderSubmit}
      lang={lang}
      onToggleLang={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')}
      onRescan={() => window.location.reload()}
    />
  );
};

export default GuestEntry;
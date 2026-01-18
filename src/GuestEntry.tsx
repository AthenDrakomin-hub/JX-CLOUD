import React, { useState, useEffect } from 'react';
import { Dish, Order, Category, PaymentMethodConfig } from './types';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
      alert(t('order_submitted_success')); // Using translated message
    } catch (err) {
      console.error('提交订单失败:', err);
      alert(t('order_submit_failed')); // Using translated message
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

  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <GuestOrder 
      roomId={roomId}
      dishes={dishes}
      categories={categories}
      onSubmitOrder={handleOrderSubmit}
      lang={i18n.language as any} // Pass current i18next language
      onToggleLang={toggleLanguage}
      onRescan={() => window.location.reload()}
    />
  );
};

export default GuestEntry;
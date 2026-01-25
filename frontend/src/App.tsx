import React, { useState, useEffect } from 'react';
import { Bell, Mail } from 'lucide-react';
import { roomApi, dishApi, orderApi, Room, Dish, Order } from './services/api';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'dashboard', label: '仪表板' },
    { id: 'rooms', label: '房间管理' },
    { id: 'orders', label: '订单管理' },
    { id: 'menu', label: '菜单管理' },
  ];

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsData, dishesData, ordersData] = await Promise.all([
        roomApi.getAll(),
        dishApi.getAll(),
        orderApi.getAll()
      ]);
      setRooms(roomsData);
      setDishes(dishesData);
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] border border-blue-400/20 mb-4">
              <Mail size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">JX CLOUD</h1>
            <p className="text-slate-400 mt-2 text-sm">安全认证中心</p>
          </div>
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="邮箱地址" 
              className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white"
            />
            <input 
              type="password" 
              placeholder="密码" 
              className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white"
            />
            <button 
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors"
              onClick={() => setIsLoggedIn(true)}
            >
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">JX Cloud</h1>
        </div>
        <nav className="mt-6">
          <ul>
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  className={`w-full text-left px-6 py-3 ${currentTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setCurrentTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <main className="ml-64">
        <header className="sticky top-0 z-10 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold capitalize">{currentTab}</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => setIsLoggedIn(false)}
            >
              退出
            </button>
          </div>
        </header>

        <div className="p-6">
          {loading && <div className="text-center py-10">加载中...</div>}
          {error && <div className="text-red-500 text-center py-10">错误: {error}</div>}
          
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">欢迎使用 JX Cloud 酒店管理系统</h3>
              <p>当前页面: {currentTab}</p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">房间总数</h4>
                  <p className="text-2xl font-bold text-blue-600">{rooms.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800">菜品总数</h4>
                  <p className="text-2xl font-bold text-green-600">{dishes.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800">订单总数</h4>
                  <p className="text-2xl font-bold text-purple-600">{orders.length}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">最近订单</h4>
                {orders.slice(0, 3).map(order => (
                  <div key={order._id} className="border-b py-2">
                    <p>房间: {order.roomNumber} | 状态: {order.status} | 金额: ¥{order.totalAmount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
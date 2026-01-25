import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { roomApi, dishApi, orderApi, Room, Dish, Order } from './services/api';

const App: React.FC = () => {
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
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomGrid from './components/RoomGrid';
import OrderManagement from './components/OrderManagement';
import SupplyChainManager from './components/SupplyChainManager';
import FinancialCenter from './components/FinancialCenter';
import StaffManagement from './components/StaffManagement';
import SystemSettings from './components/SystemSettings';
import DatabaseManagement from './components/DatabaseManagement';
import CommandCenter from './components/CommandCenter';
import NotificationCenter from './components/NotificationCenter';
import ImageManagement from './components/ImageManagement';
import AuthPage from './components/AuthPage';
import DeliveryDashboard from './components/DeliveryDashboard';
import GuestEntry from './GuestEntry';  // This is correct since both are in src/
import Toast, { ToastType } from './components/Toast';
import { useSession, signOut } from './services/auth-client';
import { api } from './services/api';
import { isDemoMode, createSupabaseClient } from './services/supabaseClient';
// 保持对supabase的引用，仅用于实时功能
const supabase = createSupabaseClient();
import { notificationService } from './services/notification';
import { INITIAL_USERS } from './constants';
import { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole,
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense 
} from './types';
import MenuVerification from './components/MenuVerification';
import BiometricSetupPage from './components/BiometricSetupPage';
import { Wifi, WifiOff, Command } from 'lucide-react';
import i18n from './i18n';

export default function App() {
  const { t, i18n } = useTranslation();
  const { data: session, isLoading: isAuthLoading } = useSession();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [config, setConfig] = useState<SystemConfig>();
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // 检查是否是访客模式 (通过URL参数)
  const urlParams = new URLSearchParams(window.location.search);
  const isGuestMode = !!urlParams.get('room');

  const refreshData = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const [configRes, roomsRes, ordersRes, dishesRes, categoriesRes, partnersRes, usersRes, expensesRes] = await Promise.all([
        api.config.get(),
        api.rooms.getAll(),
        api.orders.getAll(),
        api.dishes.getAll({ partnerId: session.user.partnerId }),
        api.categories.getAll({ partnerId: session.user.partnerId }),
        api.partners.getAll(),
        api.users.getAll({ partnerId: session.user.partnerId }),
        api.expenses.getAll({ partnerId: session.user.partnerId })
      ]);
      
      setConfig(configRes);
      setRooms(roomsRes);
      setOrders(ordersRes);
      setDishes(dishesRes);
      setCategories(categoriesRes);
      setPartners(partnersRes);
      setUsers(usersRes);
      setExpenses(expensesRes);
    } catch (error) {
      console.error("Data refresh failed:", error);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      refreshData();
    }
  }, [session, refreshData]);

  useEffect(() => {
    // 设置语言
    const savedLang = localStorage.getItem('jx_lang') || 'zh';
    i18n.changeLanguage(savedLang);
  }, [i18n]);

  useEffect(() => {
    // 实时订单订阅
    if (!session?.user || !supabase) return;
    
    const channel = supabase.channel('orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('Realtime order update:', payload);
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          notificationService.broadcastOrderVoice(newOrder, i18n.language as 'zh' | 'en' | 'fil', 1.0);
          refreshData();
        }
    }).subscribe((s: any) => setIsRealtimeActive(s === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [session, i18n.language, t, refreshData]);

  if (isGuestMode) {
    // 如果是访客模式，直接渲染访客点餐界面
    return <GuestEntry />;
  }

  if (isAuthLoading && !localStorage.getItem('jx_root_authority_bypass')) {
    return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6"><div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">JX CLOUD SECURE LINK...</p></div>;
  }

  if (!session?.user) {
    return <AuthPage />;
  }

  const handleLogout = async () => {
    localStorage.removeItem('jx_root_authority_bypass');
    await signOut();
    window.location.reload();
  };
  
  // 急救模式：启动检测
  // if (true) return <div style={{padding: '50px', color: 'red', background: 'white', zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>App 核心已启动！看到此行说明挂载成功。</div>;

  // 数据库业务验证：使用专门的验证组件
  // 检查是否为管理员且需要绑定生物识别
  if (session?.user?.role === 'admin') {
    // 这里可以添加逻辑检查用户是否已绑定生物识别
    // 暂时假设所有管理员都需要设置生物识别
    // 在实际实现中，我们会检查用户是否有相关的 passkey 记录
    // Check if user has biometric setup - for now defaulting to false to allow access
    // In production, this would check if the user has existing passkey records
    const needsBiometricSetup = false; // Temporarily set to false to allow dashboard access
    
    if (needsBiometricSetup) {
      return <BiometricSetupPage />;
    }
  }
  


  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-500 ${config?.theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`} style={{ fontFamily: config?.fontFamily || 'Plus Jakarta Sans' }}>
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} currentUser={session.user} onLogout={handleLogout} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className={`transition-all duration-500 min-h-screen ${isSidebarCollapsed ? 'ml-24' : 'ml-72'}`}>
          <header className="sticky top-0 z-50 px-10 py-6 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl flex items-center justify-between border-b border-white/10 no-print">
            <div className="flex items-center space-x-4">
               <button onClick={() => setIsCommandOpen(true)} className="flex items-center space-x-3 px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95"><Command size={14} /><span>{t('search')} ⌘K</span></button>
               <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${isRealtimeActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{isRealtimeActive ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}<span className="text-[8px] font-black uppercase">{isRealtimeActive ? t('sync_active') : t('sync_offline')}</span></div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={i18n.language} 
                onChange={(e) => {
                  i18n.changeLanguage(e.target.value);
                  localStorage.setItem('jx_lang', e.target.value);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="fil">Filipino</option>
              </select>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </header>
          <div className="p-10">
            {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} ingredients={ingredients} partners={partners} currentUser={session.user as any} />}
            {currentTab === 'rooms' && <RoomGrid rooms={rooms} dishes={dishes} categories={categories} onUpdateRoom={async(r) => { await api.rooms.update(r.id, r); refreshData(); }} onRefresh={refreshData} />}
            {currentTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={async (id, status) => { await api.orders.updateStatus(id, status); refreshData(); }} currentUser={session.user as any} />}
            {currentTab === 'supply_chain' && <SupplyChainManager dishes={dishes} categories={categories} currentUser={session.user as any} partners={partners} onAddDish={async(d) => { await api.dishes.create(d, session.user); refreshData(); }} onUpdateDish={async(d) => { await api.dishes.update(d, session.user); refreshData(); }} onDeleteDish={async(id) => { await api.dishes.delete(id, session.user); refreshData(); }} onRefreshData={refreshData} />}
            {currentTab === 'images' && <ImageManagement />}
            {currentTab === 'financial_hub' && <FinancialCenter orders={orders} expenses={expenses} partners={partners} currentUser={session.user as any} onAddExpense={async(ex)=>{ await api.expenses.create(ex); refreshData(); }} onDeleteExpense={async(id)=>{ await api.expenses.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} />}
            {currentTab === 'users' && <StaffManagement users={users} partners={partners} currentUser={session.user} onRefresh={refreshData} onAddUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onUpdateUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onDeleteUser={async(id)=>{ await api.users.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} />}
            {currentTab === 'settings' && <SystemSettings onUpdateConfig={async(c)=>{ await api.config.update(c); refreshData(); }} />}
            {currentTab === 'menu' && <DatabaseManagement />}
            {currentTab === 'delivery' && <DeliveryDashboard currentUser={session.user} />}
          </div>
        </main>
        <CommandCenter isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} rooms={rooms} orders={orders} dishes={dishes} onNavigate={setCurrentTab} onToggleTheme={() => {}} onLogout={handleLogout} />
        <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setNotifications([])} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </ErrorBoundary>
  );
}
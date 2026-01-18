import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js'; // Keep this as it's the main dashboard
import RoomGrid from './components/RoomGrid.js'; // Keep this as it's likely used frequently
import OrderManagement from './components/OrderManagement.js'; // Keep this as it's core functionality
import AuthPage from './components/AuthPage.js';
import GuestEntry from './GuestEntry.js';  // This is correct since both are in src/
import Toast, { ToastType } from './components/Toast.js';
import { useSession, safeSignOut as signOut } from './services/auth-client.js';
import { api } from './services/api.js';
import { isDemoMode, createSupabaseClient } from './services/supabaseClient.js';
// 保持对supabase的引用，仅用于实时功能
const supabase = createSupabaseClient();
import { notificationService } from './services/notification.js';
import { INITIAL_USERS } from './constants.js';
import { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole,
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense 
} from './types.js';
import UserBiometricSetup from './components/UserBiometricSetup.js';
import BiometricSetupPage from './components/BiometricSetupPage.js';
import { Wifi, WifiOff, Command, CheckCircle2 } from 'lucide-react';
import i18n from './i18n/index.js';



// Lazy load non-critical components for better initial load performance
const SupplyChainManager = lazy(() => import('./components/SupplyChainManager.js'));
const FinancialCenter = lazy(() => import('./components/FinancialCenter.js'));
const ImageManagement = lazy(() => import('./components/ImageManagement.js'));
const StaffManagement = lazy(() => import('./components/StaffManagement.js'));
const SystemSettings = lazy(() => import('./components/SystemSettings.js'));
const DatabaseManagement = lazy(() => import('./components/DatabaseManagement.js'));
const CommandCenter = lazy(() => import('./components/CommandCenter.js'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter.js'));
const DeliveryDashboard = lazy(() => import('./components/DeliveryDashboard.js'));

// Loading component for lazy-loaded components
const LoadingComponent = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
    <span>{message}</span>
  </div>
);

export default function App() {
  // 🔧 改进的 URL hash 清理机制
  const cleanUnwantedHash = useCallback(() => {
    // 定义需要清理的 unwanted hash 值
    const unwantedHashes = ['#welcome-shown', '#welcome', '#home'];
    
    if (typeof window !== 'undefined' && unwantedHashes.includes(window.location.hash)) {
      console.log('🔧 Cleaning unwanted hash:', window.location.hash);
      // 使用 replaceState 而不是直接修改 location，避免产生历史记录
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
      return true; // 表示进行了清理
    }
    return false; // 表示无需清理
  }, []);
  const { t, i18n } = useTranslation();
  
  // 🔧 在应用启动时和路由变化时都清理 hash
  const [hashCleaned, setHashCleaned] = useState(false);
  
  useEffect(() => {
    const wasCleaned = cleanUnwantedHash();
    if (wasCleaned) {
      setHashCleaned(true);
    }
  }, [cleanUnwantedHash]);
  

  

  
  // 🔧 严格认证状态管理 - 修复竞态条件
  const sessionResult = useSession();
  const session = sessionResult?.data || sessionResult;
  const isAuthLoading = sessionResult?.isLoading || false;
  
  // 🔧 严格化加载状态：在认证状态确定前绝不渲染主界面
  const isAuthReady = !isAuthLoading && sessionResult !== undefined;
  const isAuthenticated = session?.data?.user !== undefined && session?.data?.user !== null;

  // 监听会话过期，提前提醒用户
  useEffect(() => {
    if (session?.data?.session?.expiresAt) {
      const expiryTime = new Date(session.data.session.expiresAt);
      const currentTime = new Date();
      const timeUntilExpiry = expiryTime.getTime() - currentTime.getTime();
      
      // 如果会话即将过期（在10分钟内），提前提醒
      if (timeUntilExpiry > 0 && timeUntilExpiry <= 10 * 60 * 1000) { // 10分钟
        setTimeout(() => {
          alert('会话即将过期，请注意保存工作');
        }, timeUntilExpiry - 5 * 60 * 1000); // 提前5分钟提醒
      }
      
      // 如果会话已经过期，自动登出
      if (expiryTime < currentTime) {
        alert('会话已过期，请重新登录');
        signOut();
      }
    }
  }, [session]);


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
  
  // 检查当前路径
  const currentPath = window.location.pathname;
  const isAdminSetupPage = currentPath === '/auth/admin-setup';
  const isRegisterPasskeyPage = currentPath === '/auth/register-passkey';
  
  // 从URL参数获取注册相关信息
  const userId = urlParams.get('userId');
  const token = urlParams.get('token');

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

  // 如果是管理员设置页面或注册页面，直接渲染生物识别设置组件
  if (isAdminSetupPage || isRegisterPasskeyPage) {
    const mode = isAdminSetupPage ? 'admin' : (userId && token ? 'invite' : 'employee');
    return <UserBiometricSetup mode={mode} userId={userId} token={token} />;
  }

  if (isGuestMode) {
    // 如果是访客模式，直接渲染访客点餐界面
    return <GuestEntry />;
  }

  // 🔧 严格认证守卫：在认证状态完全确定前显示加载界面
  if (!isAuthReady) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
          JX CLOUD SECURE LINK...
        </p>
        <p className="text-[8px] text-slate-500 uppercase tracking-widest">
          verifying authentication status
        </p>
      </div>
    );
  }

  // 🔧 严格的认证检查逻辑
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleLogout = async () => {
    console.log('开始执行登出操作');
    localStorage.removeItem('jx_root_authority_bypass');
    // safeSignOut 已经处理了重定向，所以我们只需要调用它
    await signOut(); // This is now safeSignOut which handles redirection internally
    console.log('登出操作完成');
  };
  
  // 检查是否为管理员且需要绑定生物识别
  if (session?.user?.role === 'admin') {
    // Check if user has biometric setup - for now defaulting to false to allow access
    // In production, this would check if the user has existing passkey records
    const needsBiometricSetup = false; // Temporarily set to false to allow dashboard access
    
    if (needsBiometricSetup) {
      return <BiometricSetupPage />;
    }
  }

  return (
    <>

      
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
            {currentTab === 'supply_chain' && (
              <Suspense fallback={<LoadingComponent message="Loading supply chain manager..." />}>
                <SupplyChainManager dishes={dishes} categories={categories} currentUser={session.user as any} partners={partners} onAddDish={async(d) => { await api.dishes.create(d, session.user); refreshData(); }} onUpdateDish={async(d) => { await api.dishes.update(d, session.user); refreshData(); }} onDeleteDish={async(id) => { await api.dishes.delete(id, session.user); refreshData(); }} onRefreshData={refreshData} />
              </Suspense>
            )}
            {currentTab === 'images' && (
              <Suspense fallback={<LoadingComponent message="Loading image management..." />}>
                <ImageManagement />
              </Suspense>
            )}
            {currentTab === 'financial_hub' && (
              <Suspense fallback={<LoadingComponent message="Loading financial center..." />}>
                <FinancialCenter orders={orders} expenses={expenses} partners={partners} currentUser={session.user as any} onAddExpense={async(ex)=>{ await api.expenses.create(ex); refreshData(); }} onDeleteExpense={async(id)=>{ await api.expenses.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} />
              </Suspense>
            )}
            {currentTab === 'users' && (
              <Suspense fallback={<LoadingComponent message="Loading staff management..." />}>
                <StaffManagement users={users} partners={partners} currentUser={session.user} onRefresh={refreshData} onAddUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onUpdateUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onDeleteUser={async(id)=>{ await api.users.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} />
              </Suspense>
            )}
            {currentTab === 'settings' && (
              <Suspense fallback={<LoadingComponent message="Loading system settings..." />}>
                <SystemSettings onUpdateConfig={async(c)=>{ await api.config.update(c); refreshData(); }} />
              </Suspense>
            )}
            {currentTab === 'menu' && (
              <Suspense fallback={<LoadingComponent message="Loading database management..." />}>
                <DatabaseManagement />
              </Suspense>
            )}
            {currentTab === 'delivery' && (
              <Suspense fallback={<LoadingComponent message="Loading delivery dashboard..." />}>
                <DeliveryDashboard currentUser={session.user} />
              </Suspense>
            )}
          </div>
        </main>
        <Suspense fallback={null}>
          <CommandCenter isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} rooms={rooms} orders={orders} dishes={dishes} onNavigate={setCurrentTab} onToggleTheme={() => {}} onLogout={handleLogout} />
        </Suspense>
        <Suspense fallback={null}>
          <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setNotifications([])} />
        </Suspense>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}
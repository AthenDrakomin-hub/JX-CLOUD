import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import GuestOrder from './components/GuestOrder';
import Toast, { ToastType } from './components/Toast';
import { safeSignOut } from './services/frontend/auth-client.frontend';
import { api } from './services/api';
import { supabase, isDemoMode } from './services/supabaseClient';
import { notificationService } from './services/frontend/notification.frontend';
import { 
  HotelRoom, Order, Dish, OrderStatus, 
  Expense, Partner, Category, SystemConfig, User, UserRole, Language 
} from './types';
import { getTranslation } from './constants/translations';
import { Bell, Command, Loader2, ShieldCheck, Wifi, WifiOff, AlertTriangle, X, Lock } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [remoteSession, setRemoteSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // 现在这是真实的加载状态
  const [lang, setLang] = useState<Language>('zh');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [expiryLevel, setExpiryLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  const routeState = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    return {
      roomId: params.get('room'),
      activationToken: params.get('activate'),
      isAdminSetup: pathname === '/auth/admin-setup'
    };
  }, []);

  const session = useMemo(() => {
    // 保留你的开发模式 bypass 功能
    const bypass = localStorage.getItem('jx_root_authority_bypass');
    if (bypass === 'true') {
      return {
        user: {
          id: 'root-athen-god-mode',
          name: 'Athen Drakomin (Master)',
          email: 'athendrakomin@proton.me',
          role: UserRole.ADMIN,
          isRoot: true
        },
        session: { expiresAt: new Date(Date.now() + 86400000).toISOString() }
      };
    }
    
    // 生产环境使用 Supabase 返回的真实会话
    if (remoteSession) {
      return {
        user: {
          id: remoteSession.user.id,
          name: remoteSession.user.user_metadata?.name || remoteSession.user.email,
          email: remoteSession.user.email,
          role: (remoteSession.user.user_metadata?.role as UserRole) || UserRole.STAFF,
          isRoot: remoteSession.user.email === 'athendrakomin@proton.me'
        },
        session: { expiresAt: remoteSession.expires_at }
      };
    }

    return null;
  }, [remoteSession]);

  // 🔑 新增：监听 Supabase 认证状态，这是自动登录的核心
  const t = useCallback((key: string, params?: any) => getTranslation(lang, key, params), [lang]);

  const toggleLanguage = useCallback(() => {
    setLang(p => p === 'zh' ? 'en' : p === 'en' ? 'fil' : 'zh');
  }, []);

  useEffect(() => {
    if (isDemoMode || !supabase) return;

    // 初始化：获取当前已有的会话
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setRemoteSession(session);
      setIsAuthLoading(false);
      console.log("📌 应用初始化，Supabase 会话:", session?.user?.email);
    };

    initializeAuth();

    // 实时监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log("🔑 Supabase 认证状态变更:", event, session?.user?.email);
        
        setRemoteSession(session);
        setIsAuthLoading(false);

        // 如果是通过魔法链接登录，可以在这里添加额外的逻辑
        if (event === "SIGNED_IN" && session) {
          // 可以在这里显示欢迎通知
          setToast({ 
            message: t('welcome_back', { user: session.user.email }), 
            type: 'success' 
          });
        }
      }
    );

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [isDemoMode, supabase, t]);

  useEffect(() => {
    if (!session?.session?.expiresAt) return;
    
    const checkExpiry = () => {
      const expiresAt = new Date(session.session.expiresAt).getTime();
      const now = Date.now();
      const timeLeft = expiresAt - now;
      
      if (timeLeft <= 0) {
        safeSignOut();
      } else if (timeLeft < 300000) {
        setExpiryLevel('critical');
      } else if (timeLeft < 600000) {
        setExpiryLevel('warning');
      } else {
        setExpiryLevel('normal');
      }
    };

    const interval = setInterval(checkExpiry, 20000);
    checkExpiry();
    return () => clearInterval(interval);
  }, [session]);

  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    if (routeState.roomId) {
      try {
        const [d, c] = await Promise.all([api.dishes.getAll(), api.categories.getAll()]);
        setDishes(d);
        setCategories(c);
      } catch (e) { console.error("Guest data sync failed"); }
      finally { setIsLoading(false); }
      return;
    }

    if (!session?.user) return;
    
    try {
      const [r, d, o, c, p, e, u, sys] = await Promise.all([
        api.rooms.getAll(),
        api.dishes.getAll(session.user),
        api.orders.getAll(session.user),
        api.categories.getAll(),
        api.partners.getAll(),
        api.expenses.getAll(),
        api.users.getAll(),
        api.config.get()
      ]);
      
      setRooms(r);
      setDishes(d);
      setOrders(o);
      setCategories(c);
      setPartners(p);
      setExpenses(e);
      setUsers(u);
      setConfig(sys);
    } catch (err) {
      console.error("Critical: Data synchronization failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [session, routeState.roomId]);

  useEffect(() => {
    refreshData();
    if (session?.user && !routeState.roomId) {
      notificationService.requestPermission();
    }
  }, [session, refreshData, routeState.roomId]);

  useEffect(() => {
    if (isDemoMode || !supabase || !session?.user || routeState.roomId) return;
    const channel = supabase.channel('orders_realtime_v12').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const updatedOrder = { ...payload.new, totalAmount: Number((payload.new as any).total_amount) } as any;
          setOrders(prev => [updatedOrder, ...prev]);
          notificationService.broadcastOrderVoice(updatedOrder, lang);
          setToast({ message: t('new_order_toast', { room: updatedOrder.room_id }), type: 'success' });
        } else { refreshData(); }
    }).subscribe((s: any) => setIsRealtimeActive(s === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [session, lang, t, refreshData, routeState.roomId]);

  if (routeState.roomId) {
    return (
      <div className="bg-white min-h-screen">
        <GuestOrder 
          roomId={routeState.roomId} dishes={dishes} categories={categories}
          onSubmitOrder={async (order) => {
            await api.orders.create(order as Order);
            setToast({ message: t('success'), type: 'success' });
          }}
          lang={lang}
          onToggleLang={toggleLanguage}
          onRescan={() => window.location.href = window.location.origin}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }



  if (isAuthLoading && !localStorage.getItem('jx_root_authority_bypass')) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">JX CLOUD SECURE LINK...</p>
      </div>
    );
  }

  if (!session?.user) {
    return <AuthPage lang={lang} onToggleLang={toggleLanguage} />;
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className={`min-h-screen transition-colors duration-500 ${config?.theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`} style={{ fontFamily: config?.fontFamily || 'Plus Jakarta Sans' }}>
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} currentUser={session.user} onLogout={safeSignOut} lang={lang} onToggleLang={toggleLanguage} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        
        <main className={`transition-all duration-500 min-h-screen ${isSidebarCollapsed ? 'ml-24' : 'ml-72'}`}>
          <header className="sticky top-0 z-50 px-10 py-6 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl flex items-center justify-between border-b border-white/10 no-print">
            <div className="flex items-center space-x-4">
               <button onClick={() => setIsCommandOpen(true)} className="flex items-center space-x-3 px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active-scale-95"><Command size={14} /><span>{t('search')} ⌘K</span></button>
               <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${isRealtimeActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{isRealtimeActive ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}<span className="text-[8px] font-black uppercase">{isRealtimeActive ? t('sync_active') : t('sync_offline')}</span></div>
            </div>
            <button onClick={() => setIsNotifOpen(true)} className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 relative shadow-sm hover:text-blue-600 transition-colors"><Bell size={18} />{notifications.some(n => !n.read) && <div className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full animate-ping" />}</button>
          </header>
          
          <div className="p-10 lg:p-12 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)] relative">
            
            {expiryLevel !== 'normal' && (
              <div className={`mb-8 p-6 rounded-[2rem] border-2 flex items-center justify-between animate-in slide-in-from-top-4 ${expiryLevel === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                 <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl shadow-lg animate-pulse ${expiryLevel === 'critical' ? 'bg-red-500' : 'bg-amber-500'} text-white`}><AlertTriangle size={24} /></div>
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-tight ${expiryLevel === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                        {expiryLevel === 'critical' ? '会话即将强制失效' : '会话授权周期将满'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">请保存当前财务流水并重新执行生物识别准入协议。</p>
                    </div>
                 </div>
                 <button onClick={safeSignOut} className={`px-8 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${expiryLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>立即刷新授权</button>
              </div>
            )}

            {expiryLevel === 'critical' && (
              <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
                 <div className="bg-white rounded-[4rem] p-16 max-w-lg w-full text-center space-y-10 shadow-[0_0_100px_rgba(239,68,68,0.3)] border-4 border-red-500/20">
                    <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Lock size={48} /></div>
                    <div className="space-y-4">
                       <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter italic">安全锁死即将激活</h2>
                       <p className="text-slate-400 font-medium text-sm leading-relaxed px-10">您的系统准入凭证将在 5 分钟内物理失效。为了保障您的财务数据安全，请立即重新登录。</p>
                    </div>
                    <div className="flex flex-col gap-4">
                       <button onClick={safeSignOut} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all active-scale">执行安全重连</button>
                       <button onClick={() => setExpiryLevel('warning')} className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-950 transition-colors">暂时忽略 (仅限 300s)</button>
                    </div>
                 </div>
              </div>
            )}

            {isLoading ? (
               <div className="h-96 flex flex-col items-center justify-center space-y-4">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Cloud State...</p>
               </div>
            ) : (
              <>
                {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} ingredients={[]} partners={partners} lang={lang} currentUser={session.user as any} />}
                {currentTab === 'rooms' && <RoomGrid rooms={rooms} dishes={dishes} categories={categories} onUpdateRoom={async(r) => { await api.rooms.updateStatus(r.id, r.status); refreshData(); }} onRefresh={refreshData} lang={lang} />}
                {currentTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={async (id, status) => { await api.orders.updateStatus(id, status); refreshData(); }} lang={lang} currentUser={session.user as any} />}
                {currentTab === 'supply_chain' && <SupplyChainManager dishes={dishes} categories={categories} currentUser={session.user as any} partners={partners} onAddDish={async(d) => { await api.dishes.create(d, session.user); refreshData(); }} onUpdateDish={async(d) => { await api.dishes.update(d, session.user); refreshData(); }} onDeleteDish={async(id) => { await api.dishes.delete(id, session.user); refreshData(); }} lang={lang} onRefreshData={refreshData} />}
                {currentTab === 'images' && <ImageManagement lang={lang} />}
                {currentTab === 'financial_hub' && <FinancialCenter orders={orders} expenses={expenses} partners={partners} currentUser={session.user as any} onAddExpense={async(ex)=>{ await api.expenses.create(ex); refreshData(); }} onDeleteExpense={async(id)=>{ await api.expenses.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} lang={lang} />}
                {currentTab === 'users' && <StaffManagement users={users} partners={partners} currentUser={session.user} onRefresh={refreshData} onAddUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onUpdateUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onDeleteUser={async(id)=>{ await api.users.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} lang={lang} />}
                {currentTab === 'settings' && <SystemSettings lang={lang} onChangeLang={setLang} onUpdateConfig={async(c)=>{ await api.config.update(c); refreshData(); }} />}
                {currentTab === 'menu' && <DatabaseManagement lang={lang} />}
              </>
            )}
          </div>
        </main>
        <CommandCenter isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} rooms={rooms} orders={orders} dishes={dishes} lang={lang} onNavigate={setCurrentTab} onToggleTheme={() => {}} onLogout={safeSignOut} />
        <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setNotifications([])} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
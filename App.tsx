
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomGrid from './components/RoomGrid';
import OrderManagement from './components/OrderManagement';
import SystemSettings from './components/SystemSettings';
import StaffManagement from './components/StaffManagement';
import ImageManagement from './components/ImageManagement';
import SupplyChainManager from './components/SupplyChainManager';
import FinancialCenter from './components/FinancialCenter';
import GuestOrder from './components/GuestOrder';
import Toast, { ToastType } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import RLSErrorHandler from './components/RLSErrorHandler';
import DatabaseManagement from './components/DatabaseManagement';
import { api } from './services/api';
import { supabase, isDemoMode } from './services/supabaseClient';
import { User, Order, HotelRoom, Expense, Dish, Partner, SystemConfig, OrderStatus, UserRole, AppModule } from './types';
import { Language, getTranslation } from './translations';
import { Loader2, Menu, ShieldCheck, Lock, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lang, setLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('jx_lang') as Language) || 'zh';
    } catch {
      return 'zh';
    }
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({message, type});
  }, []);

  const t = useCallback((key: string): string => getTranslation(lang, key), [lang]);
  
  const guestRoomId = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('room');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!sysConfig) return;
    const html = document.documentElement;
    html.setAttribute('data-theme', sysConfig.theme || 'light');
    html.style.setProperty('--font-family-main', sysConfig.fontFamily || 'inherit');
    html.style.fontSize = `${sysConfig.fontSizeBase || 16}px`;
  }, [sysConfig]);

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      if (currentUser) {
        const [r, o, d, u, p, e, config] = await Promise.all([
          api.rooms.getAll(), api.orders.getAll(), api.dishes.getAll(), 
          api.users.getAll(), api.partners.getAll(), api.expenses.getAll(), api.config.get()
        ]);
        setRooms(r); setOrders(o); setDishes(d); setUsers(u); 
        setPartners(p); setExpenses(e); setSysConfig(config);
      } else if (guestRoomId) {
        const [d, config] = await Promise.all([api.dishes.getAll(), api.config.get()]);
        setDishes(d); setSysConfig(config);
      }
    } catch (error) {
       console.error("Fetch data error:", error);
       if (!quiet) showToast(t('syncError'), "error");
    } finally { if (!quiet) setIsLoading(false); }
  }, [currentUser, guestRoomId, t, showToast]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isDemoMode) {
          const saved = localStorage.getItem('jx_user');
          if (saved) setCurrentUser(JSON.parse(saved));
          return;
        }
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await api.users.getProfile(session.user.id);
            setCurrentUser(profile);
          }
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (currentUser || guestRoomId) {
      fetchData();
      const syncInterval = window.setInterval(() => fetchData(true), 60000);
      return () => clearInterval(syncInterval);
    }
  }, [currentUser, guestRoomId, fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    try {
      if (isDemoMode) {
        const user: User = { id: 'u-demo', name: '演示管理员', email, username: 'demo', role: UserRole.ADMIN, modulePermissions: {} };
        setCurrentUser(user);
        localStorage.setItem('jx_user', JSON.stringify(user));
        setIsAuthChecking(false); // 确保认证检查完成
        return;
      }
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // 登录成功后，获取返回的会话和用户资料
        if (data?.session?.user) {
          const profile = await api.users.getProfile(data.session.user.id);
          setCurrentUser(profile);
          setIsAuthChecking(false); // 确保认证检查完成
        }
      }
    } catch (err: any) {
      showToast(err.message || t('loginFailed'), "error");
    } finally { setIsLoggingIn(false); }
  };

  const handleLogout = async () => {
    if (!isDemoMode && supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('jx_user');
    showToast(lang === 'zh' ? '安全退出成功' : 'Logged out safely', "info");
  };

  const wrapAsync = useCallback(async (fn: () => Promise<any>, successMsg?: string) => {
    setIsSyncing(true);
    try {
      await fn();
      await fetchData(true);
      if (successMsg) showToast(successMsg, "success");
    } catch (err: any) {
      // 检查是否为RLS错误
      if (err.message?.includes('RLS_FORBIDDEN_403')) {
        setApiError(err);
      }
      showToast(t('syncError'), "error");
    } finally { setIsSyncing(false); }
  }, [fetchData, showToast, t]);

  const hasAccess = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentTab === 'dashboard') return true;
    const perms = currentUser.modulePermissions || {};
    if (currentTab === 'financial_hub') return !!(perms.finance?.enabled || perms.partners?.enabled || perms.payments?.enabled);
    if (currentTab === 'supply_chain') return !!(perms.menu?.enabled || perms.inventory?.enabled);
    return !!perms[currentTab as AppModule]?.enabled;
  }, [currentUser, currentTab]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (guestRoomId) {
    return (
      <GuestOrder 
        roomId={guestRoomId} dishes={dishes} 
        onSubmitOrder={async (o) => { 
          await api.orders.create(o as Order); 
          // 触发通知服务
          import('./services/notification').then(({ notificationService }) => {
            notificationService.triggerWebhook(o as Order);
          });
          fetchData(true); 
        }} 
        lang={lang} onToggleLang={() => setLang(l => l === 'zh' ? 'en' : 'zh')} onRescan={() => window.location.href = window.location.origin} 
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-6 overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="absolute inset-0 z-0">
          <img src="https://zlbemopcgjohrnyyiwvs.supabase.co/storage/v1/object/public/jiangxiyunchu/system/jiangxijiudian.png" className="w-full h-full object-cover opacity-20" alt="" />
        </div>
        <div className="w-full max-w-md relative z-10 animate-fade-up">
          <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/20 text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black italic mx-auto mb-8 shadow-2xl">JX</div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-10">江西云厨管理系统</h1>
            <form onSubmit={handleLogin} className="space-y-6 text-left">
              <input name="email" type="email" placeholder="Email" required className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" />
              <input name="password" type="password" placeholder="Access Key" required className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" />
              <button type="submit" disabled={isLoggingIn} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={16} />确认接入</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen flex bg-[#f8fafc]">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          lang={lang} 
          onToggleLang={() => setLang(l => l === 'zh' ? 'en' : 'zh')} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => { 
            const newVal = !isSidebarCollapsed;
            setIsSidebarCollapsed(newVal); 
            localStorage.setItem('sidebarCollapsed', String(newVal)); 
          }}
        />
        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-50 rounded-xl"><Menu size={20} /></button>
              <h2 className="text-lg lg:text-xl font-black uppercase text-slate-950">{t(currentTab)}</h2>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black shadow-lg border-2 border-white">
              {currentUser.name ? currentUser.name[0] : 'U'}
            </div>
          </header>

          <div className="p-4 lg:p-10 max-w-[1600px] mx-auto w-full">
            {isLoading ? (
               <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4 uppercase font-black text-[10px] tracking-widest"><Loader2 className="animate-spin text-blue-500" size={32} />Syncing...</div>
            ) : !hasAccess ? (
               <div className="h-96 flex flex-col items-center justify-center text-center"><ShieldAlert size={48} className="text-red-500 mb-4" /><h3 className="text-xl font-black">ACCESS DENIED</h3><button onClick={() => setCurrentTab('dashboard')} className="mt-6 px-8 py-3 bg-slate-950 text-white rounded-xl">Back to Dashboard</button></div>
            ) : (
              <div className="animate-fade-up">
                {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} lang={lang} />}
                {currentTab === 'rooms' && <RoomGrid rooms={rooms} dishes={dishes} onUpdateRoom={(r) => wrapAsync(() => api.rooms.update(r))} onRefresh={() => fetchData(true)} lang={lang} />}
                {currentTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={(id, s) => wrapAsync(() => api.orders.updateStatus(id, s))} lang={lang} />}
                {currentTab === 'supply_chain' && <SupplyChainManager dishes={dishes} currentUser={currentUser} onAddDish={(d) => wrapAsync(() => api.dishes.create(d))} onUpdateDish={(d) => wrapAsync(() => api.dishes.update(d))} onDeleteDish={(id) => wrapAsync(() => api.dishes.delete(id))} lang={lang} />}
                {currentTab === 'financial_hub' && <FinancialCenter orders={orders} expenses={expenses} partners={partners} onAddExpense={(e) => wrapAsync(() => api.expenses.create(e))} onDeleteExpense={(id) => wrapAsync(() => api.expenses.delete(id))} onAddPartner={(p) => wrapAsync(() => api.partners.create(p))} onUpdatePartner={(p) => wrapAsync(() => api.partners.update(p))} onDeletePartner={(id) => wrapAsync(() => api.partners.delete(id))} lang={lang} />}
                {currentTab === 'images' && <ImageManagement lang={lang} />}
                {currentTab === 'users' && <StaffManagement users={users} onRefresh={() => fetchData(true)} onAddUser={(u) => wrapAsync(() => api.users.create(u))} onUpdateUser={(u) => wrapAsync(() => api.users.update(u))} onDeleteUser={(id) => wrapAsync(() => api.users.delete(id))} lang={lang} />}
                {currentTab === 'settings' && <SystemSettings lang={lang} onChangeLang={setLang} onUpdateConfig={(c) => wrapAsync(() => api.config.update(c))} />}
                {currentTab === 'database' && <DatabaseManagement lang={lang} />}
              </div>
            )}
          </div>
        </main>
      </div>
      {apiError && currentUser && (
        <RLSErrorHandler 
          error={apiError} 
          lang={lang} 
          userRole={currentUser.role}
          tableName={apiError.message.match(/table "([^"]+)"/)?.[1] || undefined}
        />
      )}
    </ErrorBoundary>
  );
};

export default App;
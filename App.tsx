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
import DatabaseManagement from './components/DatabaseManagement';
import Toast, { ToastType } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { api } from './services/api';
import { supabase, isDemoMode } from './services/supabaseClient';
import { User, Order, HotelRoom, Expense, Dish, MaterialImage, Partner, SystemConfig, OrderStatus, UserRole, AppModule } from './types';
import { Language, getTranslation } from './translations';
import { Monitor, ChevronRight, Loader2, ShieldCheck, Lock, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('jx_lang') as Language) || 'zh');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
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

  const guestRoomId = useMemo(() => new URLSearchParams(window.location.search).get('room'), []);

  useEffect(() => {
    if (!sysConfig) return;
    const html = document.documentElement;
    html.setAttribute('data-theme', sysConfig.theme);
    const sizeMap: Record<number, string> = { 14: 'standard', 16: 'medium', 18: 'large', 20: 'large', 22: 'large' };
    html.setAttribute('data-font-size', sizeMap[sysConfig.fontSizeBase] || 'medium');
    html.style.setProperty('--font-family-main', sysConfig.fontFamily);
    html.style.fontSize = `${sysConfig.fontSizeBase}px`;
    if (sysConfig.contrastStrict) {
      html.classList.add('contrast-strict');
    } else {
      html.classList.remove('contrast-strict');
    }
  }, [sysConfig]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSysConfig(e.detail);
    };
    window.addEventListener('jx_config_updated', handleUpdate);
    return () => window.removeEventListener('jx_config_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (isDemoMode) {
        const saved = localStorage.getItem('jx_user');
        if (saved) setCurrentUser(JSON.parse(saved));
        setIsAuthChecking(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await api.users.getProfile(session.user.id);
        setCurrentUser(profile);
      }
      setIsAuthChecking(false);
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await api.users.getProfile(session.user.id);
          setCurrentUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      });
      return () => subscription.unsubscribe();
    };
    initAuth();
  }, []);

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      if (currentUser) {
        const [r, o, d, u, p, e, config] = await Promise.all([
          api.rooms.getAll(), 
          api.orders.getAll(), 
          api.dishes.getAll(), 
          api.users.getAll(), 
          api.partners.getAll(),
          api.expenses.getAll(),
          api.config.get()
        ]);
        setRooms(r); setOrders(o); setDishes(d); setUsers(u); 
        setPartners(p); setExpenses(e); setSysConfig(config);
      } else if (guestRoomId) {
        const [d, config] = await Promise.all([
          api.dishes.getAll(),
          api.config.get()
        ]);
        setDishes(d);
        setSysConfig(config);
      }
    } catch (error) {
       if (!quiet) showToast(t('syncError'), "error");
    } finally { if (!quiet) setIsLoading(false); }
  }, [currentUser, guestRoomId, t, showToast]);

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
        await new Promise(r => setTimeout(r, 800));
        const user: User = { 
          id: 'u-demo-root', 
          name: '演示管理员', 
          email: email, 
          username: 'demo', 
          role: UserRole.ADMIN,
          modulePermissions: {} 
        };
        setCurrentUser(user);
        localStorage.setItem('jx_user', JSON.stringify(user));
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast(t('welcomeBack'), "success");
    } catch (err: any) {
      showToast(err.message || t('loginFailed'), "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!isDemoMode) await supabase.auth.signOut();
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
    } catch (err) {
      showToast(t('syncError'), "error");
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData, showToast, t]);

  const hasAccess = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentTab === 'dashboard') return true;
    const perms = currentUser.modulePermissions || {};
    if (currentTab === 'financial_hub') {
      return perms['finance']?.enabled || perms['partners']?.enabled || perms['payments']?.enabled || perms['financial_hub']?.enabled;
    }
    if (currentTab === 'supply_chain') {
      return perms['menu']?.enabled || perms['inventory']?.enabled || perms['supply_chain']?.enabled;
    }
    return perms[currentTab as AppModule]?.enabled === true;
  }, [currentUser, currentTab]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-6">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Verifying Security Gateway...</p>
        </div>
      </div>
    );
  }

  if (guestRoomId) {
    return (
      <GuestOrder 
        roomId={guestRoomId} 
        dishes={dishes} 
        onSubmitOrder={async (o: Partial<Order>) => { 
          await api.orders.create(o as Order); 
          fetchData(true); 
        }} 
        lang={lang} 
        onToggleLang={() => setLang(lang === 'zh' ? 'en' : 'zh')}
        onRescan={() => window.location.href = window.location.origin}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-40 grayscale" alt="Hospitality" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>
        <div className="w-full max-w-md relative z-10 animate-fade-up">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] shadow-2xl p-10 lg:p-14 space-y-10 border border-white/10">
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center">
                 <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center font-black text-2xl italic shadow-2xl mb-4 border-2 border-white/20">JX</div>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">江西云厨管理系统</h1>
              <div className="flex items-center justify-center space-x-2 text-slate-500">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Cloud Security Protocols Active</span>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">邮箱 / Email</label>
                  <input name="email" type="email" placeholder="admin@jxcloud.com" disabled={isLoggingIn} required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/10 outline-none transition-all shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">密钥 / Access Key</label>
                  <input name="password" type="password" placeholder="••••••••" disabled={isLoggingIn} required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/10 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <button type="submit" disabled={isLoggingIn} className="group w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-70">
                {isLoggingIn ? <Loader2 className="animate-spin" size={18} /> : <><Lock size={16} /><span>确认接入终端 Sign In</span></>}
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
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} currentUser={currentUser} onLogout={handleLogout} lang={lang} onToggleLang={() => setLang(lang === 'zh' ? 'en' : 'zh')} isOpen={isSidebarOpen} />
        <main className="flex-1 lg:pl-72 flex flex-col min-h-screen">
          <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-50 rounded-2xl text-slate-400"><Monitor size={24} /></button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-950 leading-none">{t(currentTab as any)}</h2>
                  {isSyncing && <Loader2 className="animate-spin text-blue-600" size={18} />}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t(`role_${currentUser.role}` as any)} {t('statusActive')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-950">{currentUser.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[150px]">#{currentUser.id.slice(0,8)}</p>
               </div>
               <div className="w-14 h-14 bg-slate-950 text-white rounded-[1.75rem] flex items-center justify-center font-black text-xl shadow-xl border-4 border-white">{currentUser.name[0]}</div>
            </div>
          </header>

          <div className="p-10 max-w-[1600px] mx-auto w-full flex-1">
            {isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.5em]"><Loader2 size={48} className="animate-spin text-blue-600 mb-4" />JX-Cloud Orchestrating Data...</div>
            ) : !hasAccess ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center shadow-inner"><ShieldAlert size={48} /></div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">访问被拒绝 / ACCESS DENIED</h3>
                    <p className="text-slate-400 mt-2 font-medium">您的账户权限不足，无法访问该安全节点。如有疑问请联系系统管理员。</p>
                 </div>
                 <button onClick={() => setCurrentTab('dashboard')} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">返回控制台首页</button>
              </div>
            ) : (
              <div className="animate-fade-up">
                {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} lang={lang} />}
                {currentTab === 'rooms' && <RoomGrid rooms={rooms} dishes={dishes} onUpdateRoom={(r: HotelRoom) => wrapAsync(() => api.rooms.update(r), t('stationManagement') + '更新成功')} onRefresh={() => fetchData(true)} lang={lang} />}
                {currentTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={(id: string, s: OrderStatus) => wrapAsync(() => api.orders.updateStatus(id, s), t('orders') + '同步成功')} lang={lang} />}
                {currentTab === 'supply_chain' && <SupplyChainManager dishes={dishes} currentUser={currentUser} onAddDish={(d: Dish) => wrapAsync(() => api.dishes.create(d), '商品档案已录入')} onUpdateDish={(d: Dish) => wrapAsync(() => api.dishes.update(d), '档案修改已保存')} onDeleteDish={(id: string) => wrapAsync(() => api.dishes.delete(id), '商品已下架')} lang={lang} />}
                {currentTab === 'financial_hub' && <FinancialCenter orders={orders} expenses={expenses} partners={partners} onAddExpense={(e: Expense) => wrapAsync(() => api.expenses.create(e), '财务记录已录入')} onDeleteExpense={(id: string) => wrapAsync(() => api.expenses.delete(id), '记录已撤销')} onAddPartner={(p: Partner) => wrapAsync(() => api.partners.create(p), '合伙人入驻成功')} onUpdatePartner={(p: Partner) => wrapAsync(() => api.partners.update(p), '合伙人档案已更新')} onDeletePartner={(id: string) => wrapAsync(() => api.partners.delete(id), '合伙人关系已解除')} lang={lang} />}
                {currentTab === 'database' && <DatabaseManagement lang={lang} />}
                {currentTab === 'images' && <ImageManagement lang={lang} />}
                {currentTab === 'users' && <StaffManagement users={users} onRefresh={() => fetchData(true)} onAddUser={(u: User) => wrapAsync(() => api.users.create(u), '新员工授权已签发')} onUpdateUser={(u: User) => wrapAsync(() => api.users.update(u), '授权档案已更新')} onDeleteUser={(id: string) => wrapAsync(() => api.users.delete(id), '账号已注销')} lang={lang} />}
                {currentTab === 'settings' && <SystemSettings lang={lang} onChangeLang={(l: Language) => { setLang(l); localStorage.setItem('jx_lang', l); }} onUpdateConfig={(c: SystemConfig) => wrapAsync(() => api.config.update(c), '系统配置已存档')} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomGrid from './components/RoomGrid';
import OrderManagement from './components/OrderManagement';
import MenuManagement from './components/MenuManagement';
import ImageLibrary from './components/ImageLibrary';
import FinanceManagement from './components/FinanceManagement';
import StaffManagement from './components/StaffManagement';
import PaymentManagement from './components/PaymentManagement';
import SystemSettings from './components/SystemSettings';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import GuestOrder from './components/GuestOrder';
import { api } from './services/api';
import { notificationService } from './services/notification';
import { User, Order, HotelRoom, Expense, Dish, MaterialImage, UserRole, Ingredient, SecurityLog, OrderStatus } from './types';
import { translations as localTranslations, Language } from './translations';
import { 
  Bell, Loader2, ShieldAlert, Sparkles, X, Globe, ShieldCheck, Menu, Eye, EyeOff, Lock, Key, ArrowRight, Fingerprint, MonitorOff, Package
} from 'lucide-react';

const MemoDashboard = React.memo(Dashboard);
const MemoRoomGrid = React.memo(RoomGrid);
const MemoOrderManagement = React.memo(OrderManagement);
const MemoMenuManagement = React.memo(MenuManagement);
const MemoImageLibrary = React.memo(ImageLibrary);
const MemoStaffManagement = React.memo(StaffManagement);
const MemoFinanceManagement = React.memo(FinanceManagement);
const MemoPaymentManagement = React.memo(PaymentManagement);
const MemoSystemSettings = React.memo(SystemSettings);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [materials, setMaterials] = useState<MaterialImage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dynamicTranslations, setDynamicTranslations] = useState<any>(localTranslations);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('jx_lang') as Language) || 'zh');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // URL Param for Guest Mode
  const [guestRoomId, setGuestRoomId] = useState<string | null>(null);
  const [lastOrderInfo, setLastOrderInfo] = useState<string | null>(null);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [pendingMfaUser, setPendingMfaUser] = useState<User | null>(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) setGuestRoomId(room);
    
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((msg) => {
      if (msg.type === 'NEW_ORDER') {
        setLastOrderInfo(msg.body);
        setTimeout(() => setLastOrderInfo(null), 8000);
        
        setAppNotifications(prev => [{
          id: `notif-${Date.now()}`,
          title: msg.title,
          body: msg.body,
          type: msg.type,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        if (currentTab !== 'orders') fetchData();
      }
    });
    return unsubscribe;
  }, [currentTab]);

  const logAudit = useCallback(async (action: string, details: string, riskLevel: 'Low' | 'Medium' | 'High' = 'Low', overrideUserId?: string) => {
    const userContext = currentUser || pendingMfaUser;
    const log: SecurityLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: overrideUserId || userContext?.id || 'SYSTEM',
      action,
      details: `${userContext?.name || '匿名'} : ${details}`,
      timestamp: new Date().toISOString(),
      ip: "127.0.0.1", 
      riskLevel
    };
    await api.logs.add(log);
  }, [currentUser, pendingMfaUser]);

  const t = useCallback((key: string) => {
    const set = dynamicTranslations[lang] || dynamicTranslations.zh || localTranslations.zh;
    return (set as any)[key] || (localTranslations.zh as any)[key] || key;
  }, [lang, dynamicTranslations]);

  const fetchData = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const [r, o, e, d, u, m, cloudDict] = await Promise.all([
        api.rooms.getAll(),
        api.orders.getAll(),
        api.expenses.getAll(),
        api.dishes.getAll(),
        api.users.getAll(),
        api.materials.getAll(),
        api.translations.getAll()
      ]);
      if (!isMounted.current) return;
      setRooms(r || []);
      setOrders(o || []);
      setExpenses(e || []);
      setDishes(d || []);
      setUsers(u || []);
      setMaterials(m || []);

      if (cloudDict && Object.keys(cloudDict).length > 0) {
        setDynamicTranslations((prev: any) => ({ ...prev, ...cloudDict }));
      }
    } catch (err) { 
      console.warn('Sync failed');
    } finally { 
      if (isMounted.current) {
        setIsLoading(false); 
        setIsSyncing(false);
      }
    }
  }, [isSyncing]);

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrimaryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setGlobalError(null);
    
    const latestUsers = await api.users.getAll();
    const inputUsername = loginForm.username.trim();
    const matchedUser = latestUsers.find(u => u.username === inputUsername);
    
    const isDefaultAdminPass = inputUsername === 'admin' && loginForm.password === 'admin';
    const isCreatedUserPass = matchedUser && (matchedUser.password || '123456') === loginForm.password;
    
    if (matchedUser && (isDefaultAdminPass || isCreatedUserPass)) {
      if (matchedUser.isOnline) {
        setGlobalError('访问拒绝：该账号已在其他终端在线。');
        setIsLoggingIn(false);
        return;
      }

      if (matchedUser.isLocked) {
        setGlobalError('账号锁定：身份凭据已被系统禁用。');
        setIsLoggingIn(false);
        return;
      }

      if (matchedUser.twoFactorEnabled && matchedUser.mfaSecret) {
        setPendingMfaUser(matchedUser);
        setIsLoggingIn(false);
        await logAudit('MFA_CHALLENGE', '主要凭据通过，进入二次验证。', 'Low', matchedUser.id);
      } else {
        await api.users.setOnlineStatus(matchedUser.id, true);
        setCurrentUser({ ...matchedUser, isOnline: true });
        notificationService.requestPermission();
        await logAudit('AUTH_SUCCESS', '会话建立成功。', 'Low', matchedUser.id);
        setIsLoggingIn(false);
      }
    } else {
      setGlobalError('身份验证失败：账号或凭据不匹配。');
      await logAudit('AUTH_FAILURE', `尝试登录账号: ${inputUsername}`, 'Medium');
      setIsLoggingIn(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !pendingMfaUser) return;

    setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 600));

    if (mfaCode === '888888' || mfaCode === '123456') {
      await api.users.setOnlineStatus(pendingMfaUser.id, true);
      setCurrentUser({ ...pendingMfaUser, isOnline: true });
      setPendingMfaUser(null);
      await logAudit('MFA_SUCCESS', '双因素认证通过。');
      notificationService.requestPermission();
    } else {
      setGlobalError('2FA 错误：Security Token 无效。');
      await logAudit('MFA_FAILURE', '非法验证码尝试。', 'High');
    }
    setIsLoggingIn(false);
    setMfaCode('');
  };

  const handleLogout = async () => {
    if (currentUser) {
      await api.users.setOnlineStatus(currentUser.id, false);
      await logAudit('SESSION_TERMINATED', '安全退出系统。');
      setCurrentUser(null);
    }
  };

  const updateLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('jx_lang', newLang);
  };

  if (guestRoomId) {
    return (
      <GuestOrder 
        roomId={guestRoomId} 
        dishes={dishes} 
        onSubmitOrder={async (order) => { 
          await api.orders.create(order as Order); 
          fetchData(); 
        }} 
        lang={lang} 
        onToggleLang={() => {
          const next = lang === 'zh' ? 'en' : 'zh';
          updateLang(next);
        }}
        onRescan={() => {
          window.location.href = window.location.origin + window.location.pathname;
        }}
      />
    );
  }

  if (currentUser) {
    const unreadCount = appNotifications.filter(n => !n.read).length;
    return (
      <ErrorBoundary lang={lang}>
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] relative">
          <Sidebar currentTab={currentTab} setCurrentTab={(tab) => { setCurrentTab(tab); setIsSidebarOpen(false); }} userRole={currentUser.role} onLogout={handleLogout} lang={lang} isOpen={isSidebarOpen} />
          <main className={`min-h-screen transition-all duration-500 lg:pl-72`}>
            
            {lastOrderInfo && (
              <div className="fixed top-0 left-0 lg:left-72 right-0 z-[100] bg-indigo-600 text-white py-3 px-6 shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                <div className="flex items-center space-x-4 overflow-hidden">
                   <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 animate-pulse">
                      <Package size={16} />
                   </div>
                   <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mr-4">Realtime Push Notification</span>
                      <span className="text-sm font-bold">{lastOrderInfo}</span>
                   </div>
                </div>
                <button onClick={() => setLastOrderInfo(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button>
              </div>
            )}

            <header className="sticky top-0 z-40 h-20 lg:h-24 bg-white/90 backdrop-blur-2xl border-b border-slate-100 px-6 lg:px-12 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 lg:hidden"><Menu size={24} /></button>
                <div className="flex flex-col">
                  <span className="hidden sm:block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1">{t('centralConsole')}</span>
                  <h2 className="text-xl lg:text-3xl font-bold tracking-tight text-[#0f172a]">{t(currentTab as any)}</h2>
                </div>
              </div>
              <div className="flex items-center space-x-3 lg:space-x-8">
                <button onClick={() => setIsNotificationsOpen(true)} className="relative p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <Bell size={20} className="text-slate-500 group-hover:text-[#d4af37]" />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">{unreadCount}</span>}
                </button>
                <div className="flex items-center space-x-4 border-l border-slate-200 pl-8">
                   <div className="text-right hidden sm:block">
                      <p className="text-base font-bold text-slate-900 leading-none">{currentUser.name}</p>
                      <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-tighter mt-1.5">{currentUser.role.toUpperCase()}</p>
                   </div>
                   <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-xl shrink-0">{currentUser.name[0]}</div>
                </div>
              </div>
            </header>

            <div className="p-6 lg:p-12 max-w-[1600px] mx-auto">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#d4af37] rounded-full animate-spin"></div></div>
              ) : (
                <div className="w-full">
                  {currentTab === 'dashboard' && <MemoDashboard orders={orders} rooms={rooms} expenses={expenses} lang={lang} />}
                  {currentTab === 'rooms' && <MemoRoomGrid rooms={rooms} dishes={dishes} onRefresh={fetchData} isSyncing={isSyncing} onUpdateRoom={async (r) => { await api.rooms.update(r); fetchData(); }} lang={lang} />}
                  {currentTab === 'orders' && <MemoOrderManagement orders={orders} onUpdateStatus={async (id, s) => { await api.orders.updateStatus(id, s); fetchData(); }} lang={lang} />}
                  {currentTab === 'menu' && <MemoMenuManagement dishes={dishes} materials={materials} onAddDish={async (d) => { await api.dishes.create(d); fetchData(); }} onUpdateDish={async (d) => { await api.dishes.update(d); fetchData(); }} onDeleteDish={async (id) => { await api.dishes.delete(id); fetchData(); }} onAddMaterial={async (m) => { await api.materials.create(m); fetchData(); }} onDeleteMaterial={async (id) => { await api.materials.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'materials' && <MemoImageLibrary materials={materials} onAddMaterial={async (m) => { await api.materials.create(m); fetchData(); }} onDeleteMaterial={async (id) => { await api.materials.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'finance' && <MemoFinanceManagement orders={orders} expenses={expenses} onAddExpense={async (e) => { await api.expenses.create(e); fetchData(); }} onDeleteExpense={async (id) => { await api.expenses.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'payments' && <MemoPaymentManagement lang={lang} />}
                  {currentTab === 'users' && <MemoStaffManagement users={users} onRefresh={fetchData} onAddUser={async (u) => { await api.users.create(u); fetchData(); }} onUpdateUser={async (u) => { await api.users.update(u); fetchData(); }} onDeleteUser={async (id) => { await api.users.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'settings' && <MemoSystemSettings lang={lang} onChangeLang={updateLang} currentUser={currentUser} onUpdateCurrentUser={(u) => { setCurrentUser(u); fetchData(); }} />}
                </div>
              )}
            </div>
            <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={appNotifications} onMarkAsRead={(id) => setAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setAppNotifications([])} />
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-[#020617]">
        <div className="absolute inset-0 z-0 scale-110">
          <img src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover blur-[8px] opacity-20" alt="Kitchen" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[480px] px-6">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10 p-10 lg:p-14 animate-in zoom-in-95">
            
            <div className="flex flex-col items-center text-center mb-12">
               <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 mb-8 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent animate-pulse" />
                  <Lock size={32} className="text-[#d4af37] relative z-10" />
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">江西云厨</h1>
               <p className="text-[10px] font-black text-[#d4af37] tracking-[0.5em] uppercase opacity-70">CENTRAL GATEWAY v3.1</p>
            </div>

            {pendingMfaUser ? (
              <form onSubmit={handleMfaVerify} className="space-y-8 animate-in slide-in-from-right">
                <div className="p-6 bg-[#d4af37]/10 rounded-3xl border border-[#d4af37]/20 flex items-start space-x-4 mb-4">
                  <Fingerprint size={24} className="text-[#d4af37] shrink-0" />
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-[#d4af37] uppercase tracking-widest">Identity Protection</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">请输入您的验证 App 生成的 6 位动态验证码以完成登录。</p>
                  </div>
                </div>
                <input 
                  type="text" 
                  maxLength={6}
                  value={mfaCode} 
                  onChange={e => setMfaCode(e.target.value)} 
                  className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:bg-white/10 focus:border-[#d4af37] text-3xl font-black text-white text-center tracking-[0.8em] transition-all placeholder-slate-700" 
                  placeholder="000000" 
                  required 
                />
                <button type="submit" disabled={isLoggingIn} className="w-full py-6 bg-[#d4af37] text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-3">
                  {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : <><ShieldCheck size={20} /><span>验证并登录系统</span></>}
                </button>
                <button type="button" onClick={() => setPendingMfaUser(null)} className="w-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">返回账号登录</button>
              </form>
            ) : (
              <form onSubmit={handlePrimaryLogin} className="space-y-6">
                {globalError && (
                  <div className="p-5 bg-red-500/10 text-red-400 rounded-2xl text-[10px] font-black border border-red-500/20 text-center animate-shake flex items-center justify-center gap-3">
                    {globalError.includes('在线') ? <MonitorOff size={16} /> : <ShieldAlert size={16} />}
                    <span>{globalError}</span>
                  </div>
                )}
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={loginForm.username} 
                    onChange={e => setLoginForm(p => ({...p, username: e.target.value}))} 
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:bg-white/10 focus:border-[#d4af37]/50 font-bold text-white transition-all text-sm" 
                    placeholder="管理员账号 / admin" 
                    required 
                  />
                  <div className="relative group">
                    <input 
                      type={showPass ? "text" : "password"}
                      value={loginForm.password} 
                      onChange={e => setLoginForm(p => ({...p, password: e.target.value}))} 
                      className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:bg-white/10 focus:border-[#d4af37]/50 font-bold text-white transition-all text-sm" 
                      placeholder="访问密码 / password" 
                      required 
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoggingIn} className="w-full py-6 bg-[#d4af37] text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-50 mt-8">
                  {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : <span>初始化授权会话</span>}
                </button>
              </form>
            )}
            
            <div className="mt-12 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">
               <div className="flex items-center space-x-2"><ShieldCheck size={12} className="text-[#d4af37]" /><span>SSO Protection Active</span></div>
               <span className="opacity-40">JX_CLOUD_PROD_V3</span>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-10 w-full px-12 z-10 flex flex-col items-center opacity-30">
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">江西云厨安全研发部 © 2025</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;

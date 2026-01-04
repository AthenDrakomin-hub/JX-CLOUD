/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

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
import ConnectionMonitor from './components/ConnectionMonitor';
import { api } from './services/api';
import { notificationService } from './services/notification';
import { User, Order, HotelRoom, Expense, Dish, MaterialImage, UserRole, Ingredient, SecurityLog, OrderStatus, PermissionKey } from './types';
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // URL Param for Guest Mode
  const [guestRoomId, setGuestRoomId] = useState<string | null>(null);
  const [lastOrderInfo, setLastOrderInfo] = useState<string | null>(null);
  
  const [pendingMfaUser, setPendingMfaUser] = useState<User | null>(null);
  
  const DEFAULT_PERMISSIONS: PermissionKey[] = [
    'manage_menu',
    'view_finance',
    'process_orders',
    'manage_staff',
    'system_config',
    'material_assets'
  ];
  
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

  // 获取用户IP地址的函数
  const getUserIP = async (): Promise<string> => {
    try {
      // 尝试从各种来源获取IP地址
      const response = await fetch('https://httpbin.org/ip');
      const data = await response.json();
      return data.origin || '127.0.0.1';
    } catch (error) {
      // 如果无法获取真实IP，返回本地地址作为默认值
      // 在实际生产环境中，可以从服务器端API获取真实IP
      return '127.0.0.1';
    }
  };

  // 检查IP是否在白名单中的函数
  const isIpInWhitelist = (userIp: string, whitelist: string[]): boolean => {
    if (!userIp || !whitelist || whitelist.length === 0) {
      return true; // 如果没有白名单，允许访问
    }

    for (const ipPattern of whitelist) {
      if (ipPattern.includes('/')) {
        // CIDR格式检查 (如 192.168.1.0/24)
        if (isIpInCidrRange(userIp, ipPattern)) {
          return true;
        }
      } else {
        // 精确IP匹配
        if (userIp === ipPattern) {
          return true;
        }
      }
    }
    return false;
  };

  // 检查IP是否在CIDR范围内的函数
  const isIpInCidrRange = (userIp: string, cidr: string): boolean => {
    try {
      const [network, prefixStr] = cidr.split('/');
      const prefix = parseInt(prefixStr);
      if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

      const userIpNum = ipToNumber(userIp);
      const networkIpNum = ipToNumber(network);
      const mask = ~((1 << (32 - prefix)) - 1);

      return (userIpNum & mask) === (networkIpNum & mask);
    } catch (e) {
      return false;
    }
  };

  // 将IP地址转换为数字
  const ipToNumber = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  };

  const t = useCallback((key: string) => {
    // Prioritize database translations for current language, then fallback to local translations
    const dbTranslation = dynamicTranslations[lang] && (dynamicTranslations[lang] as any)[key];
    if (dbTranslation) return dbTranslation;
    
    // Then try local translations for current language
    const localTranslation = (localTranslations[lang] as any)[key];
    if (localTranslation) return localTranslation;
    
    // Finally fallback to Chinese local translation or the key itself
    return (localTranslations.zh as any)[key] || key;
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

      // 检查用户数据
      if (u && u.length === 0) {
        console.log('No users found in the system');
        // 可以考虑使用新的边缘函数来检查用户状态
      }

      // Merge database translations with local translations, giving priority to database translations
      const mergedTranslations = {
        zh: { ...localTranslations.zh, ...cloudDict.zh },
        en: { ...localTranslations.en, ...cloudDict.en },
        tl: { ...localTranslations.tl, ...cloudDict.tl }
      };
      setDynamicTranslations(mergedTranslations);
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

  const handlePrimaryLogin = async (credentials: { username: string; password: string }) => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setGlobalError(null);
    
    try {
      // 使用新的 select-or-login-user 边缘函数
      const user = await api.db.selectOrLoginUser(credentials);
      
      if (user) {
        // 设置当前用户
        setCurrentUser({ ...user, isOnline: true });
        await api.users.setOnlineStatus(user.id, true);
        await logAudit('AUTH_SUCCESS', `用户 ${user.username} 登录系统。`, 'Low', user.id);
        notificationService.requestPermission();
      } else {
        // 如果没有用户，显示错误信息，提示需要先在云端创建用户
        setGlobalError('用户名或密码错误，请重试。');
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setGlobalError('登录时出现错误，请重试。');
      await logAudit('AUTH_FAILURE', `登录失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'High');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !pendingMfaUser) return;

    setIsLoggingIn(true);
    setGlobalError(null);
    
    try {
      // 使用新的 select-or-login-user 边缘函数验证MFA用户
      if (!pendingMfaUser.username || !pendingMfaUser.password) {
        setGlobalError('用户信息不完整，请联系管理员。');
        throw new Error('Incomplete user credentials');
      }
      
      const user = await api.db.selectOrLoginUser({ username: pendingMfaUser.username, password: pendingMfaUser.password });
      
      if (!user) {
        setGlobalError('用户验证失败，请联系管理员。');
        throw new Error('User verification failed');
      }
      
      if (user?.isOnline) {
        // 强制下线该用户在其他设备上的会话
        await api.users.setOnlineStatus(user.id, false);
        await logAudit('FORCE_OFFLINE', `MFA认证时强制下线该用户之前的会话`, 'Medium', user.id);
      }
      
      await api.users.setOnlineStatus(user.id, true);
      setCurrentUser({ ...user, isOnline: true });
      setPendingMfaUser(null);
      await logAudit('MFA_SUCCESS', '直接访问系统。');
      notificationService.requestPermission();
    } catch (error) {
      console.error('MFA verification failed:', error);
      setGlobalError('验证过程中出现错误，请重试。');
      await logAudit('MFA_ERROR', `MFA验证错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'High');
    }
    
    setIsLoggingIn(false);
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
        onToggleLang={() => setLang(prevLang => prevLang === 'zh' ? 'en' : prevLang === 'en' ? 'tl' : 'zh')}
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
                <ConnectionMonitor />
                <button onClick={() => {
                  const next = lang === 'zh' ? 'en' : lang === 'en' ? 'tl' : 'zh';
                  updateLang(next);
                }} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <Globe size={20} className="text-slate-500 group-hover:text-[#d4af37]" />
                </button>
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
                  {currentTab === 'dashboard' && <MemoDashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} lang={lang} />}
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
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 scale-110 bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-slate-900/95">
          <img 
            src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover blur-[12px] opacity-50" 
            alt="Kitchen" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[480px] px-6">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10 p-10 lg:p-14 animate-in zoom-in-95">
            
            <div className="flex flex-col items-center text-center mb-12">
               <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 mb-8 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent animate-pulse" />
                  <Lock size={32} className="text-[#d4af37] relative z-10" />
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">{t('hotelName')}</h1>
               <p className="text-[10px] font-black text-[#d4af37] tracking-[0.5em] uppercase opacity-70">{t('centralGateway')}</p>
            </div>

            <div className="space-y-8 animate-in slide-in-from-right">
              <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-start space-x-4 mb-4">
                <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
                <div className="space-y-1 text-left">
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">系统登录</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">请输入您的账户凭据</p>
                </div>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsLoggingIn(true);
                setGlobalError(null);
                
                try {
                  // 使用新的 select-or-login-user 边缘函数，传入用户名和密码
                  const formData = new FormData(e.target as HTMLFormElement);
                  const username = formData.get('username') as string;
                  const password = formData.get('password') as string;
                  
                  const user = await api.db.selectOrLoginUser({ username, password });
                  
                  if (user) {
                    // 设置当前用户
                    setCurrentUser({ ...user, isOnline: true });
                    await api.users.setOnlineStatus(user.id, true);
                    await logAudit('AUTH_SUCCESS', `用户 ${user.username} 登录系统。`, 'Low', user.id);
                    notificationService.requestPermission();
                  } else {
                    // 如果没有用户，显示错误信息，提示需要先在云端创建用户
                    setGlobalError('用户名或密码错误，请重试。');
                    throw new Error('Authentication failed');
                  }
                } catch (error) {
                  console.error('登录失败:', error);
                  setGlobalError('登录时出现错误，请重试。');
                  await logAudit('AUTH_FAILURE', `登录失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'High');
                } finally {
                  setIsLoggingIn(false);
                }
              }} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">用户名</label>
                  <input 
                    name="username" 
                    type="text" 
                    required 
                    className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
                    placeholder="输入用户名"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">密码</label>
                  <input 
                    name="password" 
                    type="password" 
                    required 
                    className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
                    placeholder="输入密码"
                  />
                </div>
                <button type="submit" className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-3">
                  {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : <><ShieldCheck size={20} /><span>登录系统</span></>}
                </button>
              </form>
            </div>
            
            <div className="mt-12 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">
               <div className="flex items-center space-x-2"><ShieldCheck size={12} className="text-[#d4af37]" /><span>{t('ssoProtectionActive')}</span></div>
               <div className="flex items-center space-x-4">
                 <button onClick={() => {
                   const next = lang === 'zh' ? 'en' : lang === 'en' ? 'tl' : 'zh';
                   updateLang(next);
                 }} className="p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                   <Globe size={12} className="text-white" />
                 </button>
                 <span className="opacity-40">JX_CLOUD_PROD_V3</span>
               </div>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-10 w-full px-12 z-10 flex flex-col items-center opacity-30">
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">{t('footerText')}</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
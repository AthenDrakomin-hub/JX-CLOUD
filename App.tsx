
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { api } from './services/api';
import { notificationService } from './services/notification';
import { supabase, isDemoMode } from './services/supabaseClient';
import { AppUser as User, Order, HotelRoom, Expense, Dish, MaterialImage, UserRole, Partner, SystemConfig, OrderStatus } from './types';
import { translations as localTranslations, Language, getTranslation } from './translations';
import { ShieldCheck, Monitor, Lock, User as UserIcon, Sparkles, Globe, ChevronRight, Loader2 } from 'lucide-react';
import { INITIAL_USERS } from './constants';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user: currentUser, loading: isLoggingIn, error, login, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('jx_lang') as Language) || 'zh');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<MaterialImage[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  const announcedOrdersRef = useRef<Set<string>>(new Set());

  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({message, type});
  }, []);

  const t = useCallback((key: string): string => getTranslation(lang, key), [lang]);

  // Initialize system users if needed
  useEffect(() => {
    const initializeSystemUsers = async () => {
      try {
        console.log('Initializing system users...');
        await api.initSystemUsers();
        console.log('System users initialization completed');
      } catch (err) {
        console.error('Error initializing system users:', err);
      }
    };

    initializeSystemUsers();
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    localStorage.setItem('jx_lang', nextLang);
    showToast(nextLang === 'zh' ? '界面语言已切换为中文' : 'UI Language switched to English', 'info');
  }, [lang, showToast]);

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      // 使用并行请求获取所有数据
      const results = await Promise.allSettled([
        api.rooms.getAll(), 
        api.orders.getAll(), 
        api.expenses.getAll(),
        api.dishes.getAll(), 
        api.users.getAll(), 
        api.materials.getAll(),
        api.partners.getAll(), 
        api.config.get()
      ]);
      
      // 处理结果，即使部分请求失败也不影响其他数据的更新
      const [roomsResult, ordersResult, expensesResult, dishesResult, usersResult, materialsResult, partnersResult, configResult] = results;
      
      if (roomsResult.status === 'fulfilled') setRooms(roomsResult.value);
      if (ordersResult.status === 'fulfilled') {
        const orders = ordersResult.value;
        setOrders(orders);
        
        // 只有在配置可用时才执行语音广播
        if (configResult.status === 'fulfilled' && configResult.value.voiceBroadcastEnabled) {
          orders.forEach(order => {
            if (order.status === OrderStatus.PENDING && !announcedOrdersRef.current.has(order.id)) {
              notificationService.broadcastOrderVoice(order, lang, configResult.value.voiceVolume);
              announcedOrdersRef.current.add(order.id);
            }
          });
        }
      }
      if (expensesResult.status === 'fulfilled') setExpenses(expensesResult.value);
      if (dishesResult.status === 'fulfilled') setDishes(dishesResult.value);
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
      if (materialsResult.status === 'fulfilled') setMaterials(materialsResult.value);
      if (partnersResult.status === 'fulfilled') setPartners(partnersResult.value);
      if (configResult.status === 'fulfilled') setSysConfig(configResult.value);
    } catch (error) {
       if (!quiet) showToast(t('syncError'), "error");
    } finally { if (!quiet) setIsLoading(false); }
  }, [showToast, lang, t]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      // 使用更高效的同步机制
      const syncInterval = window.setInterval(async () => {
        try {
          // 只获取需要频繁更新的数据
          const orders = await api.orders.getAll();
          setOrders(orders);
          
          // 检查是否需要播放语音通知
          if (sysConfig?.voiceBroadcastEnabled) {
            orders.forEach(order => {
              if (order.status === OrderStatus.PENDING && !announcedOrdersRef.current.has(order.id)) {
                notificationService.broadcastOrderVoice(order, lang, sysConfig.voiceVolume);
                announcedOrdersRef.current.add(order.id);
              }
            });
          }
        } catch (error) {
          console.error('Sync error:', error);
        }
      }, 30000);
      
      return () => clearInterval(syncInterval);
    }
  }, [currentUser, sysConfig, lang]);

  useEffect(() => {
    if (sysConfig) {
      const root = document.documentElement;
      // 批量更新CSS变量以减少重排
      const styleUpdates = {
        '--font-family-main': sysConfig.fontFamily || "'Plus Jakarta Sans', sans-serif",
        '--font-size-base': `${sysConfig.fontSizeBase || 16}px`,
        '--font-weight-base': `${sysConfig.fontWeightBase || 500}`,
        '--line-height-base': `${sysConfig.lineHeightBase || 1.5}`,
        '--letter-spacing-base': `${sysConfig.letterSpacing || 0}px`,
      };
      
      // 批量设置样式
      Object.entries(styleUpdates).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
      });
      
      if (sysConfig.theme === 'custom') {
        root.style.setProperty('--text-main', sysConfig.textColorMain);
        root.style.setProperty('--app-bg', sysConfig.bgColorMain);
      }
      root.setAttribute('data-theme', sysConfig.theme);
    }
  }, [sysConfig]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const uname = fd.get('username') as string;
    const pwd = fd.get('password') as string;
    
    await login(uname, pwd);
    
    if (!error) {
      showToast(`${t('welcomeBack')}, ${currentUser?.full_name || currentUser?.name}`, "success");
    } else {
      showToast(t('loginFailed'), "error");
    }
  };

  const wrapAsync = useCallback(async (fn: () => Promise<any>, successMsg?: string) => {
    setIsSyncing(true);
    try {
      await fn();
      // 优化：只刷新必要的数据，而不是全部
      const results = await Promise.allSettled([
        api.rooms.getAll(), 
        api.orders.getAll(), 
        api.dishes.getAll()
      ]);
      
      const [roomsResult, ordersResult, dishesResult] = results;
      if (roomsResult.status === 'fulfilled') setRooms(roomsResult.value);
      if (ordersResult.status === 'fulfilled') {
        const orders = ordersResult.value;
        setOrders(orders);
        
        // 检查是否需要播放语音通知
        if (sysConfig?.voiceBroadcastEnabled) {
          orders.forEach(order => {
            if (order.status === OrderStatus.PENDING && !announcedOrdersRef.current.has(order.id)) {
              notificationService.broadcastOrderVoice(order, lang, sysConfig.voiceVolume);
              announcedOrdersRef.current.add(order.id);
            }
          });
        }
      }
      if (dishesResult.status === 'fulfilled') setDishes(dishesResult.value);
      
      if (successMsg) showToast(successMsg, "success");
    } catch (err) {
      showToast(t('syncError'), "error");
    } finally {
      setIsSyncing(false);
    }
  }, [showToast, t, sysConfig, lang]);

  const guestRoomId = new URLSearchParams(window.location.search).get('room');
  if (guestRoomId) {
    return (
      <GuestOrder 
        roomId={guestRoomId} 
        dishes={dishes} 
        onSubmitOrder={async (o) => { 
          await api.orders.create(o as Order); 
          // 只刷新订单数据，而不是所有数据
          try {
            const newOrders = await api.orders.getAll();
            setOrders(newOrders);
          } catch (error) {
            console.error('Failed to refresh orders:', error);
          }
          showToast(lang === 'zh' ? '点餐已确认' : 'Order confirmed', "success"); 
        }} 
        lang={lang} 
        onToggleLang={toggleLanguage}
        onRescan={() => window.location.href = window.location.origin}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 bg-slate-100 overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="Hospitality Background" 
          />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-up">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 lg:p-14 space-y-10 border border-white/50">
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center">
                 <div className="w-16 h-16 bg-slate-950 text-blue-500 rounded-3xl flex items-center justify-center font-black text-2xl italic shadow-2xl mb-4 border-2 border-white/20">JX</div>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">江西云厨管理系统</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">JX Cloud Terminal Interface</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">账号 Username</label>
                  <input 
                    name="username" 
                    type="text" 
                    placeholder="请输入工号" 
                    disabled={isLoggingIn}
                    required 
                    className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm disabled:opacity-50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">密码 Password</label>
                  <input 
                    name="password" 
                    type="password" 
                    placeholder="请输入密钥" 
                    disabled={isLoggingIn}
                    required 
                    className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm disabled:opacity-50" 
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="group w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-70"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <span>登录 Login</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            <div className="text-center">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] pt-4">© 2025 JX-Cloud Infrastructure Group</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        currentUser={currentUser} 
        onLogout={async () => { 
          await logout();
          showToast(lang === 'zh' ? '安全退出成功' : 'Logged out safely', "info"); 
        }} 
        lang={lang} 
        onToggleLang={toggleLanguage}
        isOpen={isSidebarOpen} 
      />
      <main className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-50 rounded-2xl text-slate-400"><Monitor size={24} /></button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-950 leading-none">{t(currentTab as any)}</h2>
                {isSyncing && <Loader2 className="animate-spin text-blue-500" size={18} />}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t(`role_${currentUser.role}` as any)} {t('statusActive')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-950">{currentUser.full_name || currentUser.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {currentUser.username}</p>
             </div>
             <div className="w-14 h-14 bg-slate-950 text-white rounded-[1.75rem] flex items-center justify-center font-black text-xl shadow-xl border-4 border-white">{(currentUser.full_name || currentUser.name)?.[0]}</div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full flex-1">
          {isLoading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.5em]">
              <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
              JX-Cloud Engine Orchestrating...
            </div>
          ) : (
            <div className="animate-fade-up">
              {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} lang={lang} />}
              {currentTab === 'rooms' && (
                <RoomGrid 
                  rooms={rooms} 
                  dishes={dishes} 
                  onUpdateRoom={(r) => wrapAsync(() => api.rooms.update(r), t('stationManagement') + (lang === 'zh' ? '已更新' : ' updated'))} 
                  onRefresh={() => fetchData(true)} 
                  lang={lang} 
                />
              )}
              {currentTab === 'orders' && (
                <OrderManagement 
                  orders={orders} 
                  onUpdateStatus={(id, s) => wrapAsync(() => api.orders.updateStatus(id, s), t('orders') + (lang === 'zh' ? '同步成功' : ' synced'))} 
                  lang={lang} 
                />
              )}
              {currentTab === 'supply_chain' && (
                <SupplyChainManager 
                  dishes={dishes} 
                  currentUser={currentUser} 
                  onAddDish={(d) => wrapAsync(() => api.dishes.create(d), lang === 'zh' ? '商品档案已录入' : 'Product recorded')} 
                  onUpdateDish={(d) => wrapAsync(() => api.dishes.update(d), lang === 'zh' ? '档案修改已保存' : 'Records saved')} 
                  onDeleteDish={(id) => wrapAsync(() => api.dishes.delete(id), lang === 'zh' ? '商品已下架' : 'Product removed')} 
                  lang={lang} 
                />
              )}
              {currentTab === 'financial_hub' && (
                <FinancialCenter 
                  orders={orders} 
                  expenses={expenses} 
                  partners={partners} 
                  onAddExpense={(e) => wrapAsync(() => api.expenses.create(e), lang === 'zh' ? '财务支出已记账' : 'Expense recorded')} 
                  onDeleteExpense={(id) => wrapAsync(() => api.expenses.delete(id))} 
                  onAddPartner={(p) => wrapAsync(() => api.partners.create(p), lang === 'zh' ? '联营商户注册成功' : 'Partner registered')} 
                  onUpdatePartner={(p) => wrapAsync(() => api.partners.update(p))} 
                  onDeletePartner={(id) => wrapAsync(() => api.partners.delete(id))} 
                  lang={lang} 
                />
              )}
              {currentTab === 'database' && <DatabaseManagement lang={lang} />}
              {currentTab === 'images' && <ImageManagement lang={lang} />}
              {currentTab === 'users' && (
                <StaffManagement 
                  users={users} 
                  onRefresh={() => fetchData(true)} 
                  onAddUser={(u) => wrapAsync(() => api.users.create(u), lang === 'zh' ? '新员工授权已签发' : 'Staff auth issued')} 
                  onUpdateUser={(u) => wrapAsync(() => api.users.update(u), lang === 'zh' ? '员工权限已更新' : 'Permissions updated')} 
                  onDeleteUser={(id) => wrapAsync(() => api.users.delete(id), lang === 'zh' ? '员工账号已吊销' : 'Account revoked')} 
                  lang={lang} 
                />
              )}
              {currentTab === 'settings' && (
                <SystemSettings 
                  lang={lang} 
                  onChangeLang={(l) => { setLang(l); localStorage.setItem('jx_lang', l); showToast(l === 'zh' ? '语言已切换至中文' : 'Language switched to English', "info"); }} 
                  onUpdateConfig={(c) => wrapAsync(() => api.config.update(c), lang === 'zh' ? '系统全局配置已存档' : 'Global config saved')} 
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
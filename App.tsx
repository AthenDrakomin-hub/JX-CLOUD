
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomGrid from './components/RoomGrid';
import OrderManagement from './components/OrderManagement';
import MenuManagement from './components/MenuManagement';
import ImageLibrary from './components/ImageLibrary';
import FinanceManagement from './components/FinanceManagement';
import StaffManagement from './components/StaffManagement';
import DeploymentChecklist from './components/DeploymentChecklist';
import LegalFooter from './components/LegalFooter';
import ErrorBoundary from './components/ErrorBoundary';
import GuestOrder from './components/GuestOrder';
import AuthCallback from './components/AuthCallback';
import NotificationCenter from './components/NotificationCenter';
import { api } from './services/api';
import { supabase } from './services/supabaseClient';
import { notificationService } from './services/notification';
import { User, Order, HotelRoom, Expense, Dish, MaterialImage, PaymentMethod, UserRole } from './types';
import { translations as localTranslations, Language } from './translations';
import { Globe, Server, LockKeyhole, ArrowRight, Star, ChevronDown, Check, Bell } from 'lucide-react';

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
  const [guestRoomId, setGuestRoomId] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = useCallback((key: string) => {
    // 优先使用动态翻译（云端），然后是本地翻译
    const dynamicLangSet = dynamicTranslations[lang];
    const localLangSet = localTranslations[lang];
    
    // 首先尝试动态翻译集
    if (dynamicLangSet && key in dynamicLangSet) {
      return (dynamicLangSet as any)[key];
    }
    
    // 然后尝试本地翻译集
    if (localLangSet && key in localLangSet) {
      return (localLangSet as any)[key];
    }
    
    // 最后尝试本地中文翻译集
    const localZhSet = localTranslations.zh;
    if (localZhSet && key in localZhSet) {
      return (localZhSet as any)[key];
    }
    
    // 如果都找不到，返回key本身
    return key;
  }, [lang, dynamicTranslations]);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('jx_lang', newLang);
    setIsLangMenuOpen(false);
  };

  const fetchData = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setGlobalError(null);
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

      if (cloudDict && cloudDict.length > 0) {
        const merged: any = { zh: { ...localTranslations.zh }, en: { ...localTranslations.en }, tl: { ...localTranslations.tl } };
        cloudDict.forEach((item: any) => {
          if (item.key) {
            merged.zh[item.key] = item.zh || merged.zh[item.key];
            merged.en[item.key] = item.en || merged.en[item.key];
            merged.tl[item.key] = item.tl || merged.tl[item.key];
          }
        });
        setDynamicTranslations(merged);
      }

      setRooms(r || []);
      setOrders(o || []);
      setExpenses(e || []);
      setDishes(d || []);
      setUsers(u || []);
      setMaterials(m || []);
    } catch (err: any) { 
      console.warn('数据同步波动 (保持本地状态):', err?.message || err);
    } finally { 
      setIsLoading(false); 
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new as any;
          // 数据校准：确保数值类型正确
          const newOrder: Order = {
            ...raw,
            totalAmount: Number(raw.total_amount || raw.totalAmount || 0),
            taxAmount: Number(raw.tax_amount || raw.taxAmount || 0)
          };
          
          setOrders(prev => [newOrder, ...prev]);
          const msg = `房间 ${newOrder.roomId} 有新订单! 总额: ₱${newOrder.totalAmount}`;
          notificationService.send('新订单通知', msg, 'NEW_ORDER');
          
          setAppNotifications(prev => [{
            id: newOrder.id || `notif-${Date.now()}`,
            title: t('pending'),
            body: msg,
            type: 'NEW_ORDER' as any,
            timestamp: new Date(),
            read: false
          }, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const callbackPath = window.location.pathname === '/auth/callback';
    
    if (callbackPath) {
      // 如果是认证回调路径，不执行其他初始化
      return;
    }
    
    if (roomParam) setGuestRoomId(roomParam);
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // 仅挂载时执行

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 记录登录尝试
      const loginAttempt = {
        username: loginForm.username,
        timestamp: new Date().toISOString(),
        ip: 'CLIENT_IP', // 在实际部署中应从服务器获取
        userAgent: navigator.userAgent
      };
      
      // 使用 Supabase Auth 进行身份验证
      // 直接使用 Supabase Auth 进行身份验证
      // 用户需要使用注册时的邮箱和密码登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.username, // 这里应该是邮箱
        password: loginForm.password
      });
      
      if (error) {
        console.warn('Login failed:', loginAttempt, error);
        setGlobalError('无效的身份或凭据');
        setTimeout(() => setGlobalError(null), 3000);
        return;
      }
      
      // 如果认证成功，从用户列表中查找用户信息
      const matchedUser = users.find(u => u.username === loginForm.username);
      
      if (matchedUser) {
        setCurrentUser(matchedUser);
        notificationService.requestPermission();
        // 记录成功登录
        console.log('Login successful:', loginAttempt);
      } else {
        setGlobalError('用户不存在');
        setTimeout(() => setGlobalError(null), 3000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setGlobalError('登录失败，请重试');
      setTimeout(() => setGlobalError(null), 3000);
    }
  };

  const LanguageSelector = ({ light = false }) => {
    const langs: { id: Language; label: string; sub: string }[] = [
      { id: 'zh', label: '简体中文', sub: 'Simplified Chinese' },
      { id: 'en', label: 'English', sub: 'United States' },
      { id: 'tl', label: 'Filipino', sub: 'Pilipinas' }
    ];

    return (
      <div className="relative" ref={langMenuRef}>
        <button 
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
          className={`flex items-center space-x-3 px-5 py-2.5 rounded-full border transition-all active:scale-95 group
            ${light ? 'bg-white/5 border-white/10 text-white hover:bg-white/15' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-[#d4af37] hover:bg-amber-50'}`}
        >
          <Globe size={16} className={light ? 'text-[#d4af37]' : 'text-slate-400 group-hover:text-[#d4af37]'} />
          <span className="text-[10px] font-black uppercase tracking-widest">{langs.find(l => l.id === lang)?.label}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {isLangMenuOpen && (
          <div className={`absolute right-0 mt-3 w-64 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200 z-[100] ${light ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-100'}`}>
            <div className="p-3 space-y-1">
              {langs.map((l) => (
                <button key={l.id} onClick={() => setLanguage(l.id)} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${lang === l.id ? (light ? 'bg-white/10 text-white' : 'bg-slate-50 text-[#d4af37]') : (light ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}`}>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest">{l.label}</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-0.5">{l.sub}</p>
                  </div>
                  {lang === l.id && <Check size={16} className="text-[#d4af37]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (window.location.pathname === '/auth/callback') {
    return (
      <ErrorBoundary lang={lang}>
        <AuthCallback 
          lang={lang}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            // 重定向到主页
            window.location.href = '/';
          }}
          onLoginFailure={() => {
            // 重定向到登录页
            window.location.href = '/';
          }}
        />
      </ErrorBoundary>
    );
  }
  
  if (guestRoomId) {
    return (
      <ErrorBoundary lang={lang}>
        <GuestOrder 
          roomId={guestRoomId} 
          dishes={dishes} 
          onSubmitOrder={async (data) => { 
            await api.orders.create({ 
              ...data as Order, 
              id: `ord-${Date.now()}` 
            }); 
            fetchData();
          }} 
          lang={lang} 
          onToggleLang={() => setLanguage(lang === 'zh' ? 'en' : lang === 'en' ? 'tl' : 'zh')} 
          onRescan={() => { setGuestRoomId(null); window.history.replaceState(null, '', window.location.pathname); }} 
        />
      </ErrorBoundary>
    );
  }

  if (currentUser) {
    const unreadCount = appNotifications.filter(n => !n.read).length;
    return (
      <ErrorBoundary lang={lang}>
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} userRole={currentUser.role} onLogout={() => setCurrentUser(null)} lang={lang} />
          <main className="md:pl-72 min-h-screen">
            <header className="sticky top-0 z-40 h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-10 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">{t('centralConsole')}</span>
                 <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">{t(currentTab)}</h2>
              </div>
              <div className="flex items-center space-x-10">
                <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                >
                  <Bell size={20} className="text-slate-400 group-hover:text-[#d4af37]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <div className="hidden lg:flex items-center space-x-6">
                   <div className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.6)]`}></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isSyncing ? t('syncing') : t('encryptedConnect')}</span>
                   </div>
                   <div className="h-4 w-[1px] bg-slate-200"></div>
                   <LanguageSelector />
                </div>
                <div className="flex items-center space-x-4">
                   <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</p>
                      <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-tighter mt-1">{currentUser.role}</p>
                   </div>
                   <div className="w-12 h-12 bg-[#0f172a] text-white rounded-[1.25rem] flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white">
                      {currentUser.name[0]}
                   </div>
                </div>
              </div>
            </header>
            <div className="p-12 max-w-[1500px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>
              ) : (
                <>
                  {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} lang={lang} />}
                  {currentTab === 'rooms' && <RoomGrid rooms={rooms} onUpdateRoom={async (r) => { await api.rooms.update(r); fetchData(); }} lang={lang} />}
                  {currentTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={async (id, s) => { await api.orders.updateStatus(id, s); fetchData(); }} lang={lang} />}
                  {currentTab === 'menu' && <MenuManagement dishes={dishes} materials={materials} onAddDish={async (d) => { await api.dishes.create(d); fetchData(); }} onUpdateDish={async (d) => { await api.dishes.update(d); fetchData(); }} onDeleteDish={async (id) => { await api.dishes.delete(id); fetchData(); }} onAddMaterial={async (m) => { await api.materials.create(m); fetchData(); }} onDeleteMaterial={async (id) => { await api.materials.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'materials' && <ImageLibrary materials={materials} onAddMaterial={async (m) => { await api.materials.create(m); fetchData(); }} onDeleteMaterial={async (id) => { await api.materials.delete(id); fetchData(); }} currentUser={currentUser} lang={lang} />}
                  {currentTab === 'users' && <StaffManagement users={users} onAddUser={async (u) => { await api.users.create(u); fetchData(); }} onDeleteUser={async (id) => { await api.users.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'finance' && <FinanceManagement orders={orders} expenses={expenses} onAddExpense={async (e) => { await api.expenses.create(e); fetchData(); }} onDeleteExpense={async (id) => { await api.expenses.delete(id); fetchData(); }} lang={lang} />}
                  {currentTab === 'deployment' && <DeploymentChecklist lang={lang} />}
                </>
              )}
            </div>
            <NotificationCenter 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)} 
              notifications={appNotifications}
              onMarkAsRead={(id) => setAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
              onClearAll={() => setAppNotifications([])}
            />
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-10 right-10 z-50"><LanguageSelector light /></div>
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950 z-10" />
           <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80" className="w-full h-full object-cover grayscale opacity-30 animate-gold" alt="luxury hotel" />
        </div>
        <div className="max-w-[420px] w-full relative z-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="text-center mb-12">
             <div className="flex items-center justify-center space-x-2 mb-6">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="text-[#d4af37]" fill="#d4af37" />)}
             </div>
             <h1 className="text-5xl font-serif text-white tracking-tighter mb-4 italic uppercase">{t('jxCloud')}</h1>
             <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[9px]">{t('hospitalitySuite')}</p>
          </div>
          <form onSubmit={handleLogin} className="glass p-12 rounded-[3.5rem] shadow-2xl space-y-10 border-white/10">
             <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">{t('systemAccess')}</h3>
                <p className="text-xs text-slate-400 font-medium">{t('verifyCredentials')}</p>
             </div>
             {globalError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in-95">{globalError}</div>
             )}
             <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('identity')}</label>
                 <div className="relative">
                   <input type="text" value={loginForm.username} onChange={e => setLoginForm(p => ({...p, username: e.target.value}))} className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] focus:bg-white/10 font-bold text-white transition-all placeholder:text-slate-700" placeholder={t('username') + ' (email)'} required />
                   <Server size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700" />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('credential')}</label>
                 <div className="relative">
                   <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({...p, password: e.target.value}))} className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] focus:bg-white/10 font-bold text-white transition-all placeholder:text-slate-700" placeholder={t('password')} required />
                   <LockKeyhole size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700" />
                 </div>
               </div>
               <button type="submit" className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] hover:text-white transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center space-x-4 group">
                 <span>{t('initializeSession')}</span>
                 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
          </form>
          
          <div className="mt-12">
            <LegalFooter lang={lang} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
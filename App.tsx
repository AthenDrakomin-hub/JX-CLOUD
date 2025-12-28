
import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { performanceMonitor } from './services/performance';
import Sidebar from './components/Sidebar';
import LegalFooter from './components/LegalFooter';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import { api } from './services/api';
import { notificationService } from './services/notification';
import { User, Order, HotelRoom, Expense, Dish, MaterialImage, UserRole } from './types';
import { translations as localTranslations, Language } from './translations';
import { 
  Globe, LockKeyhole, ArrowRight, ChevronDown, Bell, 
  Building2, User as UserIcon, Loader2, 
  Eye, EyeOff, ShieldCheck, X, ShieldAlert, Gavel
} from 'lucide-react';

// 懒加载组件以实现代码分割
const Dashboard = lazy(() => import('./components/Dashboard'));
const RoomGrid = lazy(() => import('./components/RoomGrid'));
const OrderManagement = lazy(() => import('./components/OrderManagement'));
const MenuManagement = lazy(() => import('./components/MenuManagement'));
const ImageLibrary = lazy(() => import('./components/ImageLibrary'));
const FinanceManagement = lazy(() => import('./components/FinanceManagement'));
const StaffManagement = lazy(() => import('./components/StaffManagement'));
const PaymentManagement = lazy(() => import('./components/PaymentManagement'));
const SystemSettings = lazy(() => import('./components/SystemSettings'));

const MemoDashboard = React.memo(Dashboard);
const MemoRoomGrid = React.memo(RoomGrid);
const MemoOrderManagement = React.memo(OrderManagement);
const MemoMenuManagement = React.memo(MenuManagement);
const MemoImageLibrary = React.memo(ImageLibrary);
const MemoStaffManagement = React.memo(StaffManagement);
const MemoFinanceManagement = React.memo(FinanceManagement);
const MemoPaymentManagement = React.memo(PaymentManagement);
const MemoSystemSettings = React.memo(SystemSettings);

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN || '', // Use environment variable for DSN
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
  environment: process.env.NODE_ENV || 'development',
});

const App: React.FC = () => {
  // 初始化性能监控
  useEffect(() => {
    performanceMonitor.startMonitoring();
    
    // 记录应用启动性能
    const appStartEvent = performanceMonitor.startEvent('app-initialization');
    
    return () => {
      performanceMonitor.endEvent(appStartEvent);
      performanceMonitor.stopMonitoring();
    };
  }, []);
  
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
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  
  // 登录状态
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 法律合规弹窗
  const [legalModal, setLegalModal] = useState<'privacy' | 'disclaimer' | null>(null);
  
  const langMenuRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const activeTranslationSet = useMemo(() => {
    return dynamicTranslations[lang] || dynamicTranslations.zh || localTranslations.zh;
  }, [lang, dynamicTranslations]);

  const t = useCallback((key: string) => {
    return activeTranslationSet[key] || (localTranslations.zh as any)[key] || key;
  }, [activeTranslationSet]);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('jx_lang', newLang);
    setIsLangMenuOpen(false);
  };

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

      // rooms.getAll()直接返回数组，无需额外处理
      setRooms(Array.isArray(r) ? r : r || []);
      // 处理API响应，safeApiCall返回NetworkResponse类型
      setOrders(Array.isArray(o) ? o : []);
      setExpenses(Array.isArray(e) ? e : []);
      setDishes(Array.isArray(d) ? d : []);
      setUsers(Array.isArray(u) ? u : []);
      setMaterials(Array.isArray(m) ? m : []);

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
    } catch (err: any) { 
      console.warn('Sync jitter');
    } finally { 
      if (isMounted.current) {
        setIsLoading(false); 
        setIsSyncing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((msg) => {
      setAppNotifications(prev => [
        {
          id: `notif-${Date.now()}-${Math.random()}`,
          title: msg.title,
          body: msg.body,
          type: msg.type,
          timestamp: new Date(),
          read: false
        },
        ...prev
      ].slice(0, 50));
      fetchData();
    });
    return unsubscribe;
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setGlobalError(null);
    await new Promise(r => setTimeout(r, 800));

    // Fix: Ensure allUsers elements conform to the User interface by adding 'permissions' property
    const allUsers: User[] = users.length > 0 ? users : [
      { 
        id: 'u1', 
        username: 'admin1', 
        role: UserRole.ADMIN, 
        name: '主理人·张', 
        permissions: ['manage_menu', 'view_finance', 'process_orders', 'manage_staff', 'system_config', 'material_assets'] 
      },
      { 
        id: 'u3', 
        username: 'staff1', 
        role: UserRole.STAFF, 
        name: '前厅·小李', 
        permissions: ['process_orders', 'material_assets'] 
      }
    ];

    const inputUsername = loginForm.username.trim();
    const matchedUser = allUsers.find(u => u.username === inputUsername);
    
    const isPasswordCorrect = (inputUsername === 'admin1' && loginForm.password === 'admin123') || 
                              (inputUsername === 'staff1' && loginForm.password === 'staff123');
    
    if (matchedUser && isPasswordCorrect) {
      setCurrentUser(matchedUser);
      notificationService.requestPermission();
    } else {
      setGlobalError(t('invalidCredentials'));
      setTimeout(() => { if (isMounted.current) setGlobalError(null); }, 3000);
    }
    setIsLoggingIn(false);
  };

  const LanguageSelector = () => {
    const langs = useMemo(() => [
      { id: 'zh', label: '简体中文' },
      { id: 'en', label: 'English' }
    ], []);

    return (
      <div className="relative" ref={langMenuRef}>
        <button 
          type="button"
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100/50 rounded-lg text-slate-600 hover:text-slate-900 transition-all active:scale-95"
        >
          <Globe size={14} className="text-[#d4af37]" />
          <span className="text-[10px] font-black uppercase tracking-widest">{lang.toUpperCase()}</span>
          <ChevronDown size={12} className={`transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {isLangMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100]">
            <div className="p-1">
              {langs.map((l) => (
                <button 
                  key={l.id} 
                  onClick={() => setLanguage(l.id as Language)} 
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === l.id ? 'bg-slate-50 text-[#d4af37]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const LegalModal = () => {
    if (!legalModal) return null;
    const isPrivacy = legalModal === 'privacy';
    
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setLegalModal(null)} />
        <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[85vh] flex flex-col">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPrivacy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {isPrivacy ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{isPrivacy ? t('privacyPolicy') : t('disclaimerTitle')}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">JX-Cloud Legal Compliance</p>
              </div>
            </div>
            <button onClick={() => setLegalModal(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
          <div className="p-12 overflow-y-auto no-scrollbar space-y-8 flex-1">
            {isPrivacy ? (
              <div className="space-y-8 text-sm text-slate-600 leading-relaxed font-medium">
                <div className="space-y-2">
                   <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('privacyTitle1')}</h5>
                   <p>{t('privacyDesc1')}</p>
                </div>
                <div className="space-y-2">
                   <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('privacyTitle2')}</h5>
                   <p>{t('privacyDesc2')}</p>
                </div>
                <div className="space-y-2">
                   <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('privacyTitle3')}</h5>
                   <p>{t('privacyDesc3')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 text-sm text-slate-600 leading-relaxed font-medium">
                <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 text-red-700">
                  <p className="font-bold">{t('disclaimerWarning')}</p>
                </div>
                <div className="space-y-2">
                   <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('disclaimerTitle1')}</h5>
                   <p>{t('disclaimerDesc1')}</p>
                </div>
                <div className="space-y-2">
                   <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('disclaimerTitle2')}</h5>
                   <p>{t('disclaimerDesc2')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-8 border-t border-slate-300 bg-slate-50/50 flex justify-end shrink-0">
             <button onClick={() => setLegalModal(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#d4af37] transition-all active:scale-95 shadow-lg">
                Got it
             </button>
          </div>
        </div>
      </div>
    );
  };

  if (currentUser) {
    const unreadCount = appNotifications.filter(n => !n.read).length;
    return (
      <ErrorBoundary lang={lang}>
        <div className="min-h-screen bg-slate-100 text-slate-900">
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} userRole={currentUser.role} onLogout={() => setCurrentUser(null)} lang={lang} />
          <main className="pl-72 min-h-screen">
            <header className="sticky top-0 z-40 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-400 px-10 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] leading-none mb-1">{t('centralConsole')}</span>
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t(currentTab)}</h2>
              </div>
              <div className="flex items-center space-x-8">
                <button onClick={() => setIsNotificationsOpen(true)} className="relative p-3 bg-white border border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <Bell size={20} className="text-slate-400 group-hover:text-[#d4af37]" />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">{unreadCount}</span>}
                </button>
                <div className="hidden lg:flex items-center space-x-6">
                   <div className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.6)]`}></div>
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{isSyncing ? t('syncing') : t('encryptedConnect')}</span>
                   </div>
                   <div className="h-4 w-[1px] bg-slate-500"></div>
                   <LanguageSelector />
                </div>
                <div className="flex items-center space-x-4 border-l border-slate-400 pl-8">
                   <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</p>
                      <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-tighter mt-1">{currentUser.role}</p>
                   </div>
                   <div className="w-12 h-12 bg-[#0f172a] text-white rounded-[1.25rem] flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white">{currentUser.name[0]}</div>
                </div>
              </div>
            </header>
            <div className="p-12 max-w-[1500px] mx-auto tab-content-enter">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>
              ) : (
                <>
                  {currentTab === 'dashboard' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoDashboard orders={orders} rooms={rooms} expenses={expenses} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'rooms' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoRoomGrid rooms={rooms} dishes={dishes} onRefresh={fetchData} onUpdateRoom={async (r) => { await api.rooms.update(r); fetchData(); }} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'orders' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoOrderManagement orders={orders} onUpdateStatus={async (id, s) => { await api.orders.updateStatus(id, s); fetchData(); }} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'menu' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoMenuManagement dishes={dishes} materials={materials} onAddDish={async (d) => { await api.dishes.create(d); fetchData(); }} onUpdateDish={async (d) => { await api.dishes.update(d); fetchData(); }} onDeleteDish={async (id) => { await api.dishes.delete(id); fetchData(); }} onAddMaterial={async (m) => { await api.materials.create(m); fetchData(); }} onDeleteMaterial={async (id) => { await api.materials.delete(id); fetchData(); }} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'materials' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoImageLibrary materials={materials} onAddMaterial={async (m) => { await api.materials.create(m); fetchData(); }} onDeleteMaterial={async (id) => { await api.materials.delete(id); fetchData(); }} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'finance' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoFinanceManagement orders={orders} expenses={expenses} onAddExpense={async (e) => { await api.expenses.create(e); fetchData(); }} onDeleteExpense={async (id) => { await api.expenses.delete(id); fetchData(); }} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'payments' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoPaymentManagement lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'users' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoStaffManagement users={users} onAddUser={async (u) => { await api.users.create(u); fetchData(); }} onDeleteUser={async (id) => { await api.users.delete(id); fetchData(); }} lang={lang} />
                    </Suspense>
                  )}
                  {currentTab === 'settings' && (
                    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div></div>}>
                      <MemoSystemSettings lang={lang} />
                    </Suspense>
                  )}
                </>
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
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden font-sans bg-slate-900">
        
        {/* 背景装饰 */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#d4af37]/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* 登录模态框 */}
        <div className="relative z-10 w-full max-w-md px-6 animate-in zoom-in-95 fade-in duration-700">
           <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col p-10 md:p-12 space-y-10">
              
              <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                     {lang === 'zh' ? '江西大酒店' : 'Jiangxi Hotel'}
                   </h2>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37] mt-2">Enterprise Suite</span>
                 </div>
                 <LanguageSelector />
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                 {globalError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 text-center animate-shake">
                      {globalError}
                    </div>
                 )}
                 
                 <div className="space-y-4">
                    <div className="relative group">
                       <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={20} />
                       <input 
                          type="text" 
                          autoComplete="username"
                          value={loginForm.username} 
                          onChange={e => setLoginForm(p => ({...p, username: e.target.value}))} 
                          className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-400 rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 font-bold text-slate-900 transition-all placeholder:text-slate-500" 
                          placeholder={t('username')} 
                          required 
                       />
                    </div>

                    <div className="relative group">
                       <LockKeyhole className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={20} />
                       <input 
                          type={showPassword ? "text" : "password"} 
                          autoComplete="current-password"
                          value={loginForm.password} 
                          onChange={e => setLoginForm(p => ({...p, password: e.target.value}))} 
                          className="w-full pl-14 pr-14 py-5 bg-slate-50 border border-slate-400 rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 font-bold text-slate-900 transition-all placeholder:text-slate-500" 
                          placeholder={t('password')} 
                          required 
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                       >
                         {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                       </button>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isLoggingIn}
                   className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#d4af37] transition-all shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-50"
                 >
                    {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : (
                      <>
                        <span>{t('initializeSession')}</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                 </button>
              </form>

              <div className="pt-6 border-t border-slate-300">
                 <div className="flex items-center justify-center space-x-4 mb-4">
                    <button 
                      type="button" 
                      onClick={() => setLegalModal('privacy')}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t('privacyPolicy')}
                    </button>
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <button 
                      type="button" 
                      onClick={() => setLegalModal('disclaimer')}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t('disclaimerTitle')}
                    </button>
                 </div>
                 <div className="flex items-center justify-center space-x-2 text-slate-300">
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">JX-Cloud Secure Auth Gateway</span>
                 </div>
              </div>
           </div>
        </div>

        {/* 法律弹窗 */}
        <LegalModal />

        <div className="fixed bottom-10 flex items-center space-x-3 text-white/20 select-none">
           <Building2 size={24} />
           <div className="h-6 w-[1px] bg-white/10" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em]">JX Cloud Node v3.1</span>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;

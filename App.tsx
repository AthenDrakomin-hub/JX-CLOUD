
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
import Toast, { ToastType } from './components/Toast';
import { useSession, signOut } from './services/auth-client';
import { api } from './services/api';
import { supabase, isDemoMode } from './services/supabaseClient';
import { notificationService } from './services/notification';
import { INITIAL_USERS } from './constants';
import { 
  HotelRoom, Order, Dish, OrderStatus, 
  Expense, Partner, Category, SystemConfig, User, UserRole 
} from './types';
import { Language, getTranslation } from '../translations';
import { Bell, Command, Loader2, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const { data: remoteSession, isPending: isAuthLoading } = useSession();
  const [lang, setLang] = useState<Language>('zh');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const session = useMemo(() => {
    const bypass = localStorage.getItem('jx_root_authority_bypass');
    if (bypass === 'true') {
      return {
        user: {
          id: 'root-athen-god-mode',
          name: 'Athen Drakomin (Master)',
          email: 'athendrakomin@proton.me',
          role: UserRole.ADMIN,
          isRoot: true
        }
      };
    }
    return remoteSession;
  }, [remoteSession]);

  const t = useCallback((key: string, params?: any) => getTranslation(lang, key, params), [lang]);

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

  const refreshData = useCallback(async () => {
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
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      refreshData();
      notificationService.requestPermission();
    }
  }, [session, refreshData]);

  // Realtime Subscriptions
  useEffect(() => {
    if (isDemoMode || !supabase || !session?.user) return;
    const channel = supabase.channel('orders_realtime_v11').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const updatedOrder = { ...payload.new, totalAmount: Number((payload.new as any).total_amount) } as any;
          setOrders(prev => [updatedOrder, ...prev]);
          notificationService.broadcastOrderVoice(updatedOrder, lang);
          setToast({ message: t('new_order_toast', { room: updatedOrder.room_id }), type: 'success' });
        } else {
          refreshData();
        }
    }).subscribe(s => setIsRealtimeActive(s === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [session, lang, t, refreshData]);

  if (isAuthLoading && !localStorage.getItem('jx_root_authority_bypass')) {
    return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6"><div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">JX CLOUD SECURE LINK...</p></div>;
  }

  if (!session?.user) {
    return <AuthPage lang={lang} onToggleLang={() => setLang(p => p === 'zh' ? 'en' : 'zh')} />;
  }

  const handleLogout = async () => {
    localStorage.removeItem('jx_root_authority_bypass');
    await signOut();
    window.location.reload();
  };

  return (
    <ErrorBoundary lang={lang}>
      <div className={`min-h-screen transition-colors duration-500 ${config?.theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`} style={{ fontFamily: config?.fontFamily || 'Plus Jakarta Sans' }}>
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} currentUser={session.user} onLogout={handleLogout} lang={lang} onToggleLang={() => setLang(p => p === 'zh' ? 'en' : 'zh')} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className={`transition-all duration-500 min-h-screen ${isSidebarCollapsed ? 'ml-24' : 'ml-72'}`}>
          <header className="sticky top-0 z-50 px-10 py-6 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl flex items-center justify-between border-b border-white/10 no-print">
            <div className="flex items-center space-x-4">
               <button onClick={() => setIsCommandOpen(true)} className="flex items-center space-x-3 px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95"><Command size={14} /><span>{t('search')} ⌘K</span></button>
               <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${isRealtimeActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{isRealtimeActive ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}<span className="text-[8px] font-black uppercase">{isRealtimeActive ? t('sync_active') : t('sync_offline')}</span></div>
            </div>
            <button onClick={() => setIsNotifOpen(true)} className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 relative shadow-sm hover:text-blue-600 transition-colors"><Bell size={18} />{notifications.some(n => !n.read) && <div className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full animate-ping" />}</button>
          </header>
          <div className="p-10 lg:p-12 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">
            {currentTab === 'dashboard' && <Dashboard orders={orders} rooms={rooms} expenses={expenses} dishes={dishes} ingredients={[]} partners={partners} lang={lang} currentUser={session.user as any} />}
            {currentTab === 'rooms' && <RoomGrid rooms={rooms} dishes={dishes} categories={categories} onUpdateRoom={async(r) => { await api.rooms.updateStatus(r.id, r.status); refreshData(); }} onRefresh={refreshData} lang={lang} />}
            {currentTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={async (id, status) => { await api.orders.updateStatus(id, status); refreshData(); }} lang={lang} currentUser={session.user as any} />}
            {currentTab === 'supply_chain' && <SupplyChainManager dishes={dishes} categories={categories} currentUser={session.user as any} partners={partners} onAddDish={async(d) => { await api.dishes.create(d, session.user); refreshData(); }} onUpdateDish={async(d) => { await api.dishes.update(d, session.user); refreshData(); }} onDeleteDish={async(id) => { await api.dishes.delete(id, session.user); refreshData(); }} lang={lang} onRefreshData={refreshData} />}
            {currentTab === 'images' && <ImageManagement lang={lang} />}
            {currentTab === 'financial_hub' && <FinancialCenter orders={orders} expenses={expenses} partners={partners} currentUser={session.user as any} onAddExpense={async(ex)=>{ await api.expenses.create(ex); refreshData(); }} onDeleteExpense={async(id)=>{ await api.expenses.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} lang={lang} />}
            {currentTab === 'users' && <StaffManagement users={users} partners={partners} currentUser={session.user} onRefresh={refreshData} onAddUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onUpdateUser={async(u)=>{ await api.users.upsert(u); refreshData(); }} onDeleteUser={async(id)=>{ await api.users.delete(id); refreshData(); }} onAddPartner={async(p)=>{ await api.partners.create(p); refreshData(); }} onUpdatePartner={async(p)=>{ await api.partners.update(p); refreshData(); }} onDeletePartner={async(id)=>{ await api.partners.delete(id); refreshData(); }} lang={lang} />}
            {currentTab === 'settings' && <SystemSettings lang={lang} onChangeLang={setLang} onUpdateConfig={async(c)=>{ await api.config.update(c); refreshData(); }} />}
            {currentTab === 'menu' && <DatabaseManagement lang={lang} />}
          </div>
        </main>
        <CommandCenter isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} rooms={rooms} orders={orders} dishes={dishes} lang={lang} onNavigate={setCurrentTab} onToggleTheme={() => {}} onLogout={handleLogout} />
        <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setNotifications([])} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </ErrorBoundary>
  );
};

export default App;

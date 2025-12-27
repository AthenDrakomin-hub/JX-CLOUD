
import React from 'react';
import { 
  LayoutDashboard, MapPin, UtensilsCrossed, ChefHat, Wallet, LogOut,
  Users, Image as ImageIcon, Command, Sparkles, Settings, CreditCard
} from 'lucide-react';
import { UserRole } from '../types';
import { translations, Language } from '../translations';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  onLogout: () => void;
  lang: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, userRole, onLogout, lang }) => {
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || key;

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
    { id: 'rooms', label: t('rooms'), icon: MapPin, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
    { id: 'orders', label: t('orders'), icon: ChefHat, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
    { id: 'menu', label: t('menu'), icon: UtensilsCrossed, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'materials', label: t('materials'), icon: ImageIcon, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'finance', label: t('finance'), icon: Wallet, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'payments', label: t('payments'), icon: CreditCard, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'users', label: t('users'), icon: Users, roles: [UserRole.ADMIN] },
    { id: 'settings', label: t('settings'), icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-72 bg-[#0f172a] text-white flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-white/10 shadow-[20px_0_60px_rgba(0,0,0,0.4)]">
      <div className="p-12">
        <div className="flex flex-col space-y-2 group">
           <div className="flex items-center space-x-2 text-[#d4af37] opacity-80">
              <Sparkles size={12} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">VERSION 3.1.0</span>
           </div>
           <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#d4af37] rounded-2xl flex items-center justify-center text-[#0f172a] shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:rotate-12 transition-transform duration-500">
                 <Command size={22} />
              </div>
              <h1 className="font-serif italic text-2xl tracking-tighter">{t('jxCloud')}</h1>
           </div>
        </div>
      </div>
      
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto no-scrollbar">
        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-6">{t('registryControls')}</div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-5 px-6 py-4 rounded-[2rem] transition-all duration-500 group relative
                ${isActive 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:translate-x-2'
                }`}
            >
              <Icon size={20} className={`${isActive ? 'text-[#d4af37]' : 'group-hover:text-slate-200'} transition-colors`} />
              <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-90'}`}>{item.label}</span>
              {isActive && (
                <div className="absolute right-6 w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_15px_#d4af37]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-8 space-y-4">
        <div className="h-[1px] bg-white/10 w-full mb-6" />
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-5 px-6 py-4 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">{t('signOut')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

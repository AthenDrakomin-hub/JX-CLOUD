
import React from 'react';
import { 
  LayoutDashboard, MapPin, UtensilsCrossed, ChefHat, Wallet, LogOut,
  Users, Image as ImageIcon, Command, Sparkles, Settings, CreditCard, X
} from 'lucide-react';
import { UserRole } from '../types';
import { translations, Language } from '../translations';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  onLogout: () => void;
  lang: Language;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, userRole, onLogout, lang, isOpen }) => {
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
    <div className={`w-72 bg-[#020617] text-white flex flex-col h-screen fixed left-0 top-0 z-[60] border-r border-white/5 shadow-[25px_0_50px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 lg:p-12">
        <div className="flex flex-col space-y-3 group">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2 text-[#d4af37]">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">VER 3.1.0</span>
             </div>
           </div>
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#d4af37] rounded-2xl flex items-center justify-center text-[#0f172a] shadow-[0_0_25px_rgba(212,175,55,0.4)] group-hover:rotate-12 transition-transform duration-500 shrink-0">
                 {/* Fixed: Replaced invalid lg:size prop with responsive className */}
                 <Command className="w-[22px] h-[22px] lg:w-[26px] lg:h-[26px]" />
              </div>
              <h1 className="font-serif italic text-2xl lg:text-3xl tracking-tighter text-white truncate">{t('jxCloud')}</h1>
           </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 lg:px-8 space-y-2 overflow-y-auto no-scrollbar">
        <div className="text-[10px] lg:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 lg:mb-8 ml-4 lg:ml-6">{t('registryControls')}</div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-4 lg:space-x-5 px-4 lg:px-6 py-3 lg:py-4.5 rounded-[1.5rem] lg:rounded-[1.75rem] transition-all duration-500 group relative
                ${isActive 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {/* Fixed: Replaced invalid lg:size prop with responsive className */}
              <Icon className={`w-5 h-5 lg:w-[22px] lg:h-[22px] ${isActive ? 'text-[#d4af37]' : 'group-hover:text-white'} transition-colors`} />
              <span className={`text-[11px] lg:text-[12px] font-black uppercase tracking-widest truncate ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{item.label}</span>
              {isActive && (
                <div className="absolute right-4 lg:right-6 w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-[#d4af37] shadow-[0_0_15px_#d4af37]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-8 lg:p-10 space-y-5">
        <div className="h-[1px] bg-white/10 w-full mb-4 lg:mb-6" />
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-4 lg:space-x-5 px-4 lg:px-6 py-3 lg:py-4.5 rounded-[1.25rem] lg:rounded-[1.5rem] text-slate-500 hover:bg-red-600/15 hover:text-red-400 transition-all group"
        >
          {/* Fixed: Replaced invalid lg:size prop with responsive className */}
          <LogOut className={`w-[18px] h-[18px] lg:w-5 lg:h-5 group-hover:-translate-x-1 transition-transform`} />
          <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">{t('signOut')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

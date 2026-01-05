
import React from 'react';
import { 
  LayoutDashboard, MapPin, ChefHat, Database, Wallet, 
  Users, Settings, ImageIcon, LogOut, CreditCard, 
  Handshake, Truck, Globe 
} from 'lucide-react';
import { translations, Language, getTranslation } from '../translations';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  lang: Language;
  onToggleLang: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, currentUser, onLogout, lang, onToggleLang, isOpen }) => {
  const t = (key: string) => getTranslation(lang, key);

  const menu = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'rooms', icon: MapPin },
    { id: 'orders', icon: ChefHat },
    { id: 'supply_chain', icon: Truck }, 
    { id: 'financial_hub', icon: Wallet },
    { id: 'images', icon: ImageIcon },   
    { id: 'database', icon: Database },
    { id: 'users', icon: Users },
    { id: 'settings', icon: Settings }
  ];

  return (
    <aside className={`w-72 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
      <div className="p-10 pt-12">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-950 text-blue-500 rounded-2xl flex items-center justify-center font-black italic border-b-2 border-blue-600 shadow-xl">JX</div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">江西云厨</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto no-scrollbar py-4">
        {menu.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          const hasPerm = currentUser.role === UserRole.ADMIN || currentUser.modulePermissions?.[item.id]?.enabled;
          const finalPerm = hasPerm || 
            (item.id === 'financial_hub' && (currentUser.modulePermissions?.['finance']?.enabled || currentUser.modulePermissions?.['partners']?.enabled || currentUser.modulePermissions?.['payments']?.enabled)) ||
            (item.id === 'supply_chain' && (currentUser.modulePermissions?.['menu']?.enabled || currentUser.modulePermissions?.['inventory']?.enabled));
          
          if (!finalPerm) return null;

          return (
            <button 
              key={item.id} 
              onClick={() => setCurrentTab(item.id)} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.75rem] font-black text-[11px] uppercase tracking-widest transition-all relative group
                ${isActive 
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'}`}
            >
              <Icon size={18} className={isActive ? 'text-blue-500' : 'group-hover:scale-110 transition-transform'} />
              <span>{t(item.id)}</span>
              {isActive && <div className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-50 space-y-2">
        {/* 全局翻译切换按钮 */}
        <button 
          onClick={onToggleLang}
          className="w-full flex items-center gap-4 px-6 py-3.5 rounded-[1.25rem] text-blue-600 bg-blue-50 font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 group"
        >
          <Globe size={16} className="group-hover:rotate-12 transition-transform" />
          <span>{lang === 'zh' ? 'Switch to English' : '切换至中文界面'}</span>
        </button>

        <button 
          onClick={onLogout} 
          className="w-full flex items-center gap-4 px-6 py-3.5 rounded-[1.25rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 group"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

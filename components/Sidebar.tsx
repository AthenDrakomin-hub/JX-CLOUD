
import React from 'react';
import { 
  LayoutDashboard, MapPin, ChefHat, Database, Wallet, 
  Users, Settings, ImageIcon, LogOut, CreditCard, 
  Handshake, Truck, Globe, Menu, X 
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
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, currentUser, onLogout, lang, onToggleLang, isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const t = (key: string) => getTranslation(lang, key);

  const menu = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'rooms', icon: MapPin },
    { id: 'orders', icon: ChefHat },
    { id: 'supply_chain', icon: Truck }, 
    { id: 'financial_hub', icon: Wallet },
    { id: 'images', icon: ImageIcon },   

    { id: 'users', icon: Users },
    { id: 'settings', icon: Settings }
  ];

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto lg:h-auto lg:shadow-none`}>
        <div className="p-10 pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-950 text-blue-500 rounded-2xl flex items-center justify-center font-black italic border-b-2 border-blue-600 shadow-xl">JX</div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">江西云厨</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Hub</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Collapse/Expand button for desktop */}
              <button
                className="hidden lg:flex p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <Menu size={16} /> : <X size={16} />}
              </button>
              
              {/* Close button for mobile */}
              <button 
                className="lg:hidden p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                onClick={toggleSidebar}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
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
                onClick={() => {
                  setCurrentTab(item.id);
                  // Close sidebar on mobile after selecting an option
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.75rem] font-black text-[11px] uppercase tracking-widest transition-all relative group
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'}`}
              >
                <Icon size={18} className={isActive ? 'text-blue-500' : 'group-hover:scale-110 transition-transform'} />
                {!isCollapsed && <span>{t(item.id)}</span>}
                {isActive && !isCollapsed && <div className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
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
            {!isCollapsed && <span>{lang === 'zh' ? 'Switch to English' : '切换至中文界面'}</span>}
          </button>

          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-4 px-6 py-3.5 rounded-[1.25rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span>{t('signOut')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
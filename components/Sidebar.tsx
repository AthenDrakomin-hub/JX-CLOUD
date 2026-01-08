
import React from 'react';
import { 
  LayoutDashboard, MapPin, ChefHat, Database, Wallet, 
  Users, Settings, ImageIcon, LogOut, CreditCard, 
  Handshake, Truck, Globe, X, ChevronLeft, ChevronRight
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
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, setCurrentTab, currentUser, onLogout, lang, onToggleLang, isOpen, onClose, 
  isCollapsed, onToggleCollapse 
}) => {
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
    <>
      {/* 移动端遮罩层 */}
      <div className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-[110] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <div className={`p-8 pt-10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-950 text-blue-500 rounded-2xl flex items-center justify-center font-black italic border-b-2 border-blue-600 shadow-xl shrink-0">JX</div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-lg font-black text-slate-900 tracking-tighter leading-none">江西云厨</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Terminal Hub</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 active-scale">
            <X size={20} />
          </button>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={onToggleCollapse} 
            className="hidden lg:flex absolute -right-4 top-12 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all active-scale z-50"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar py-2 mt-4">
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
                onClick={() => { setCurrentTab(item.id); if(onClose) onClose(); }} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative group active-scale
                  ${isCollapsed ? 'justify-center px-0' : ''}
                  ${isActive 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'}`}
                title={isCollapsed ? t(item.id) : ''}
              >
                <Icon size={18} className={isActive ? 'text-blue-500' : 'group-hover:scale-110 transition-transform'} />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{t(item.id)}</span>}
                {isActive && !isCollapsed && <div className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                {isActive && isCollapsed && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-slate-50 space-y-2 pb-safe ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <button 
            onClick={onToggleLang}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-blue-600 bg-blue-50 font-black text-[9px] uppercase tracking-widest active-scale ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={lang === 'zh' ? 'Switch to English' : '切换中文'}
          >
            <Globe size={14} />
            {!isCollapsed && <span>{lang === 'zh' ? 'EN Mode' : '中文模式'}</span>}
          </button>

          <button 
            onClick={onLogout} 
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-red-500 active-scale ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={t('signOut')}
          >
            <LogOut size={14} />
            {!isCollapsed && <span>{t('signOut')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

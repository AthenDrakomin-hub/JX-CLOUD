
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Command, MapPin, ChefHat, 
  Utensils, Zap, X, ArrowRight, Sun, 
  Moon, LogOut, Printer, LayoutDashboard
} from 'lucide-react';
import { HotelRoom, Order, Dish } from '../types';
import { useTranslation } from 'react-i18next';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: HotelRoom[];
  orders: Order[];
  dishes: Dish[];
  lang?: Language;  // Made optional since we're using i18next
  onNavigate: (tab: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ 
  isOpen, onClose, rooms, orders, dishes, onNavigate, onToggleTheme, onLogout 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    
    const items: any[] = [];

    // 1. 房间搜索
    rooms.filter(r => r.id.toLowerCase().includes(q)).forEach(r => {
      items.push({ type: 'room', id: r.id, title: `房间 ${r.id}`, sub: '跳转至房态控制', icon: MapPin, tab: 'rooms' });
    });

    // 2. 菜品搜索 - Fix: Use 'name_en' property correctly from Dish interface
    dishes.filter(d => d.name.toLowerCase().includes(q) || d.name_en?.toLowerCase().includes(q)).slice(0, 5).forEach(d => {
      items.push({ type: 'dish', id: d.id, title: d.name, sub: `单价: ₱${d.price} | 库存: ${d.stock}`, icon: Utensils, tab: 'supply_chain' });
    });

    // 3. 订单搜索
    orders.filter(o => o.id.toLowerCase().includes(q) || o.roomId.includes(q)).slice(0, 3).forEach(o => {
      items.push({ type: 'order', id: o.id, title: `订单 #${o.id.slice(-6)}`, sub: `房间 ${o.roomId} | ₱${o.totalAmount}`, icon: ChefHat, tab: 'orders' });
    });

    // 4. 系统指令
    if ("主板仪表盘".includes(q) || "dashboard".includes(q)) items.push({ type: 'sys', id: 'dash', title: '进入经营大盘', sub: '系统核心指标', icon: LayoutDashboard, tab: 'dashboard' });
    if ("切换主题".includes(q) || "theme".includes(q)) items.push({ type: 'sys', id: 'theme', title: '切换视觉主题', sub: '明亮/深邃模式切换', icon: Sun, action: onToggleTheme });
    if ("安全退出".includes(q) || "logout".includes(q)) items.push({ type: 'sys', id: 'logout', title: '安全退出系统', sub: '清除本地授权记录', icon: LogOut, action: onLogout });

    return items;
  }, [query, rooms, dishes, orders, onToggleTheme, onLogout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
        e.preventDefault();
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        const item = results[selectedIndex];
        if (item.action) item.action();
        else if (item.tab) onNavigate(item.tab);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-6 pt-[15vh]">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-8 py-6 border-b border-slate-100">
          <Search className="text-slate-400 mr-4" size={24} />
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300"
            placeholder="搜索房间、订单、物料或系统指令..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
            ESC
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4 no-scrollbar">
          {query === '' ? (
            <div className="p-8 text-center space-y-4">
               <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Zap size={28} />
               </div>
               <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight">全局指令中心</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">输入关键字或快捷指令开始高效管理</p>
               </div>
               <div className="grid grid-cols-2 gap-3 pt-6 max-w-sm mx-auto">
                  <div className="p-3 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-400 border border-slate-100 uppercase">搜索 "8201" 跳转房间</div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-400 border border-slate-100 uppercase">搜索 "库存" 查物料</div>
               </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-slate-300">
               <p className="text-sm font-bold uppercase tracking-widest">未找到匹配项</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div 
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                       if (item.action) item.action();
                       else if (item.tab) onNavigate(item.tab);
                       onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-5 rounded-2xl transition-all cursor-pointer border-2 ${isSelected ? 'bg-slate-900 border-slate-900 shadow-xl' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center space-x-5">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isSelected ? 'bg-white/10 text-blue-400' : 'bg-slate-100 text-slate-400'}`}>
                          <Icon size={20} />
                       </div>
                       <div>
                          <h5 className={`font-bold text-sm leading-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>{item.title}</h5>
                          <p className={`text-[10px] font-medium mt-1 uppercase tracking-widest ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{item.sub}</p>
                       </div>
                    </div>
                    {isSelected && <ArrowRight size={18} className="text-blue-500 animate-in slide-in-from-left-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2"><div className="px-1.5 py-1 bg-white border border-slate-200 rounded text-[9px] font-black">↑↓</div><span className="text-[9px] font-black text-slate-400 uppercase">选择 / Select</span></div>
              <div className="flex items-center space-x-2"><div className="px-1.5 py-1 bg-white border border-slate-200 rounded text-[9px] font-black">ENTER</div><span className="text-[9px] font-black text-slate-400 uppercase">执行 / Execute</span></div>
           </div>
           <div className="flex items-center space-x-2">
              <Command size={12} className="text-slate-300" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">JX SpotLight Engine v1.0</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
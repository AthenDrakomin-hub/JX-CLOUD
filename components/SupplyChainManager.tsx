
import React, { useState } from 'react';
import MenuManagement from './MenuManagement';
import CategoryManagement from './CategoryManagement';
import InventoryManagement from './InventoryManagement';
// Fix: Language type is exported from translations.ts, not types.ts
import { Dish, User } from '../types';
import { translations, Language } from '../translations';
import { Box, Layers, Package, Sparkles } from 'lucide-react';

interface SupplyChainManagerProps {
  dishes: Dish[];
  currentUser: User | null;
  onAddDish: (dish: Dish) => Promise<void>;
  onUpdateDish: (dish: Dish) => Promise<void>;
  onDeleteDish: (id: string) => Promise<void>;
  lang: Language;
}

const SupplyChainManager: React.FC<SupplyChainManagerProps> = ({
  dishes, currentUser, onAddDish, onUpdateDish, onDeleteDish, lang
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'inventory'>('menu');
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || key;

  const tabs = [
    { id: 'menu', icon: Box, label: '菜品档案' },
    { id: 'categories', icon: Layers, label: '分类架构' },
    { id: 'inventory', icon: Package, label: '物料库存' }
  ] as const;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 顶部综合控制台 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="relative z-10 flex items-center space-x-6">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-white">
              <Sparkles size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">供应链资产管理</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">JX-Kitchen Master Resources Control</p>
           </div>
        </div>

        {/* 核心分栏导航 */}
        <div className="relative z-10 flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
           {tabs.map((tab) => {
             const Icon = tab.icon;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all
                   ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Icon size={16} className={activeTab === tab.id ? 'text-blue-600' : ''} />
                 <span>{tab.label}</span>
               </button>
             );
           })}
        </div>
      </div>

      {/* 模块内容渲染 */}
      <div className="transition-all duration-500">
        {activeTab === 'menu' && (
          <MenuManagement 
            dishes={dishes} 
            currentUser={currentUser} 
            onAddDish={onAddDish} 
            onUpdateDish={onUpdateDish} 
            onDeleteDish={onDeleteDish} 
            lang={lang} 
          />
        )}
        {activeTab === 'categories' && <CategoryManagement lang={lang} />}
        {activeTab === 'inventory' && <InventoryManagement lang={lang} />}
      </div>
    </div>
  );
};

export default SupplyChainManager;

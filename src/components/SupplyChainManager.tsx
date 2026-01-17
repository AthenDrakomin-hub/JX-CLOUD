
import React, { useState, useRef, useCallback } from 'react';
import MenuManagement from './MenuManagement';
import CategoryManagement from './CategoryManagement';
import InventoryManagement from './InventoryManagement';
import GuestOrder from './GuestOrder';
import { Dish, User, Partner, Order, Category } from '../types';
import { Language, getTranslation } from '../translations';
import { Box, Layers, Package, Sparkles, MonitorSmartphone, X, Smartphone, ShieldCheck, Download, Upload, AlertCircle, HardDrive } from 'lucide-react';
import { api } from '../services/api-client';

interface SupplyChainManagerProps {
  dishes: Dish[];
  categories: Category[];
  currentUser: User | null;
  partners: Partner[];
  onAddDish: (dish: Dish) => Promise<void>;
  onUpdateDish: (dish: Dish) => Promise<void>;
  onDeleteDish: (id: string) => Promise<void>;
  lang: Language;
  onRefreshData?: () => void;
}

const SupplyChainManager: React.FC<SupplyChainManagerProps> = ({
  dishes, categories, currentUser, partners, onAddDish, onUpdateDish, onDeleteDish, lang, onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'inventory' | 'backup'>('menu');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simLang, setSimLang] = useState<Language>(lang); // 模拟器专用独立语言状态
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  const tabs = [
    { id: 'menu', icon: Box, label: 'dish_archives' },
    { id: 'categories', icon: Layers, label: 'categories' },
    { id: 'inventory', icon: Package, label: 'inventory' },
    { id: 'backup', icon: 'backup', label: 'backup' }
  ] as const;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      await api.archive.importData(file);
      alert(lang === 'zh' ? "数据恢复成功！正在重新加载..." : "Recovery Successful! Reloading...");
      if (onRefreshData) onRefreshData();
      setActiveTab('menu');
    } catch (err) {
      alert(lang === 'zh' ? "导入失败：档案格式不正确。" : "Import Failed: Invalid format.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="relative z-10 flex items-center space-x-6">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-white">
              <Sparkles size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('supply_chain_mgmt')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">JX-Kitchen Master Resources Control</p>
           </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
           <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
              {tabs.map((tab) => {
                const Icon = tab.icon === 'backup' ? ShieldCheck : (tab.icon as any);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all
                      ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Icon size={16} className={activeTab === tab.id ? (tab.id === 'backup' ? 'text-amber-500' : 'text-blue-600') : ''} />
                    <span>{t(tab.label)}</span>
                  </button>
                );
              })}
           </div>
           <button onClick={() => { setSimLang(lang); setShowSimulator(true); }} className="px-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active-scale"><MonitorSmartphone size={18} /><span>{t('client_preview')}</span></button>
        </div>
      </div>

      <div className="transition-all duration-500">
        {activeTab === 'menu' && <MenuManagement dishes={dishes} currentUser={currentUser} partners={partners} onAddDish={onAddDish} onUpdateDish={onUpdateDish} onDeleteDish={id => onDeleteDish(id)} lang={lang} />}
        {activeTab === 'categories' && <CategoryManagement lang={lang} onRefreshGlobal={onRefreshData} />}
        {activeTab === 'inventory' && <InventoryManagement lang={lang} />}
        
        {activeTab === 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-up">
             <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-8">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner"><Download size={32} /></div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 uppercase">{lang === 'zh' ? '导出数据档案' : 'Export Data Archive'}</h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">
                     {lang === 'zh' ? `将当前录入的 ${dishes.length} 个商品档案及全部分类架构打包下载。` : `Download all ${dishes.length} assets and categories taxonomy.`}
                   </p>
                </div>
                <button onClick={() => api.archive.exportData()} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4">
                   <Download size={20} />
                   <span>{lang === 'zh' ? '生成并下载备份文件 (.json)' : 'Download Backup (.json)'}</span>
                </button>
             </div>

             <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-8">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center shadow-inner"><Upload size={32} /></div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 uppercase">{lang === 'zh' ? '从备份恢复' : 'Restore from Backup'}</h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">
                     {lang === 'zh' ? '上传之前导出的 .json 档案，立即还原。注意：这将覆盖本地数据。' : 'Upload .json file to restore. Warning: This overrides current local data.'}
                   </p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full py-6 border-4 border-dashed border-slate-100 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-4"
                >
                   {isImporting ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={20} />}
                   <span>{lang === 'zh' ? '点击上传备份文件并恢复' : 'Upload and Restore'}</span>
                </button>
             </div>

             <div className="md:col-span-2 bg-slate-950 p-10 rounded-[3rem] text-white flex items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400"><HardDrive size={28} /></div>
                <div className="flex-1">
                   <h4 className="text-lg font-black uppercase tracking-tight">{lang === 'zh' ? '持久化存储状态' : 'Persistence Status'}: <span className="text-emerald-400">{lang === 'zh' ? '已激活' : 'ACTIVE'}</span></h4>
                   <p className="text-xs text-slate-500 mt-1">{lang === 'zh' ? '当前数据存储于本地浏览器。即使代码更新，系统也会优先从此加载您的资产。' : 'Data stored in browser local storage. Priority loading enabled.'}</p>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-slate-400">
                   STORAGE_NODE: jx_dishes_v5
                </div>
             </div>
          </div>
        )}
      </div>

      {showSimulator && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 overflow-hidden">
           <div className="absolute top-10 right-10 flex flex-col items-center gap-2">
              <button onClick={() => setShowSimulator(false)} className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:bg-red-500 hover:text-white transition-all active-scale"><X size={32} /></button>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{lang === 'zh' ? '退出预览' : 'Exit'}</span>
           </div>
           <div className="relative w-full max-w-[420px] aspect-[9/19] bg-slate-900 rounded-[4rem] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-[100]" />
              <div className="flex-1 bg-white overflow-hidden relative">
                 <GuestOrder 
                   roomId="PREVIEW-01" 
                   dishes={dishes} 
                   categories={categories} 
                   lang={simLang} 
                   onToggleLang={() => setSimLang(p => p === 'zh' ? 'en' : 'zh')} // 修复翻译切换
                   onRescan={() => setShowSimulator(false)} 
                   onSubmitOrder={async (o) => { alert(simLang === 'zh' ? "模拟下单成功！" : "Simulated successfully!"); }} 
                 />
              </div>
              <div className="h-6 bg-white flex items-center justify-center shrink-0"><div className="w-32 h-1 bg-slate-200 rounded-full" /></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChainManager;
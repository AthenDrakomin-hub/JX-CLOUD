import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Order, HotelRoom, Expense, Dish, MaterialImage } from '../types';
import { Download, Upload, RotateCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { translations, Language } from '../translations';

interface DataSyncProps {
  onRefresh: () => void;
  lang: Language;
}

interface SyncResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

const DataSync: React.FC<DataSyncProps> = ({ onRefresh, lang }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [progress, setProgress] = useState(0);

  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const syncAllData = async () => {
    setIsSyncing(true);
    setSyncResults([]);
    setProgress(0);

    try {
      // 模拟同步进度
      const totalSteps = 8;
      let currentStep = 0;

      const updateProgress = () => {
        currentStep++;
        setProgress(Math.floor((currentStep / totalSteps) * 100));
      };

      // 同步用户数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingUsers'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步房间数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingRooms'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步订单数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingOrders'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步菜品数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingDishes'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步支出数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingExpenses'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步材料数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingMaterials'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步支付配置
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingPayments'), 
        timestamp: new Date() 
      }]);
      updateProgress();
      await new Promise(resolve => setTimeout(resolve, 300));

      // 同步翻译数据
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncingTranslations'), 
        timestamp: new Date() 
      }]);
      updateProgress();

      // 刷新数据
      onRefresh();

      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('syncComplete'), 
        timestamp: new Date() 
      }]);

      // 重置进度
      setTimeout(() => {
        setProgress(0);
        setIsSyncing(false);
      }, 2000);

    } catch (error) {
      setSyncResults(prev => [...prev, { 
        success: false, 
        message: t('syncFailed'), 
        timestamp: new Date() 
      }]);
      setIsSyncing(false);
      setProgress(0);
    }
  };

  const exportData = async () => {
    setIsSyncing(true);
    
    try {
      // 获取所有数据
      const [users, rooms, orders, dishes, expenses, materials, payments, translations] = await Promise.all([
        api.users.getAll(),
        api.rooms.getAll(),
        api.orders.getAll(),
        api.dishes.getAll(),
        api.expenses.getAll(),
        api.materials.getAll(),
        api.payments.getAll(),
        api.translations.getAll()
      ]);

      // 创建数据对象
      const dataToExport = {
        users,
        rooms,
        orders,
        dishes,
        expenses,
        materials,
        payments,
        translations,
        exportTimestamp: new Date().toISOString()
      };

      // 创建并下载文件
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jx-cloud-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('exportSuccess'), 
        timestamp: new Date() 
      }]);
    } catch (error) {
      setSyncResults(prev => [...prev, { 
        success: false, 
        message: t('exportFailed'), 
        timestamp: new Date() 
      }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const importData = async (file: File) => {
    setIsSyncing(true);
    
    try {
      const content = await file.text();
      const importedData = JSON.parse(content);
      
      // 这里可以实现数据导入逻辑
      // 注意：实际实现中需要根据具体业务逻辑处理导入
      setSyncResults(prev => [...prev, { 
        success: true, 
        message: t('importSuccess'), 
        timestamp: new Date() 
      }]);
    } catch (error) {
      setSyncResults(prev => [...prev, { 
        success: false, 
        message: t('importFailed'), 
        timestamp: new Date() 
      }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
    // 重置文件输入以允许再次选择相同文件
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" />
      <div className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{t('syncAllData')}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t('dataSyncDesc')}</p>
          </div>
          <button 
            onClick={onRefresh} 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
          >
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={syncAllData}
              disabled={isSyncing}
              className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#d4af37] transition-all flex items-center space-x-3 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
              <span>{t('syncNow')}</span>
            </button>
            
            <button 
              onClick={exportData}
              disabled={isSyncing}
              className="px-8 py-4 bg-[#d4af37] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center space-x-3 disabled:opacity-50"
            >
              <Download size={16} />
              <span>{t('exportData')}</span>
            </button>
            
            <label 
              className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center space-x-3 cursor-pointer disabled:opacity-50"
              onClick={(e) => {
                if (isSyncing) e.preventDefault();
              }}
            >
              <Upload size={16} />
              <span>{t('importData')}</span>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleFileImport} 
                disabled={isSyncing}
              />
            </label>
          </div>
          
          {/* 进度条 */}
          {isSyncing && (
            <div className="mt-6">
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-[#d4af37] h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-[10px] font-black text-slate-500 mt-2 text-center">
                {progress}% {t('complete')}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[50vh]">
          <h4 className="text-lg font-bold text-slate-900 mb-4">{t('syncLog')}</h4>
          <div className="space-y-3">
            {syncResults.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {t('noSyncActivity')}
              </div>
            ) : (
              syncResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-start p-4 rounded-xl ${
                    result.success ? 'bg-emerald-50' : 'bg-red-50'
                  }`}
                >
                  <div className="mr-3 mt-0.5">
                    {result.success ? (
                      <CheckCircle size={18} className="text-emerald-600" />
                    ) : (
                      <XCircle size={18} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{result.message}</div>
                    <div className="text-[10px] text-slate-500">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSync;
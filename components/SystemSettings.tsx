import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Printer, Save, Sun, Moon, Type, 
  Activity, Trash2, ShieldCheck, Monitor, 
  Palette, Maximize2, CaseSensitive, Layout,
  Eye, CheckCircle2, AlertCircle, Sparkles, Volume2, 
  VolumeX, Sliders, Smartphone, Info, Receipt, 
  Torus, Percent, MousePointer2
} from 'lucide-react';
import { translations, Language, getTranslation } from '../translations';
import { api } from '../services/api';
import { SystemConfig } from '../types';
import ValidationPanel from './ValidationPanel';

interface SystemSettingsProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onUpdateConfig: (config: SystemConfig) => Promise<void>;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ lang, onChangeLang, onUpdateConfig }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'display' | 'infrastructure' | 'validation'>('display');

  const t = (key: string): string => getTranslation(lang, key);

  useEffect(() => {
    api.config.get().then(setConfig);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    await onUpdateConfig(config);
    setIsSaving(false);
    // 配置更新后发送广播，以便其他组件（如 App.tsx）实时更新 DOM
    window.dispatchEvent(new CustomEvent('jx_config_updated', { detail: config }));
  };

  if (!config) return null;

  return (
    <div className="space-y-10 animate-fade-up">
      {/* 顶部控制台头 */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <div className="flex items-center space-x-6 relative z-10">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white"><Settings size={32} /></div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{t('settings')}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Global System Orchestrator</p>
           </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 relative z-10">
          <button onClick={() => setActiveTab('display')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'display' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            视觉与交互
          </button>
          <button onClick={() => setActiveTab('infrastructure')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'infrastructure' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            基础设施
          </button>
          <button onClick={() => setActiveTab('validation')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'validation' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            生产验证
          </button>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-3 shadow-xl active:scale-95 relative z-10">
          {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{t('save')}</span>
        </button>
      </div>

      {activeTab === 'display' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-7 space-y-8">
            
            {/* 主题选择模块 */}
            <section className="bg-white p-10 lg:p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-slate-900">
                  <Palette size={28} className="text-blue-600" />
                  <h3 className="text-xl font-black uppercase tracking-widest">全局外观风格</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setConfig({...config, theme: 'light'})}
                  className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${config.theme === 'light' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
                >
                  <Sun size={32} className={config.theme === 'light' ? 'text-blue-600' : 'text-slate-400'} />
                  <span className="font-black text-xs uppercase tracking-widest">明亮模式 (Light)</span>
                </button>
                <button 
                  onClick={() => setConfig({...config, theme: 'dark'})}
                  className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${config.theme === 'dark' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
                >
                  <Moon size={32} className={config.theme === 'dark' ? 'text-white' : 'text-slate-400'} />
                  <span className="font-black text-xs uppercase tracking-widest">深邃模式 (Dark)</span>
                </button>
              </div>

              {/* 辅助功能：高对比度 */}
              <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-900 border border-slate-200">
                    <Maximize2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">高对比度 UI (Accessibility)</h4>
                    <p className="text-[10px] text-slate-400 font-medium">开启后加深边框与文字对比度，适合视障或强光操作</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.contrastStrict} onChange={(e) => setConfig({...config, contrastStrict: e.target.checked})} className="sr-only peer" />
                  <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </section>

            {/* 排版布局模块 */}
            <section className="bg-white p-10 lg:p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center space-x-4 text-blue-600">
                <Type size={28} />
                <h3 className="text-xl font-black uppercase tracking-widest">字体与缩放</h3>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">字体族选择</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {['Plus Jakarta Sans', 'Noto Sans SC', 'Inter'].map(f => (
                      <button key={f} onClick={() => setConfig({...config, fontFamily: f})} className={`py-4 rounded-2xl border-2 font-bold text-[10px] transition-all ${config.fontFamily === f ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                        {f === 'Plus Jakarta Sans' ? 'Jakarta (推荐)' : f === 'Noto Sans SC' ? '思源黑体' : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">全局缩放比例</label>
                    <span className="text-sm font-black text-blue-600">{config.fontSizeBase}px</span>
                  </div>
                  <input 
                    type="range" min="14" max="22" step="2" 
                    value={config.fontSizeBase} 
                    onChange={(e) => setConfig({...config, fontSizeBase: parseInt(e.target.value)})}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest px-1">
                    <span>Standard</span>
                    <span>Comfortable</span>
                    <span>Accessible</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 语音播报 */}
            <section className="bg-slate-900 p-10 lg:p-12 rounded-[4rem] text-white space-y-8 relative overflow-hidden">
               <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400"><Volume2 size={28} /></div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-widest">智能播报</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Order Voice Feedback</p>
                     </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.voiceBroadcastEnabled} onChange={(e) => setConfig({...config, voiceBroadcastEnabled: e.target.checked})} className="sr-only peer" />
                    <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
               </div>
               
               {config.voiceBroadcastEnabled && (
                 <div className="space-y-6 animate-in slide-in-from-top-4 relative z-10">
                    <div className="space-y-4">
                       <div className="flex justify-between px-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">音量</label>
                          <span className="text-xs font-black text-blue-400">{Math.round(config.voiceVolume * 100)}%</span>
                       </div>
                       <input 
                         type="range" min="0" max="1" step="0.1" 
                         value={config.voiceVolume} 
                         onChange={(e) => setConfig({...config, voiceVolume: parseFloat(e.target.value)})}
                         className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                       />
                    </div>
                 </div>
               )}
            </section>
          </div>

          <div className="xl:col-span-5">
             <div className="sticky top-32 space-y-8">
                <div className="bg-white p-10 rounded-[4rem] border-4 border-slate-100 shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={16} /> Live Preview</h4>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   </div>

                   <div className="p-10 rounded-[3rem] border border-slate-100 shadow-inner" 
                        style={{ 
                          fontFamily: config.fontFamily, 
                          fontSize: `${config.fontSizeBase}px`,
                          backgroundColor: config.theme === 'dark' ? '#0f172a' : '#ffffff',
                          color: config.theme === 'dark' ? '#f1f5f9' : '#0f172a',
                          borderColor: config.contrastStrict ? (config.theme === 'dark' ? '#ffffff' : '#000000') : '#f1f5f9'
                        }}>
                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg">JX</div>
                          <div>
                            <h2 className="text-2xl font-black tracking-tight leading-none">江西云厨预览</h2>
                            <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">Bento Interface Protocol</p>
                          </div>
                        </div>
                        <div className={`p-6 rounded-2xl border ${config.contrastStrict ? 'border-2' : ''}`} style={{ borderColor: config.contrastStrict ? 'currentColor' : 'rgba(0,0,0,0.05)' }}>
                          <p className="text-sm font-bold">{t('configSynced')}</p>
                        </div>
                        <div className="flex gap-2">
                           <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Sample Action</div>
                           <div className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase border border-slate-200">Outline</div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="text-center">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">JX-Cloud Realtime Rendering Engine</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-20">
          {/* 打印机高级配置 */}
          <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center space-x-4 text-amber-600">
              <Printer size={28} />
              <h3 className="text-xl font-black uppercase tracking-widest">硬件中继与打印</h3>
            </div>
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">打印机固定 IP</label>
                  <input value={config.printerIp} onChange={e => setConfig({...config, printerIp: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-900 font-bold focus:border-blue-600 outline-none transition-all shadow-inner" placeholder="192.168.1.100" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">通信端口 (Port)</label>
                  <input value={config.printerPort} onChange={e => setConfig({...config, printerPort: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-900 font-bold focus:border-blue-600 outline-none transition-all shadow-inner" placeholder="9100" />
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       {/* Fix: Capitalized 'Receipt' component from lucide-react */}
                       <Receipt size={20} className="text-slate-400" />
                       <span className="text-xs font-bold">新订单自动打印制作单</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={config.autoPrintOrder} onChange={(e) => setConfig({...config, autoPrintOrder: e.target.checked})} className="sr-only peer" />
                      <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                 </div>
                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <CheckCircle2 size={20} className="text-slate-400" />
                       <span className="text-xs font-bold">结账后自动打印小票</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={config.autoPrintReceipt} onChange={(e) => setConfig({...config, autoPrintReceipt: e.target.checked})} className="sr-only peer" />
                      <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                 </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
             <div className="flex items-center space-x-4 text-emerald-600">
                <Torus size={28} />
                <h3 className="text-xl font-black uppercase tracking-widest">核心业务参数</h3>
             </div>
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">酒店/餐厅品牌名称</label>
                   <input value={config.hotelName} onChange={e => setConfig({...config, hotelName: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all shadow-inner" />
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between px-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">默认增值服务费率</label>
                     <span className="text-xs font-black text-emerald-600">{Math.round(config.serviceChargeRate * 100)}%</span>
                   </div>
                   <input 
                     type="range" min="0" max="0.3" step="0.01" 
                     value={config.serviceChargeRate} 
                     onChange={(e) => setConfig({...config, serviceChargeRate: parseFloat(e.target.value)})}
                     className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                   />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">系统主语言切换 (Language)</label>
                  <div className="flex gap-4">
                    <button onClick={() => onChangeLang('zh')} className={`flex-1 py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${lang === 'zh' ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>简体中文</button>
                    <button onClick={() => onChangeLang('en')} className={`flex-1 py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${lang === 'en' ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>English</button>
                  </div>
                </div>
             </div>
          </section>
        </div>
      )}
      {activeTab === 'validation' && (
        <div className="pb-20">
          <ValidationPanel lang={lang} />
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
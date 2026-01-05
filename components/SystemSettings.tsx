
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, Printer, Save, Sun, Moon, Type, 
  Activity, Trash2, ShieldCheck, Monitor, 
  Palette, Maximize2, CaseSensitive, Layout,
  Eye, CheckCircle2, AlertCircle, Sparkles, Volume2, VolumeX
} from 'lucide-react';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { SystemConfig } from '../types';

interface SystemSettingsProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onUpdateConfig: (config: SystemConfig) => Promise<void>;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ lang, onChangeLang, onUpdateConfig }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'display' | 'infrastructure'>('display');

  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    api.config.get().then(setConfig);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    await onUpdateConfig(config);
    setIsSaving(false);
    alert(lang === 'zh' ? '配置已保存' : 'Settings saved');
  };

  if (!config) return null;

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <div className="flex items-center space-x-6 relative z-10">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white"><Settings size={32} /></div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{t('settings')}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Station Orchestrator</p>
           </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 relative z-10">
          <button onClick={() => setActiveTab('display')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'display' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>显示与播报</button>
          <button onClick={() => setActiveTab('infrastructure')} className={`px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'infrastructure' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>基础设施</button>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-3 shadow-xl active:scale-95 relative z-10">
          {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{t('save')}</span>
        </button>
      </div>

      {activeTab === 'display' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-7 space-y-8">
            {/* 自动化语音播报模块 */}
            <section className="bg-slate-950 p-10 lg:p-12 rounded-[4rem] text-white space-y-10 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full" />
               <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400"><Volume2 size={28} /></div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-widest">订单语音提醒</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Native Web Speech Engine</p>
                     </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.voiceBroadcastEnabled} onChange={(e) => setConfig({...config, voiceBroadcastEnabled: e.target.checked})} className="sr-only peer" />
                    <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                  </label>
               </div>
               
               {config.voiceBroadcastEnabled && (
                 <div className="space-y-6 animate-in slide-in-from-top-4">
                    <div className="space-y-4">
                       <div className="flex justify-between px-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">播报音量调节</label>
                          <span className="text-xs font-black text-blue-400">{Math.round(config.voiceVolume * 100)}%</span>
                       </div>
                       <input 
                         type="range" min="0" max="1" step="0.1" 
                         value={config.voiceVolume} 
                         onChange={(e) => setConfig({...config, voiceVolume: parseFloat(e.target.value)})}
                         className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                       />
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                       <CheckCircle2 size={16} className="text-emerald-500" />
                       <p className="text-[11px] text-slate-400 leading-relaxed font-medium">当新订单到达时，系统将通过本地语音引擎自动朗读房间号。此功能在内网环境下完全可用。</p>
                    </div>
                 </div>
               )}
            </section>

            <section className="bg-white p-10 lg:p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center space-x-4 text-blue-600">
                <Palette size={28} />
                <h3 className="text-xl font-black uppercase tracking-widest">排版布局偏好</h3>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">字体族选择</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Noto Sans SC', 'Inter', 'Microsoft YaHei'].map(f => (
                      <button key={f} onClick={() => setConfig({...config, fontFamily: f})} className={`py-4 rounded-2xl border-2 font-bold text-xs transition-all ${config.fontFamily === f ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                        {f === 'Noto Sans SC' ? '思源黑体' : f === 'Microsoft YaHei' ? '微软雅黑' : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">全局字号</label>
                    <span className="text-sm font-black text-blue-600">{config.fontSizeBase}px</span>
                  </div>
                  <input 
                    type="range" min="12" max="24" step="1" 
                    value={config.fontSizeBase} 
                    onChange={(e) => setConfig({...config, fontSizeBase: parseInt(e.target.value)})}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="xl:col-span-5">
             <div className="sticky top-32 space-y-8">
                <div className="bg-white p-10 rounded-[4rem] border-4 border-slate-100 shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
                   <div className="flex items-center justify-between px-2">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={16} /> 预览</h4>
                      <Sparkles size={16} className="text-blue-500 animate-pulse" />
                   </div>

                   <div className="p-8 rounded-[2.5rem] space-y-6" 
                        style={{ 
                          fontFamily: config.fontFamily, 
                          fontSize: `${config.fontSizeBase}px`,
                          fontWeight: config.fontWeightBase,
                          lineHeight: config.lineHeightBase,
                          color: config.theme === 'custom' ? config.textColorMain : 'inherit'
                        }}>
                      <h2 className="text-2xl font-black">预览文本展示</h2>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-sm font-bold">确保文字大小在各类屏幕上清晰可见。</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center space-x-4 text-amber-600">
              <Printer size={28} />
              <h3 className="text-xl font-black uppercase tracking-widest">{t('printerConfig')}</h3>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('printerIp')}</label>
                  <input value={config.printerIp} onChange={e => setConfig({...config, printerIp: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-900 font-bold focus:border-blue-600 outline-none transition-all" placeholder="192.168.1.100" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('printerPort')}</label>
                  <input value={config.printerPort} onChange={e => setConfig({...config, printerPort: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-900 font-bold focus:border-blue-600 outline-none transition-all" placeholder="9100" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
             <div className="flex items-center space-x-4 text-emerald-600">
                <ShieldCheck size={28} />
                <h3 className="text-xl font-black uppercase tracking-widest">安全架构</h3>
             </div>
             <div className="space-y-8">
                <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">系统主语言</label>
                  <div className="flex gap-4">
                    <button onClick={() => onChangeLang('zh')} className={`flex-1 py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${lang === 'zh' ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>简体中文</button>
                    <button onClick={() => onChangeLang('en')} className={`flex-1 py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${lang === 'en' ? 'bg-slate-950 border-slate-950 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>English</button>
                  </div>
                </div>
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;

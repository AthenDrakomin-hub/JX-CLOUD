
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Settings, RotateCcw, Scale, Shield, 
  ChevronDown, ChevronUp, ShieldAlert, Zap, Globe, ShieldCheck,
  Database, Save, Copyright, Gavel, Eye
} from 'lucide-react';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import ConfirmationModal from './ConfirmationModal';

interface SystemSettingsProps {
  lang: Language;
}

const LegalSection: React.FC<{ title: string; children: React.ReactNode; icon: any }> = ({ title, children, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-7 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-5">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 shadow-inner border border-slate-200">
            <Icon size={20} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      {isOpen && (
        <div className="px-10 pb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="prose prose-slate max-w-none text-sm text-slate-600 font-medium leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const SystemSettings: React.FC<SystemSettingsProps> = ({ lang }) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [config, setConfig] = useState<any>({ hotelName: 'JX CLOUD 江西云厨', version: '3.1.0-STABLE' });
  const [isSaving, setIsSaving] = useState(false);
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    api.config.get().then(setConfig);
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await api.config.update(config);
    setIsSaving(false);
  };

  const handleResetSystem = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-16 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('systemConfig')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('settings')}</h2>
           <p className="text-sm text-slate-500 font-medium tracking-widest max-w-md leading-relaxed">
             {t('systemSettingsDesc')}
           </p>
        </div>
        <button 
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Zap size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{lang === 'zh' ? '保存更改' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* General Section */}
          <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
             <div className="p-12 border-b border-slate-100 bg-slate-50/30 flex items-center space-x-5">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                   <Settings size={22} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">{t('generalSettings')}</h3>
             </div>
             <div className="p-12 space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between group gap-8">
                   <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-900">{t('hotelName')}</h4>
                      <p className="text-sm text-slate-500 font-medium">{t('hotelNameDesc')}</p>
                   </div>
                   <input 
                      value={config.hotelName}
                      onChange={(e) => setConfig({ ...config, hotelName: e.target.value })}
                      className="flex-1 max-w-md px-8 py-5 bg-slate-50 rounded-2xl border border-slate-200 font-serif italic text-2xl text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all"
                   />
                </div>
                
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-900">{lang === 'zh' ? '系统架构版本' : 'Architecture Version'}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Enterprise Edition</p>
                   </div>
                   <div className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest shadow-xl">
                      {config.version || 'v3.1.0-STABLE'}
                   </div>
                </div>
             </div>
          </section>

          {/* Legal Compliance Section */}
          <section className="space-y-8">
             <div className="flex items-center space-x-4 px-10">
                <Scale size={24} className="text-[#d4af37]" />
                <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900">{t('legalCompliance')}</h3>
             </div>
             
             <div className="space-y-6">
                <LegalSection title={t('intellectualProperty')} icon={Copyright}>
                  <div className="space-y-6 text-sm">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <h5 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center">
                        <Gavel size={14} className="mr-2 text-[#d4af37]" />
                        {t('ipTitle1')}
                      </h5>
                      <p>{t('ipDesc1')}</p>
                    </div>
                    <div>
                      <h5 className="text-slate-900 font-black text-sm mb-3">{t('ipTitle2')}</h5>
                      <p className="indent-4 mb-3">{t('ipDesc2')}</p>
                      <h5 className="text-slate-900 font-black text-sm mb-3">{t('ipTitle3')}</h5>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>{t('ipItem3_1')}</li>
                        <li>{t('ipItem3_2')}</li>
                        <li>{t('ipItem3_3')}</li>
                      </ul>
                    </div>
                  </div>
                </LegalSection>

                <LegalSection title={t('disclaimerTitle')} icon={ShieldAlert}>
                  <div className="space-y-6 text-sm">
                    <div className="p-6 bg-red-50/30 rounded-3xl border border-red-100">
                      <h5 className="text-red-900 font-black text-xs uppercase tracking-widest mb-4">特别警示 / WARNING</h5>
                      <p className="text-red-700 font-bold">{t('disclaimerWarning')}</p>
                    </div>
                    <div className="space-y-4">
                      <h5 className="text-slate-900 font-black text-sm">{t('disclaimerTitle1')}</h5>
                      <p className="indent-4">{t('disclaimerDesc1')}</p>
                      <h5 className="text-slate-900 font-black text-sm">{t('disclaimerTitle2')}</h5>
                      <p className="indent-4">{t('disclaimerDesc2')}</p>
                    </div>
                  </div>
                </LegalSection>

                <LegalSection title={t('privacyPolicy')} icon={Shield}>
                  <div className="space-y-6 text-sm">
                    <div className="flex items-center space-x-4 mb-6">
                       <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                          <Eye size={18} />
                       </div>
                       <h5 className="text-slate-900 font-black text-sm uppercase tracking-widest">Privacy by Design</h5>
                    </div>
                    <div className="space-y-4">
                      <h5 className="text-slate-900 font-black text-sm">{t('privacyTitle1')}</h5>
                      <p className="indent-4">{t('privacyDesc1')}</p>
                      <h5 className="text-slate-900 font-black text-sm">{t('privacyTitle2')}</h5>
                      <p className="indent-4">{t('privacyDesc2')}</p>
                      <h5 className="text-slate-900 font-black text-sm">{t('privacyTitle3')}</h5>
                      <p className="indent-4">{t('privacyDesc3')}</p>
                    </div>
                  </div>
                </LegalSection>
             </div>
          </section>
        </div>

        <div className="space-y-12">
           {/* Data Management Sidebar Card */}
           <section className="bg-slate-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center space-x-3 text-red-500">
                    <Database size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">{t('dataManagement')}</span>
                 </div>
                 <h3 className="text-3xl font-serif italic tracking-tighter">{t('resetSystem')}</h3>
                 <p className="text-sm text-slate-400 font-medium leading-relaxed">
                   {t('resetDesc')}
                 </p>
                 <button 
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-white hover:text-red-700 transition-all flex items-center justify-center space-x-3 active:scale-95 shadow-[0_20px_40px_rgba(239,68,68,0.3)]"
                 >
                    <RotateCcw size={18} />
                    <span>{t('resetSystem')}</span>
                 </button>
              </div>
           </section>

           {/* Health Stats */}
           <div className="bg-white rounded-[4rem] p-12 border border-slate-200 shadow-sm space-y-12">
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3 text-blue-600">
                      <Zap size={20} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('responseLatency')}</span>
                   </div>
                   <span className="text-xl font-bold tracking-tighter text-slate-900">0.02ms</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3 text-emerald-600">
                      <Globe size={20} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('globalCdn')}</span>
                   </div>
                   <span className="text-xl font-bold tracking-tighter text-slate-900">124 Pts</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3 text-[#d4af37]">
                      <ShieldCheck size={20} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('dataIntegrity')}</span>
                   </div>
                   <span className="text-xl font-bold tracking-tighter text-slate-900">99.99%</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isResetConfirmOpen}
        title={t('resetSystem')}
        message={t('resetDesc')}
        confirmLabel={t('resetSystem')}
        confirmVariant="danger"
        onConfirm={handleResetSystem}
        onCancel={() => setIsResetConfirmOpen(false)}
        lang={lang}
      />
    </div>
  );
};

export default SystemSettings;

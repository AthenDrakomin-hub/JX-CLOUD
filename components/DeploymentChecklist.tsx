
import React from 'react';
import { 
  CheckCircle2, AlertCircle, Clock, Server, ShieldAlert, Zap, 
  Globe, Database, Sparkles 
} from 'lucide-react';
import { translations, Language } from '../translations';

interface DeploymentChecklistProps {
  lang: Language;
}

const DeploymentChecklist: React.FC<DeploymentChecklistProps> = ({ lang }) => {
  // Fix: Relax the type parameter to 'string' to allow using dynamic keys and fix TS errors
  const t = (key: string) => 
    (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const categories = [
    {
      title: t('infraSecurity'),
      items: [
        { label: t('sslTlsLabel'), status: "warning", desc: t('sslTlsDesc') },
        { label: t('jwtAuthLabel'), status: "warning", desc: t('jwtAuthDesc') },
        { label: t('corsPolicyLabel'), status: "pending", desc: t('corsPolicyDesc') },
        { label: t('envVarsLabel'), status: "pending", desc: t('envVarsDesc') }
      ]
    },
    {
      title: t('backendStorage'),
      items: [
        { label: t('dbProdLabel'), status: "pending", desc: t('dbProdDesc') },
        { label: t('redisCacheLabel'), status: "pending", desc: t('redisCacheDesc') },
        { label: t('dbBackupLabel'), status: "pending", desc: t('dbBackupDesc') }
      ]
    },
    {
      title: t('businessIntegration'),
      items: [
        { label: t('paymentSdkLabel'), status: "pending", desc: t('paymentSdkDesc') },
        { label: t('cloudPrintLabel'), status: "pending", desc: t('cloudPrintDesc') }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('preProductionAudit')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('productionReadiness')}</h2>
           <p className="text-xs text-slate-400 font-medium tracking-widest max-w-md leading-relaxed">
             {t('deploymentDesc')}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white rounded-[4rem] border border-slate-50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="p-10 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">{cat.title}</h3>
            </div>
            <div className="p-10 divide-y divide-slate-50">
              {cat.items.map((item, j) => (
                <div key={j} className="py-8 flex items-start justify-between group">
                  <div className="flex items-start space-x-6">
                    <div className={`mt-1 p-3 rounded-2xl ${
                      item.status === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                      item.status === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300'
                    }`}>
                      {item.status === 'success' ? <CheckCircle2 size={24} /> : 
                       item.status === 'warning' ? <AlertCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{item.label}</h4>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    item.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                    item.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {item.status === 'success' ? t('completed') : item.status === 'warning' ? 'Warning' : t('pending')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 生产环境监控预览 */}
      <div className="bg-[#0f172a] rounded-[4rem] p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 blur-[120px] rounded-full" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
           <div className="space-y-4">
              <div className="flex items-center space-x-3 text-[#d4af37]">
                 <Zap size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('responseLatency')}</span>
              </div>
              <p className="text-4xl font-serif italic text-white">0.02<span className="text-sm not-italic font-sans ml-2 opacity-40">ms</span></p>
           </div>
           <div className="space-y-4">
              <div className="flex items-center space-x-3 text-emerald-500">
                 <Globe size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalCdn')}</span>
              </div>
              <p className="text-4xl font-serif italic text-white">124<span className="text-sm not-italic font-sans ml-2 opacity-40">Nodes</span></p>
           </div>
           <div className="space-y-4">
              <div className="flex items-center space-x-3 text-blue-500">
                 <Database size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('dataIntegrity')}</span>
              </div>
              <p className="text-4xl font-serif italic text-white">99.99<span className="text-sm not-italic font-sans ml-2 opacity-40">%</span></p>
           </div>
           <div className="space-y-4">
              <div className="flex items-center space-x-3 text-red-500">
                 <ShieldAlert size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('ddosMitigation')}</span>
              </div>
              <p className="text-4xl font-serif italic text-white">{t('statusActive')}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentChecklist;

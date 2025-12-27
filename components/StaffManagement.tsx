
import React, { useState, useEffect } from 'react';
import { User, SecurityLog } from '../types';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { 
  Fingerprint, ShieldCheck, MapPin, 
  AlertTriangle, Shield, HardDrive, Sparkles
} from 'lucide-react';

interface StaffManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  lang: Language;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ users, lang }) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [viewMode, setViewMode] = useState<'directory' | 'audit'>('audit');
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

  useEffect(() => {
    api.logs.getAll().then(setLogs);
  }, []);

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Fingerprint size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('enterpriseSecurityConsole')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('personnelAudit')}</h2>
        </div>

        <div className="flex bg-white p-1.5 rounded-full border border-slate-100 shadow-sm">
          <button onClick={() => setViewMode('directory')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'directory' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            {t('directory')}
          </button>
          <button onClick={() => setViewMode('audit')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'audit' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            {t('auditLogs')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
         <div className="bg-emerald-950 p-8 rounded-[3rem] text-emerald-400 border border-emerald-900 flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">{t('securityHealth')}</p>
               <h4 className="text-3xl font-bold tracking-tighter">99.9%</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 flex items-center justify-center">
               <ShieldCheck size={24} />
            </div>
         </div>
         <div className="bg-slate-900 p-8 rounded-[3rem] text-white border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">{t('firewallActive')}</p>
               <h4 className="text-3xl font-bold tracking-tighter">WAF-JX</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#d4af37]">
               <Shield size={24} />
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] text-slate-900 border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">{t('dataBackup')}</p>
               <h4 className="text-3xl font-bold tracking-tighter">14:02</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-500">
               <HardDrive size={24} />
            </div>
         </div>
      </div>

      {viewMode === 'directory' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {users.map((user, idx) => (
            <div key={user.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm group hover:shadow-2xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-10" style={{ animationDelay: `${idx * 50}ms` }}>
               <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-2xl font-black text-slate-900 border border-slate-100`}>
                     {user.name[0]}
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center space-x-3">
                        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h4>
                        <div className={`px-3 py-1 rounded-full bg-amber-50 border border-amber-100 flex items-center space-x-1.5`}>
                           <ShieldCheck size={10} className="text-[#d4af37]" />
                           <span className={`text-[8px] font-black uppercase tracking-widest text-[#d4af37]`}>{user.role}</span>
                        </div>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">{t('lastActive')}: {new Date(user.lastLogin || Date.now()).toLocaleTimeString()}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-950 rounded-[4rem] p-10 shadow-2xl overflow-hidden border border-white/5 relative">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    <tr>
                       <th className="px-6 py-4">{t('securityTimestamp')}</th>
                       <th className="px-6 py-4">{t('authAgent')}</th>
                       <th className="px-6 py-4">{t('action')}</th>
                       <th className="px-6 py-4 text-center">{t('threatLevel')}</th>
                       <th className="px-6 py-4">{t('location')}</th>
                       <th className="px-6 py-4">{t('ipAddress')}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {logs.map((log, i) => (
                       <tr key={log.id} className="text-white hover:bg-white/5 transition-colors">
                          <td className="px-6 py-6 text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="px-6 py-6 text-sm font-bold">{log.userId}</td>
                          <td className="px-6 py-6 text-sm text-[#d4af37] font-medium">{log.action}</td>
                          <td className="px-6 py-6 text-center">
                             <div className={`inline-flex items-center px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${i % 5 === 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                {i % 5 === 0 ? <AlertTriangle size={10} className="mr-1.5" /> : <Shield size={10} className="mr-1.5" />}
                                {i % 5 === 0 ? 'High' : 'Secure'}
                             </div>
                          </td>
                          <td className="px-6 py-6 text-[10px] font-bold text-slate-400 flex items-center">
                             <MapPin size={10} className="mr-1.5 opacity-40" />
                             {i % 2 === 0 ? 'Makati, PH' : 'Manila, PH'}
                          </td>
                          <td className="px-6 py-6 text-[10px] font-mono text-slate-700">{log.ip}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

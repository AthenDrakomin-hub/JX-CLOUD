
import React, { useState, useEffect } from 'react';
import { UserPlus, Fingerprint, Loader2, ArrowRight, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import authClient from '../services/auth-client';
import { Language, getTranslation } from '../translations';

interface StaffActivationProps {
  token: string;
  lang: Language;
  onSuccess: () => void;
}

const StaffActivation: React.FC<StaffActivationProps> = ({ token, lang, onSuccess }) => {
  const [info, setInfo] = useState<{ email: string; name: string; role: string } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const t = (key: string) => getTranslation(lang, key);

  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(token));
      setInfo(decoded);
    } catch (e) {
      setError(t('staff_activate_error'));
    }
  }, [token, lang]);

  const handleActivate = async () => {
    if (!info) return;
    setIsRegistering(true);
    setError(null);
    try {
      const { error: signUpError } = await (authClient.signUp as any).passkey({
        email: info.email,
        name: info.name,
      });

      if (signUpError) {
        setError(signUpError.message || t('error'));
      } else {
        setIsDone(true);
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      setError(t('auth_passkey_error'));
    } finally {
      setIsRegistering(false);
    }
  };

  if (!info && !error) return null;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-xl relative z-10">
        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[4rem] p-12 space-y-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="text-blue-500 opacity-20" size={64} />
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{t('staff_activate_title')}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">{t('staff_activate_subtitle')}</p>
          </div>

          {error ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20"><AlertCircle size={40} /></div>
              <p className="text-red-400 font-bold">{error}</p>
              <button onClick={() => window.location.href = '/auth'} className="px-8 py-3 bg-white/5 text-white/40 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">返回登录页</button>
            </div>
          ) : !isDone ? (
            <>
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('staff_activate_id')}</p>
                    <p className="text-white font-bold truncate">{info?.name}</p>
                 </div>
                 <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('staff_activate_role')}</p>
                    <p className="text-blue-400 font-bold uppercase tracking-tighter">{info?.role}</p>
                 </div>
                 <div className="col-span-2 p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('staff_activate_email')}</p>
                    <p className="text-white font-mono text-xs">{info?.email}</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <button 
                  onClick={handleActivate}
                  disabled={isRegistering}
                  className="w-full p-10 bg-slate-100 hover:bg-white text-slate-950 rounded-[2.5rem] transition-all flex items-center justify-between group shadow-2xl active:scale-95 disabled:opacity-50"
                 >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          {isRegistering ? <Loader2 size={32} className="animate-spin text-white" /> : <Fingerprint size={40} className="text-white" />}
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-black leading-none mb-2">{t('staff_activate_btn')}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Secure Hardware Access</p>
                        </div>
                    </div>
                    <ArrowRight size={24} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                 </button>

                 <p className="text-[10px] text-slate-500 font-medium text-center px-10 leading-relaxed italic">
                   {t('staff_activate_desc')}
                 </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-8 animate-in zoom-in-95 duration-700">
               <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(37,99,235,0.4)] animate-bounce">
                  <ShieldCheck size={48} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">{t('staff_activate_done')}</h3>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Credential Token Issued Successfully</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffActivation;
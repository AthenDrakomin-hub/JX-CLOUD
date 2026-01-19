
import React, { useState } from 'react';
import { Shield, Fingerprint, Loader2, ArrowRight, CheckCircle2, AlertCircle, Key, Lock } from 'lucide-react';
import authClient from '../services/frontend/auth-client.frontend';
import { Language, getTranslation } from '../constants/translations';

interface AdminSetupProps {
  lang: Language;
  onSuccess: () => void;
}

const AdminSetup: React.FC<AdminSetupProps> = ({ lang, onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const t = (key: string) => getTranslation(lang, key);

  // 根管理员硬编码邮箱，用于初始化
  const ROOT_EMAIL = 'athendrakomin@proton.me';

  const handleInitialize = async () => {
    setIsRegistering(true);
    setError(null);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: ROOT_EMAIL,
        name: 'Athen Drakomin',
        password: 'temp-password-123',
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

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-600/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-xl relative z-10 space-y-12">
        <div className="text-center space-y-6">
          <div className="inline-flex p-5 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.2)] animate-pulse">
            <Shield size={64} className="text-blue-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{t('admin_setup_title')}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">{t('admin_setup_subtitle')}</p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 space-y-10 shadow-2xl">
          {!isDone ? (
            <>
              <div className="space-y-6">
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <div className="flex items-center gap-4 text-blue-400 mb-2">
                    <Lock size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('admin_setup_entity')}</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-white">{ROOT_EMAIL}</p>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {t('admin_setup_welcome')}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-in zoom-in-95">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handleInitialize}
                disabled={isRegistering}
                className="w-full p-10 bg-blue-600 hover:bg-blue-500 rounded-[2.5rem] transition-all flex items-center justify-between group shadow-[0_20px_50px_rgba(37,99,235,0.3)] disabled:opacity-50 active:scale-95"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    {isRegistering ? <Loader2 size={32} className="animate-spin text-white" /> : <Fingerprint size={40} className="text-white group-hover:scale-110 transition-transform" />}
                  </div>
                  <div className="text-left text-white">
                    <p className="text-xl font-black leading-none mb-2">{t('admin_setup_btn')}</p>
                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Bind Hardware Authenticator</p>
                  </div>
                </div>
                <ArrowRight size={24} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </>
          ) : (
            <div className="py-12 text-center space-y-8 animate-in zoom-in-95 duration-700">
               <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(16,185,129,0.4)] animate-bounce">
                  <CheckCircle2 size={48} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">{t('admin_setup_done')}</h3>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">{t('admin_setup_redirect')}</p>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 opacity-30 text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">
           <Shield size={10} />
           <span>JX-Cloud Identity Layer Secured</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
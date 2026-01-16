
import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, User, ArrowRight, Sparkles, 
  Loader2, Cpu, Globe, CheckCircle2, AlertCircle, 
  Fingerprint, Zap, ShieldCheck, Activity
} from 'lucide-react';
import { authClient } from '../services/auth-client';
import { Language, getTranslation } from '../translations';
import LegalFooter from './LegalFooter';

interface AuthPageProps {
  lang: Language;
  onToggleLang: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ lang, onToggleLang }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sysTime, setSysTime] = useState(new Date().toLocaleTimeString());

  const t = (key: string) => getTranslation(lang, key);

  // 严格匹配根管理员邮箱进行上帝模式旁路注入
  const isMasterUser = email.trim().toLowerCase() === 'athendrakomin@proton.me';

  useEffect(() => {
    const timer = setInterval(() => setSysTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterUser) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log("Master authority detected. Activating Local Session Injection...");
      // 尝试匿名认证作为占位符
      try {
        await authClient.signIn.anonymous();
      } catch (e) {
        console.warn("Remote auth node unreachable, proceeding with local bypass.");
      }
      
      // 核心旁路逻辑
      localStorage.setItem('jx_root_authority_bypass', 'true');
      localStorage.setItem('jx_bypass_timestamp', Date.now().toString());
      window.location.href = '/';
    } catch (err) {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsPasskeyLoading(true);
    setError(null);
    try {
      await authClient.signIn.passkey();
      window.location.href = "/";
    } catch (err: any) {
      if (err.message !== 'User canceled') {
        setError(t('auth_passkey_error'));
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans text-slate-100 overflow-hidden">
      {/* 左侧背景面板：宣传与监控数据 */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 border-r border-white/5 bg-gradient-to-br from-slate-950 via-[#020617] to-blue-950/20">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-1000 ${isMasterUser ? 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]'}`}>
              {isMasterUser ? <Zap size={28} className="text-white" /> : <Shield size={28} className="text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">JX CLOUD</h1>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-1">
                {isMasterUser ? t('master_identity') : t('intel_node')}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="space-y-4 max-w-md">
            <h2 className="text-6xl font-black tracking-tighter leading-tight italic">
              {t('digital_driven')} <br/>
              <span className={isMasterUser ? 'text-amber-500' : 'text-blue-500'}>{t('cloud_kitchen')}</span>
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              {t('auth_description')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-sm">
             <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                   <Activity size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Auth Protocol</span>
                </div>
                <p className="text-xl font-bold tracking-tight">{isMasterUser ? 'BYPASS_ACTIVE' : t('stable_status')}</p>
             </div>
             <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                   <Zap size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Mode</span>
                </div>
                <p className="text-xl font-bold tracking-tight">{isMasterUser ? 'GOD_MODE' : 'STANDARD'}</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between opacity-30">
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">v8.8.2-MASTER</span>
            <div className="w-1 h-1 bg-slate-500 rounded-full" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">{sysTime}</span>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest">JX-CLOUD © R&D DIVISION</p>
        </div>
      </div>

      {/* 右侧登录表单面板 */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
        <div className={`absolute top-1/4 right-0 w-96 h-96 blur-[120px] rounded-full animate-pulse transition-colors duration-1000 ${isMasterUser ? 'bg-amber-600/20' : 'bg-blue-600/10'}`} />
        
        {/* 语言切换按钮 */}
        <div className="absolute top-8 right-8 z-20">
          <button 
            onClick={onToggleLang}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 backdrop-blur-xl"
          >
            <Globe size={14} className="text-blue-500" />
            {lang === 'zh' ? 'English' : '中文模式'}
          </button>
        </div>

        <div className="w-full max-w-md space-y-12 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className={`text-4xl font-black tracking-tight ${isMasterUser ? 'text-amber-500' : ''}`}>
              {isMasterUser ? t('master_auth_title') : t('auth_title')}
            </h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
              {isMasterUser ? t('master_auth_subtitle') : t('auth_subtitle')}
            </p>
          </div>

          <div className="space-y-10">
            {/* 1. 生物识别入口 (首选) */}
            <div className="group relative">
               <div className={`absolute -inset-1 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 ${isMasterUser ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}></div>
               <button 
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading || isLoading}
                className="relative w-full p-10 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-[2rem] transition-all flex items-center justify-between group active:scale-[0.98]"
               >
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center border border-blue-500/20">
                       <Fingerprint size={48} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                       <p className="text-xl font-black text-white leading-none mb-2">{t('auth_passkey_entry')}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('auth_passkey_desc')}</p>
                    </div>
                 </div>
                 {isPasskeyLoading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <ArrowRight size={20} className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />}
               </button>
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-6">
               <div className="h-[1px] flex-1 bg-white/5" />
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{t('auth_root_access')}</span>
               <div className="h-[1px] flex-1 bg-white/5" />
            </div>

            {/* 2. 根权限认证表单 (无密码) */}
            <form onSubmit={handleMasterLogin} className="space-y-6">
              <div className="space-y-4">
                 <div className={`relative group border-2 rounded-[1.5rem] transition-all duration-500 ${isMasterUser ? 'border-amber-500 bg-amber-500/5 ring-8 ring-amber-500/5' : 'border-white/5 bg-white/[0.01]'}`}>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 border border-white/5 text-slate-500 group-focus-within:text-blue-500 transition-all">
                       <User size={18} />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('email_placeholder')}
                      className="w-full pl-20 pr-6 py-6 bg-transparent rounded-2xl text-white text-lg font-bold outline-none focus:bg-white/[0.02] transition-all" 
                    />
                    {isMasterUser && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 animate-in zoom-in">
                        <CheckCircle2 size={20} className="text-amber-500" />
                      </div>
                    )}
                 </div>
              </div>

              {error && (
                <div className="flex items-center space-x-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-shake">
                   <AlertCircle size={18} />
                   <span className="leading-tight">{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || !email}
                className={`w-full h-20 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center space-x-4 transition-all shadow-2xl active-scale-95 disabled:bg-slate-800/50 disabled:text-slate-600 ${isMasterUser ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-4 ring-amber-500/20' : 'bg-slate-800 text-slate-400'}`}
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                  <>
                    <span>{isMasterUser ? t('master_inject_btn') : t('auth_verify')}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 底部状态 */}
          <div className="flex items-center justify-between px-2 pt-12 border-t border-white/5">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   {t('rls_status')}
                </div>
             </div>
             <LegalFooter lang={lang} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-fade-up { animation: fade-up 0.6s ease-out forwards; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
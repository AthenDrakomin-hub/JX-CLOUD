
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, User, ArrowRight, Loader2, Globe, 
  Fingerprint, Key, CheckCircle2,
  ShieldAlert, Smartphone, Monitor, Info, Lock, Sparkles, Mail
} from 'lucide-react';
import { api } from '../services/api';
import { Language, getTranslation } from '../constants/translations';
import { QRCodeSVG } from 'qrcode.react';
import LegalFooter from './LegalFooter';
import authService from '../services/auth';

interface AuthPageProps {
  lang: Language;
  onToggleLang: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ lang, onToggleLang }) => {
  const [email, setEmail] = useState('');
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<'input' | 'register_choice' | 'handoff_qr' | 'pending_approval'>('input');
  const [isMobile, setIsMobile] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(true);
  const [sysTime, setSysTime] = useState(new Date().toLocaleTimeString());

  const t = (key: string, params?: any) => getTranslation(lang, key, params);

  useEffect(() => {
    const checkMobile = () => setIsMobile(/Android|iPhone/i.test(navigator.userAgent));
    const checkWebAuthn = () => setWebAuthnSupported(!!window.PublicKeyCredential);
    checkMobile();
    checkWebAuthn();
    const timer = setInterval(() => setSysTime(new Date().toLocaleTimeString()), 1000);
    
    const params = new URLSearchParams(window.location.search);
    const handoffEmail = params.get('handoff_email');
    if (handoffEmail) {
      setEmail(handoffEmail);
      if (/Android|iPhone/i.test(navigator.userAgent)) setAuthStage('register_choice');
    }
    return () => clearInterval(timer);
  }, []);

  const handleInitialAuth = async () => {
    if (!email) {
      setError(lang === 'zh' ? "请输入授权邮箱" : "Enter authorized email");
      return;
    }
    
    setError(null);
    setIsPasskeyLoading(true);
    
    try {
      // 使用 Magic Link 登录（仅使用 Supabase 原生支持的方式）
      const magicLinkResult = await authService.signInWithMagicLink({ 
        email, 
        redirectTo: window.location.origin 
      });
      
      if (magicLinkResult.success) {
        // 显示成功消息，提示用户查收邮件
        setError(null);
        alert(magicLinkResult.message || t('auth_magic_link_sent', { email }));
      } else {
        setError(magicLinkResult.message || t('auth_magic_link_error'));
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      // 捕获到异常，可能是网络错误或其他问题
      setError(err.message || t('auth_magic_link_error'));
      // 如果是网络错误或其他原因，也可能需要转到注册选择
      setAuthStage('register_choice');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleRegisterStart = async () => {
    if (!isMobile && authStage !== 'handoff_qr') setAuthStage('handoff_qr');
    else executeNativeBinding();
  };

  const executeNativeBinding = async () => {
    setIsPasskeyLoading(true);
    setError(null);
    try {
      // 使用 Supabase 注册用户（通过 Magic Link）
      const result = await authService.signUpWithEmail({ 
        email, 
        redirectTo: window.location.origin 
      });
      
      if (result.success) {
        // 注册请求已提交，等待用户通过邮件激活
        setAuthStage('pending_approval');
      } else {
        setError(result.message || t('auth_registration_error'));
      }
    } catch (err: any) {
      console.error("Registration request error:", err);
      setError(err.message || t('auth_network_error'));
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  // 在AuthPage组件中添加新的状态处理
const renderPendingApproval = () => (
  <div className="text-center space-y-6 p-8">
    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
      <Shield className="w-10 h-10 text-blue-400" />
    </div>
    <div className="space-y-3">
      <h3 className="text-2xl font-bold text-white">
        {t('registration_pending_title')}
      </h3>
      <p className="text-slate-300 text-sm max-w-md mx-auto">
        {t('registration_pending_message')}
      </p>
      <div className="text-xs text-slate-400 mt-4">
        {t('registration_email_sent', { email })}
      </div>
    </div>
    <button 
      onClick={() => setAuthStage('input')}
      className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
    >
      {t('back_to_login')}
    </button>
  </div>
);

  return (
    <div className="h-screen bg-slate-950 flex font-sans text-slate-100 overflow-hidden relative selection:bg-blue-500/30">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full" />
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="hidden lg:flex w-[45%] relative flex-col justify-between p-20 border-r border-white/5 bg-black/20 backdrop-blur-3xl shrink-0">
        <div className="relative z-10 space-y-32">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] border border-blue-400/20">
              <Shield size={32} className="text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">JX CLOUD</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Intelligence Core Terminal</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-12">
            <div className="relative">
              <span className="absolute -top-16 -left-4 text-[140px] font-black text-white/[0.02] select-none uppercase tracking-tighter">JX-CORE</span>
              <h2 className="text-8xl font-black italic leading-[0.8] text-white tracking-tighter drop-shadow-2xl">
                {t('digital_driven')} <br/>
                <span className="text-blue-500 translate-x-8 inline-block mt-4">{t('cloud_kitchen')}</span>
              </h2>
            </div>
            
            <div className="flex gap-8 items-start max-w-lg animate-fade-up">
              <div className="w-px h-28 bg-gradient-to-b from-blue-500 via-blue-500/50 to-transparent shrink-0 opacity-40" />
              <div className="space-y-5">
                <p className="text-slate-400 text-lg font-medium leading-relaxed italic tracking-tight">
                  {t('auth_description')}
                </p>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-400" />
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">v8.8 SYSTEM ENGINE</span>
                  </div>
                  <div className="w-8 h-[1px] bg-slate-800" />
                  <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">RLS_ENFORCED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
           <div className="flex gap-10 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
              <div className="flex items-center gap-2 group cursor-default">
                <Globe size={12} className="group-hover:text-blue-500 transition-colors" /> 
                EDGE_NODE: South-China-Alpha
              </div>
              <div className="flex items-center gap-2">
                <Monitor size={12} /> 
                SECURE_TIME: {sysTime}
              </div>
           </div>
           <div className="w-16 h-[1px] bg-slate-800" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-8 right-8">
           <button onClick={onToggleLang} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
             {lang === 'zh' ? 'Switch to English' : '切换至中文模式'}
           </button>
        </div>

        <div className="w-full max-w-sm space-y-12 animate-fade-up">
          {authStage === 'input' && (
            <div className="space-y-10">
              <div className="space-y-3 text-center lg:text-left">
                <div className="inline-flex lg:hidden items-center gap-3 mb-6">
                   <Shield size={24} className="text-blue-500" />
                   <h1 className="text-lg font-black text-white tracking-tighter">JX CLOUD</h1>
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">{t('auth_title')}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">{t('auth_subtitle')}</p>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="email" value={email} onChange={e => setEmail(e.target.value)} 
                    placeholder=""
                    className="w-full pl-16 pr-6 py-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] text-white text-lg font-bold outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all shadow-inner" 
                  />
                </div>

                {error && (
                  <div className="p-5 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-[10px] font-bold rounded-2xl animate-in zoom-in-95">
                    <ShieldAlert size={18} className="mb-2 text-red-500" />
                    <p>{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleInitialAuth} 
                  disabled={isPasskeyLoading} 
                  className="w-full p-8 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-[3rem] flex items-center justify-between group active:scale-[0.98] transition-all shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500 transition-all">
                      {isPasskeyLoading ? (
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                      ) : (
                        <Mail size={40} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-black text-white leading-none mb-1">{t('auth_magic_link_entry') || '登录邮箱验证'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('auth_magic_link_desc') || '通过邮箱接收登录链接'}</p>
                    </div>
                  </div>
                  <ArrowRight size={24} className="text-slate-700 group-hover:text-white transition-colors group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}

          {authStage === 'register_choice' && (
            <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center mx-auto border border-blue-600/20 shadow-xl shadow-blue-500/5">
                <Lock size={48} className="text-blue-500 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{lang === 'zh' ? '初始化生物凭证' : 'Initialize Credentials'}</h3>
                <p className="text-sm text-slate-500 px-8 leading-relaxed font-medium">
                  账户 <span className="text-blue-400 font-bold">[{email}]</span> 尚未锚定硬件。现在启动原生安全协议执行身份锁定吗？
                </p>
              </div>
              <div className="space-y-4 pt-6">
                <button onClick={handleRegisterStart} className="w-full py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(37,99,235,0.4)] transition-all active:scale-95">
                  {lang === 'zh' ? '开始安全初始化' : 'START SECURE INITIALIZATION'}
                </button>
                <button onClick={() => setAuthStage('input')} className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] hover:text-white transition-colors">{t('cancel')}</button>
              </div>
            </div>
          )}

          {authStage === 'handoff_qr' && (
            <div className="space-y-10 animate-fade-up">
               <div className="bg-white p-12 rounded-[4.5rem] text-center space-y-10 shadow-[0_40px_120px_rgba(0,0,0,0.6)] border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm">
                       <Smartphone size={14} />
                       <span>HANDOFF PROTOCOL ACTIVE</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">扫描二维码录入指纹</h4>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[4rem] inline-block border-4 border-white shadow-inner">
                    <QRCodeSVG value={`${window.location.origin}?handoff_email=${encodeURIComponent(email)}`} size={180} level="H" />
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium leading-relaxed px-6 italic">
                    请使用具备生物识别硬件的手机。完成后，本页面将感知凭证状态并自动刷新。
                  </p>
               </div>
               <div className="flex flex-col gap-5">
                  <button onClick={() => setAuthStage('register_choice')} className="w-full py-5 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-3 hover:text-white transition-all shadow-lg active:scale-[0.98]">
                    <Monitor size={16} />
                    <span>仍在此设备尝试</span>
                  </button>
                  <button onClick={() => setAuthStage('input')} className="text-center text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] hover:text-slate-400 transition-colors">取消注册</button>
               </div>
            </div>
          )}

          {authStage === 'pending_approval' && (
            <div className="space-y-10 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center mx-auto border border-blue-600/20 shadow-xl shadow-blue-500/5">
                <Shield size={48} className="text-blue-500 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  {lang === 'zh' ? '等待管理员审核' : 'Awaiting Admin Approval'}
                </h3>
                <p className="text-sm text-slate-500 px-8 leading-relaxed font-medium">
                  {lang === 'zh' 
                    ? `注册申请已提交，管理员将审核您的账户 ${email}`
                    : `Registration request submitted. Admin will review your account ${email}`
                  }
                </p>
                <div className="text-xs text-slate-400 mt-4">
                  {lang === 'zh' 
                    ? '审核通过后，您将收到邮件通知'
                    : 'You will receive email notification once approved'
                  }
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <button 
                  onClick={() => setAuthStage('input')} 
                  className="w-full py-7 bg-slate-700 hover:bg-slate-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all active:scale-95"
                >
                  {lang === 'zh' ? '返回登录' : 'BACK TO LOGIN'}
                </button>
              </div>
            </div>
          )}
          
          <div className="pt-16 border-t border-white/5 flex flex-col items-center gap-10">
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,1)]" />
                <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em] italic">{t('rls_status')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 group">
                <CheckCircle2 size={16} className="group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-tighter italic select-none">Secured by Vault-X 2.0</span>
              </div>
            </div>
            <div className="scale-95 opacity-50 hover:opacity-100 transition-opacity">
              <LegalFooter lang={lang} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
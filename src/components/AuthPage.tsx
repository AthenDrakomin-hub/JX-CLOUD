import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, Lock, User, ArrowRight, Sparkles, 
  Loader2, Cpu, Globe, CheckCircle2, AlertCircle, 
  Fingerprint, Zap, ShieldCheck, Activity
} from 'lucide-react';
import { authClient, signInWithPasskey } from '../services/auth-client.js';
import LegalFooter from './LegalFooter.js';
import { Language } from '../translations.js';

const AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sysTime, setSysTime] = useState(new Date().toLocaleTimeString());

  // 语言初始化
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    let initialLang = 'en';
    if (browserLang.includes('zh')) initialLang = 'zh';
    else if (browserLang.includes('fil') || browserLang.includes('tl')) initialLang = 'fil';
    
    if (i18n.language !== initialLang) {
      i18n.changeLanguage(initialLang);
    }
  }, [i18n]);

  // 管理员状态检查
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isMasterUser, setIsMasterUser] = useState(false);

  // 简化管理员状态检查 - 使用 localStorage 或其他方式来判断
  useEffect(() => {
    // 在实际应用中，您可能需要从后端获取用户信息
    // 这里只是简化处理
    const checkAdminStatus = () => {
      // Placeholder: 实际应用中应该通过 API 获取用户信息
      // 暂时设为 false，因为没有可用的会话钩子
      setIsAdminUser(false);
      setIsMasterUser(false);
    };
    checkAdminStatus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSysTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);





  // ✅ 智能 Passkey 登录，自动判断是否需要初始化
  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    setIsPasskeyLoading(true);
    setError(null);

    try {
      // 首先尝试使用现有的 Passkey 凭证登录
      await authClient.signIn.passkey();
      window.location.href = "/";
    } catch (err: any) {
      // 智能判断错误类型并提供相应处理
      if (
        err.name === "NotFoundError" || 
        err.message?.includes("no credentials") ||
        err.message?.includes("credential not found") ||
        err.message?.includes("No available authenticator") ||
        err.message?.includes("No credentials")
      ) {
        // 如果没有找到凭证，引导用户进行初始化
        setError("🔑 未找到你的生物识别凭证。点击下方按钮进行初始化。");
      } else if (err.name === 'NotAllowedError' || 
          err.name === 'NotSupportedError' ||
          err.message?.includes('platform authenticator not available') ||
          err.message?.includes('cross-device') || 
          err.name === 'InvalidStateError' ||
          err.message?.includes('operation denied') ||
          err.message?.includes('SecurityError') ||
          err.message?.includes('The operation either timed out or was not allowed')) {
        setError('🔄 跨设备认证已激活！请使用手机扫描屏幕上的二维码，在手机上完成指纹验证。\n\n📱 操作步骤：\n1. 打开手机相机或微信扫码\n2. 点击链接跳转到手机验证页面\n3. 使用手机指纹完成登录');
      } else if (err.message !== 'User canceled') {
        setError(`${t('auth_passkey_error')}: ${err.message || err.name || '未知错误'}`);
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : i18n.language === 'zh' ? 'fil' : 'en';
    i18n.changeLanguage(newLang);
  };



  // 新增智能判断和初始化处理函数
  const handleSmartPasskeyLogin = async () => {
    if (!email) {
      setError('请先输入邮箱地址');
      return;
    }

    setIsPasskeyLoading(true);
    setError(null);
    
    try {
      // 尝试使用现有的 Passkey 凭证登录
      await authClient.signIn.passkey();
      window.location.href = "/";
    } catch (err: any) {
      // 智能判断错误类型并提供相应处理
      if (
        err.name === "NotFoundError" || 
        err.message?.includes("no credentials") ||
        err.message?.includes("credential not found") ||
        err.message?.includes("No available authenticator") ||
        err.message?.includes("No credentials")
      ) {
        // 如果没有找到凭证，引导用户进行初始化
        setError("🔑 未找到你的生物识别凭证。点击下方按钮进行初始化。");
      } else {
        setError(`登录失败：${err.message || err.name}`);
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  // 初始化 Passkey 函数
  const handleInitializePasskey = async (email: string) => {
    if (!email) {
      setError("请先输入邮箱");
      return;
    }

    try {
      setIsPasskeyLoading(true);
      // 使用 signUp.passkey 进行初始化注册
      const result = await authClient.signUp.passkey({ 
        email: email,
        username: email.split('@')[0] // 使用邮箱用户名部分作为标识
      });
      
      if (result?.session) {
        // 初始化成功，跳转到首页
        alert("生物识别初始化成功！");
        window.location.href = "/";
      } else {
        // 如果注册后直接登录不成功，提示用户重新登录
        alert("生物识别初始化完成，请重新登录");
        setError("初始化完成，请点击'使用现有凭证登录'");
      }
    } catch (error: any) {
      setError("初始化失败：" + (error.message || "未知错误"));
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
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-1000 ${isAdminUser ? 'bg-amber-500 text-amber-900' : 'bg-slate-800 text-slate-400'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('hotel_management_system')}</h1>
              <p className="text-slate-400 text-sm mt-1">{t('secure_enterprise_solution')}</p>
            </div>
          </div>
          
          <div className="mt-16 space-y-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">实时订单处理</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                智能订单分发系统，支持多终端同步，确保每个订单都能及时响应。
              </p>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">生物识别安全</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                采用Passkeys生物识别技术，无需密码，安全便捷的登录体验。
              </p>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">实时监控</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">系统时间</span>
                  <span className="text-white font-mono">{sysTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">状态</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    运行正常
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <LegalFooter lang={i18n.language === 'fil' ? 'en' : i18n.language as Language} />
      </div>

      {/* 右侧面板：登录表单 */}
      <div className="flex-1 flex flex-col justify-center p-16 bg-[#020617]/95 backdrop-blur-sm">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">欢迎回来</h2>
            <p className="text-slate-400">使用生物识别技术安全登录</p>
          </div>

          <form onSubmit={handleMasterLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="请输入您的邮箱地址"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPasskeyLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPasskeyLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  生物识别登录
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSmartPasskeyLogin}
              disabled={isPasskeyLoading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
            >
              智能登录 (检测凭证状态)
            </button>
          </form>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#020617] text-slate-500">其他选项</span>
              </div>
            </div>
            
            <button
              onClick={toggleLanguage}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              切换语言: {i18n.language === 'zh' ? '中文' : i18n.language === 'en' ? 'English' : 'Filipino'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Fingerprint, ShieldCheck, Loader2, CheckCircle2, AlertCircle, 
  ArrowRight, UserRound, Clock, Users, Key 
} from 'lucide-react';
import { getEnhancedAuthClient } from '../services/auth-client';
import { api } from '../services/api';

interface UserBiometricSetupProps {
  mode?: 'admin' | 'employee' | 'invite';
  userId?: string;
  token?: string;
  userEmail?: string;
  userName?: string;
}

const UserBiometricSetup: React.FC<UserBiometricSetupProps> = ({ 
  mode = 'employee', 
  userId, 
  token, 
  userEmail,
  userName 
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(userEmail || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(!!token);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [localUserName, setLocalUserName] = useState(userName || '');

  // Token验证逻辑
  useEffect(() => {
    if (token && userId) {
      validateToken(userId, token);
    } else if (mode === 'admin') {
      setIsValidating(false);
      setTokenValid(true);
    } else {
      setIsValidating(false);
      setTokenValid(true);
    }
  }, [token, userId, mode]);

  const validateToken = async (validationUserId: string, validationToken: string) => {
    try {
      const response = await fetch(`/api/auth/validate-token?userId=${validationUserId}&token=${validationToken}`);
      const result = await response.json();
      
      if (result.valid) {
        setTokenValid(true);
        // 获取用户信息填充表单
        if (!userEmail || !userName) {
          const users = await api.users.getAll();
          const user = users.find(u => u.id === validationUserId);
          if (user) {
            setEmail(user.email);
            setLocalUserName(user.name);
          }
        }
      } else {
        setTokenValid(false);
        setError(result.message || '注册链接无效或已过期');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
      setError('验证注册链接时发生错误');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    if (mode === 'admin') {
      // 管理员模式：验证角色
      try {
        const users = await api.users.getAllWithBusinessData();
        const targetUser = users.find(user => user.email === email);
        
        if (!targetUser) {
          setError('未找到该邮箱对应的用户账户');
          return;
        }
        
        if (targetUser.role !== 'admin') {
          setError('只有管理员角色的账户才能绑定指纹');
          return;
        }
      } catch (err) {
        setError('验证用户角色时发生错误');
        return;
      }
    }

    if (token && tokenValid === false) {
      setError('注册链接无效，请联系管理员重新发送');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const enhancedClient = await getEnhancedAuthClient();

      const result = await enhancedClient.passkey.register({
        email,
      });

      if (result.error) {
        console.error('Passkey registration error:', result.error);
        setError(result.error.message || '指纹注册失败');
        setIsRegistering(false);
        return;
      }

      console.log('Passkey registered successfully');
      setSuccess(true);
      
      // 更新用户状态
      if (userId) {
        try {
          await api.users.update(userId, { isActive: true, isPasskeyBound: true });
        } catch (error) {
          console.error('Failed to update user status:', error);
        }
      }
      
      // 根据模式跳转不同页面
      setTimeout(() => {
        if (mode === 'admin') {
          window.location.href = '/';
        } else {
          window.location.href = '/login';
        }
      }, 2000);
    } catch (err) {
      console.error('Passkey registration error:', err);
      setError(err instanceof Error ? err.message : '注册过程中发生错误');
    } finally {
      setIsRegistering(false);
    }
  };

  // Token验证中
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">正在验证注册链接...</p>
        </div>
      </div>
    );
  }

  // Token无效
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">注册链接无效</h1>
            <p className="text-slate-400">
              {error || '此注册链接可能已过期或已被使用'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 确定界面主题和文案
  const getTitle = () => {
    if (mode === 'admin') return '管理员指纹设置';
    if (mode === 'invite') return '员工入职指纹绑定';
    return '员工指纹登记';
  };

  const getDescription = () => {
    if (mode === 'admin') return '为管理员账户绑定生物识别';
    if (mode === 'invite') return `欢迎 ${localUserName || '新同事'} 完成入职手续`;
    return '绑定您的生物识别信息';
  };

  const getButtonLabel = () => {
    if (mode === 'admin') return '绑定指纹';
    if (mode === 'invite') return '绑定我的生物识别';
    return '绑定指纹';
  };

  const getSuccessMessage = () => {
    if (mode === 'admin') return `管理员账户 ${email} 的指纹已成功绑定`;
    if (mode === 'invite') return `${localUserName || '您的'}入职手续已完成，即将跳转到登录页面`;
    return '您的指纹已成功绑定到账户';
  };

  const getColorScheme = () => {
    if (mode === 'admin') return { primary: 'amber', secondary: 'orange' };
    return { primary: 'blue', secondary: 'indigo' };
  };

  const { primary, secondary } = getColorScheme();

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className={`mx-auto w-16 h-16 bg-${primary}-500/10 rounded-2xl flex items-center justify-center border border-${primary}-500/20`}>
            {mode === 'admin' ? (
              <ShieldCheck size={40} className={`text-${primary}-500`} />
            ) : (
              <Fingerprint size={40} className={`text-${primary}-500`} />
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {getTitle()}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            {getDescription()}
          </p>
          {mode === 'invite' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-bold mt-2">
              <Clock size={12} />
              <span>邀请注册</span>
            </div>
          )}
          {mode === 'admin' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-bold mt-2">
              <Key size={12} />
              <span>管理员专用</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
          {!success ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
                  {mode === 'admin' ? '管理员邮箱' : '邮箱地址'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={userId && userEmail ? userEmail : "请输入您的工作邮箱"}
                    disabled={!!(userId && userEmail)}
                    className={`w-full px-6 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-${primary}-500 focus:ring-2 focus:ring-${primary}-500/20 transition-all ${
                      (userId && userEmail) ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                {mode === 'invite' && localUserName && (
                  <p className="text-xs text-slate-500 mt-1">
                    欢迎 {localUserName}，请绑定您的指纹完成入职
                  </p>
                )}
                {mode === 'admin' && (
                  <p className="text-xs text-slate-500 mt-1">
                    只有数据库中角色为 admin 的邮箱才能绑定指纹
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleRegisterPasskey}
                disabled={isRegistering || !email}
                className={`w-full h-16 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-${primary}-600 to-${secondary}-600 hover:from-${primary}-500 hover:to-${secondary}-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRegistering ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>正在绑定指纹...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={20} />
                    <span>{getButtonLabel()}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">绑定成功!</h3>
                <p className="text-slate-400">
                  {getSuccessMessage()}
                </p>
              </div>
              <div className="pt-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${primary}-500/10 border border-${primary}-500/20 rounded-lg text-${primary}-400 text-xs font-bold`}>
                  <ShieldCheck size={14} />
                  <span>{mode === 'admin' ? '即将跳转到首页' : '即将跳转到登录页面'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-slate-600">
            请确保在安全的环境中进行指纹绑定
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserBiometricSetup;
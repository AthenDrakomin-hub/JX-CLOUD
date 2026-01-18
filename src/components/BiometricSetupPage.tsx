import React, { useState, useEffect } from 'react';
import { useSession, getEnhancedAuthClient } from '../services/auth-client';
import { Shield, Fingerprint, CheckCircle, Loader2 } from 'lucide-react';

const BiometricSetupPage: React.FC = () => {
  const { data: session, mutate } = useSession();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否支持 WebAuthn
    if (!window.PublicKeyCredential) {
      setError('您的浏览器不支持生物识别认证');
      setStatus('error');
      return;
    }

    // 检查是否已在支持的上下文中
    if (window.isSecureContext === false) {
      setError('生物识别需要在安全上下文（HTTPS 或 localhost）中运行');
      setStatus('error');
      return;
    }
  }, []);

  const setupBiometric = async () => {
    setStatus('loading');
    setError(null);

    try {
      // 获取增强的认证客户端（包含 Passkey 插件）
      const enhancedClient = await getEnhancedAuthClient();
      
      // 注册生物识别
      await enhancedClient.passkey.register({
        email: session?.user?.email || 'admin',
      });

      setStatus('success');
      setTimeout(() => {
        // 重新验证会话状态
        mutate();
        // 重定向到主页
        window.location.href = '/';
      }, 2000);

    } catch (err: any) {
      console.error('生物识别设置失败:', err);
      setError(err.message || '生物识别设置失败，请重试');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">生物识别设置</h1>
          <p className="text-slate-400">
            为您的账户添加指纹或面部识别
          </p>
        </div>

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-amber-500">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">安全建议</h3>
                  <p className="text-sm text-slate-400">
                    绑定生物识别后，您可以享受更快捷、更安全的登录体验。
                    密码登录将被禁用以提高安全性。
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={setupBiometric}
              disabled={status === 'loading'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>设置中...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  <span>开始设置生物识别</span>
                </>
              )}
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
            <h3 className="text-lg font-medium text-white mb-2">正在设置生物识别</h3>
            <p className="text-slate-400">请按照设备提示完成验证</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">设置成功！</h3>
            <p className="text-slate-400">您的生物识别已成功绑定</p>
            <p className="text-sm text-slate-500 mt-2">即将返回主页...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">设置失败</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => setStatus('idle')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg"
            >
              重试
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            需要帮助？请联系系统管理员
          </p>
        </div>
      </div>
    </div>
  );
};

export default BiometricSetupPage;
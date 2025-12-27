import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';
import { translations, Language } from '../translations';

interface AuthCallbackProps {
  lang: Language;
  onLoginSuccess: (user: User) => void;
  onLoginFailure: () => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ lang, onLoginSuccess, onLoginFailure }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)?.[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 获取 URL 参数
        const urlParams = new URLSearchParams(window.location.search);
        const errorDescription = urlParams.get('error_description');
        
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // 获取当前会话
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // 获取用户信息
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }

          if (user) {
            // 创建用户对象
            const userObj: User = {
              id: user.id,
              username: user.email?.split('@')[0] || user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              role: user.user_metadata?.role || 'staff' as any
            };

            onLoginSuccess(userObj);
          } else {
            throw new Error('User not found');
          }
        } else {
          throw new Error('No session found');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        onLoginFailure();
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [onLoginSuccess, onLoginFailure]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <div className="max-w-[420px] w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{t('jxCloud')}</h1>
          <p className="text-slate-400">{t('syncing')}</p>
          <div className="mt-8 flex justify-center">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <div className="max-w-[420px] w-full text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">{t('errorOccurred')}</h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="px-6 py-3 bg-[#d4af37] text-white rounded-lg font-bold"
          >
            {t('retryAction')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="max-w-[420px] w-full text-center">
        <h1 className="text-2xl font-bold text-emerald-500 mb-4">{t('encryptedConnect')}</h1>
        <p className="text-slate-400">{t('syncing')}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
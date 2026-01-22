import React, { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 交换代码获取会话
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('Auth callback error:', error);
          // 重定向到登录页面并携带错误信息
          window.location.href = '/auth?error=callback';
          return;
        }
        
        if (data.session) {
          // 成功建立会话，重定向到主页
          window.location.href = '/';
        } else {
          // 没有获得会话，重定向到登录页面
          window.location.href = '/auth?error=no_session';
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        window.location.href = '/auth?error=unexpected';
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-bold">正在登录...</p>
        <p className="text-slate-400 text-sm">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Language, translations } from '../translations';

interface PasswordResetProps {
  token?: string;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ token: initialToken }) => {
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lang, setLang] = useState<Language>('zh');
  
  // 从URL参数获取token
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    } else {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      if (tokenFromUrl) {
        setToken(tokenFromUrl);
      }
    }
    
    // 检测语言
    const detectedLang = (localStorage.getItem('jx_lang') as Language) || 'zh';
    setLang(detectedLang);
  }, [initialToken]);

  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!token) {
      setError('缺少重置令牌，请检查重置链接是否完整');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      setError('请输入新密码和确认密码');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('密码长度至少为6位');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 调用API重置密码
      const result = await api.auth.resetPassword({
        token,
        newPassword
      });
      
      if (result.success) {
        setMessage('密码重置成功！请使用新密码登录。');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || '密码重置失败，请稍后重试');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('密码重置失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-slate-900/95 p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10 p-10 lg:p-14 animate-in zoom-in-95">
        
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 mb-8 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent animate-pulse" />
            <ShieldCheck size={32} className="text-[#d4af37] relative z-10" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">{t('hotelName')}</h1>
          <p className="text-[10px] font-black text-[#d4af37] tracking-[0.5em] uppercase opacity-70">{t('passwordReset')}</p>
        </div>

        <div className="space-y-8 animate-in slide-in-from-right">
          <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-start space-x-4 mb-4">
            <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
            <div className="space-y-1 text-left">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">密码重置</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">请输入您的新密码</p>
            </div>
          </div>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">新密码</label>
              <input 
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
                placeholder="输入新密码"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">确认密码</label>
              <input 
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
                placeholder="再次输入新密码"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-3"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><ShieldCheck size={20} /><span>重置密码</span></>}
            </button>
          </form>
          
          {message && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-100 text-center">
              {message}
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100 text-center">
              {error}
            </div>
          )}
        </div>
        
        <div className="mt-12 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">
          <div className="flex items-center space-x-2"><ShieldCheck size={12} className="text-[#d4af37]" /><span>{t('ssoProtectionActive')}</span></div>
          <div className="flex items-center space-x-4">
            <span className="opacity-40">JX_CLOUD_PROD_V3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
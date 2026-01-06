import React, { useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Eye, EyeOff, Loader2, ShieldCheck, Monitor, ChevronRight } from 'lucide-react';
import { supabase, isDemoMode } from '../services/supabaseClient';
import { User as UserType, UserRole } from '../types';
import { INITIAL_USERS } from '../constants';

type Props = {
  onAuthSuccess?: (user: UserType) => void;
};

export default function SignUpLogin({ onAuthSuccess }: Props) {
  const [username, setUsername] = useState(''); // Changed from email to username to match project
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    if (!username) {
      setErrorMsg('请输入工号');
      return false;
    }
    if (!password || password.length < 6) { // Changed from 8 to 6 to match project requirements
      setErrorMsg('密码长度至少为 6 位');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validate()) return;

    setLoading(true);
    try {
      if (isDemoMode) {
        // 演示模式：使用本地验证
        if (mode === 'signup') {
          // 演示模式不支持注册，只支持登录
          setErrorMsg('演示模式下不支持注册，请联系管理员创建账户');
          setLoading(false);
          return;
        }

        // 在演示模式下查找用户
        const users = [...INITIAL_USERS];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
          onAuthSuccess?.(user);
        } else {
          setErrorMsg('工号或密码错误');
        }
      } else {
        // 生产模式：使用 Supabase Auth
        if (mode === 'signup') {
          // 注册流程
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: username, // 使用用户名作为邮箱（项目可能需要调整）
            password,
          });

          if (signUpError) {
            setErrorMsg(signUpError.message);
            setLoading(false);
            return;
          }

          // 如果注册成功且返回了 session（已登录）
          if (signUpData?.session) {
            // 获取用户信息
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', signUpData.user?.email)
              .single();
              
            if (userError || !userData) {
              setErrorMsg('用户数据获取失败');
              setLoading(false);
              return;
            }

            // 创建用户对象
            const user: UserType = {
              id: userData.id,
              username: userData.email,
              name: userData.full_name,
              role: userData.role as UserRole,
              modulePermissions: userData.metadata?.permissions || {}
            };
            
            onAuthSuccess?.(user);
            return;
          }

          // 如果注册成功但没有自动登录，尝试手动登录
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: username,
            password,
          });

          if (signInError) {
            setErrorMsg(signInError.message);
            setLoading(false);
            return;
          }

          // 获取用户信息
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', signInData.user?.email)
            .single();
            
          if (userError || !userData) {
            setErrorMsg('用户数据获取失败');
            setLoading(false);
            return;
          }

          // 创建用户对象
          const user: UserType = {
            id: userData.id,
            username: userData.email,
            name: userData.full_name,
            role: userData.role as UserRole,
            modulePermissions: userData.metadata?.permissions || {}
          };
          
          onAuthSuccess?.(user);
        } else {
          // 登录流程
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: username,
            password,
          });

          if (signInError) {
            setErrorMsg(signInError.message);
            setLoading(false);
            return;
          }

          // 获取用户信息
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', signInData.user?.email)
            .single();
            
          if (userError || !userData) {
            setErrorMsg('用户数据获取失败');
            setLoading(false);
            return;
          }

          // 创建用户对象
          const user: UserType = {
            id: userData.id,
            username: userData.email,
            name: userData.full_name,
            role: userData.role as UserRole,
            modulePermissions: userData.metadata?.permissions || {}
          };
          
          onAuthSuccess?.(user);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('发生未知错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-slate-100 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover" 
          alt="Hospitality Background" 
        />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 lg:p-14 space-y-10 border border-white/50">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center">
               <div className="w-16 h-16 bg-slate-950 text-blue-500 rounded-3xl flex items-center justify-center font-black text-2xl italic shadow-2xl mb-4 border-2 border-white/20">JX</div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">江西云厨管理系统</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">JX Cloud Terminal Interface</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">工号 Username</label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm" 
                  placeholder="请输入工号" 
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">密码 Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[2rem] font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-5 outline-none transition-all shadow-sm pr-16"
                    placeholder="请输入密码" 
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && <p className="text-sm text-red-600 text-center">{errorMsg}</p>}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-slate-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                >
                  {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="group w-40 py-4 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <span>{mode === 'signup' ? '注册' : '登录'}</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] pt-4">© 2025 JX-Cloud Infrastructure Group</p>
          </div>
        </div>
      </div>
    </div>
  );
}
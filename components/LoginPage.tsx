/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { api } from '../services/api';
import { notificationService } from '../services/notification';

// 使用项目中已定义的环境变量获取方式
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 使用 Supabase 认证
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // 在 Supabase 中用户名通常作为邮箱使用
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // 认证成功后，获取用户信息并设置到应用状态
      if (data.user) {
        // 从数据库获取完整用户信息
        const user = await api.db.selectOrLoginUser({ username, password });
        if (user) {
          // 设置当前用户状态
          // 注意：这里需要通过父组件或全局状态管理来设置 currentUser
          console.log('Login successful', data.user);
          
          // 发送通知
          notificationService.send('登录成功', `欢迎回来，${user.name || username}`, 'AUTH');
          
          // 重定向到主页
          navigate('/');
        } else {
          setErrorMsg('用户信息获取失败');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? '未知错误');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">江西云厨</h2>
          <p className="text-slate-500 mt-2">JIANG XI CLOUD</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
              用户名/邮箱
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
              placeholder="输入用户名或邮箱"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
              placeholder="输入密码"
            />
          </div>
          
          {errorMsg && (
            <div className="text-red-500 text-sm py-2 px-4 bg-red-50 rounded-lg">
              {errorMsg}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-[#d4af37] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </>
            ) : (
              '登录系统'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <small className="text-slate-500 text-xs">
            如果出现 "User not confirmed" 或类似错误，请在 Supabase Dashboard → Authentication → Users 手动确认测试用户邮箱，或检查 Email confirmations 设置。
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
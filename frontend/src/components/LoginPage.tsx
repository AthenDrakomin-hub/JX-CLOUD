import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Language } from '../constants/translations';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  lang: Language;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, lang }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 模拟登录验证
      // 实际项目中这里应该调用API进行身份验证
      if (username && password) {
        // 模拟不同角色的登录
        let role: UserRole = UserRole.staff;
        if (username.toLowerCase().includes('admin')) {
          role = UserRole.admin;
        } else if (username.toLowerCase().includes('partner')) {
          role = UserRole.partner;
        }

        const user: User = {
          id: `user_${Date.now()}`,
          name: username, // Use name instead of username
          email: `${username}@jiangyunchu.com`,
          role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // 保存用户信息到localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // 根据角色设置默认语言
        const defaultLang = role === UserRole.admin ? 'zh' : 'en';
        localStorage.setItem('preferredLanguage', defaultLang);
        
        onLoginSuccess(user);
      } else {
        setError('请输入用户名和密码');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const translations = {
    zh: {
      title: '江云厨智能点餐系统',
      subtitle: '专业餐饮管理系统',
      username: '用户名',
      password: '密码',
      login: '登录',
      loading: '登录中...',
      error: '用户名或密码错误'
    },
    en: {
      title: 'Jiangyun Chef Smart Ordering System',
      subtitle: 'Professional Restaurant Management System',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      loading: 'Logging in...',
      error: 'Invalid username or password'
    },
    fil: {
      title: 'Sistema ng Jiangyun Chef Smart Ordering',
      subtitle: 'Propesyonal na Sistema ng Pamamahala sa Restawran',
      username: 'Username',
      password: 'Password',
      login: 'Mag-login',
      loading: 'Naglolog in...',
      error: 'Di-wasto ang username o password'
    }
  };

  const t = translations[lang] || translations.zh;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              {t.username}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="输入用户名"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? t.loading : t.login}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>演示账号：</p>
          <p>admin - 管理员权限</p>
          <p>staff - 员工权限</p>
          <p>partner - 合作伙伴权限</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
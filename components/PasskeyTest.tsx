// Passkey 测试组件 - 用于验证生物识别功能
import React, { useState } from 'react';
import { signInWithPasskey, registerAdminPasskey, authClient } from '../src/services/auth-client';

const PasskeyTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    if (!email) {
      setMessage('请输入邮箱地址');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      // 注册新的 Passkey
      await registerAdminPasskey(email);
      setMessage('✅ Passkey 注册成功！');
    } catch (error: any) {
      console.error('Passkey 注册失败:', error);
      setMessage(`❌ 注册失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) {
      setMessage('请输入邮箱地址');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      // 使用 Passkey 登录
      await authClient.signIn.passkey();
      setMessage('✅ Passkey 登录成功！');
    } catch (error: any) {
      console.error('Passkey 登录失败:', error);
      if (error.name === "NotFoundError" || error.message?.includes("no credentials")) {
        setMessage("❌ 未找到凭证，请先注册 Passkey");
      } else {
        setMessage(`❌ 登录失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🔐 Passkey 测试</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            邮箱地址
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@example.com"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '处理中...' : '注册 Passkey'}
          </button>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '处理中...' : '指纹登录'}
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium mb-2">📝 说明:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>首次使用需先注册 Passkey</li>
          <li>支持指纹、面部识别等生物特征</li>
          <li>需要 HTTPS 环境才能正常使用</li>
          <li>开发环境请使用 localhost</li>
        </ul>
      </div>
    </div>
  );
};

export default PasskeyTest;
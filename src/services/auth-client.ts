import { createAuthClient } from "better-auth/client";
import type { AuthClient as BetterAuthClient } from "better-auth/client";
import { useState, useEffect } from "react";

/**
 * 江西云厨 - 身份验证客户端
 * 实现 Vercel 生产环境自适应 URL
 * Passkey/WebAuthn 功能通过服务端配置启用
 */

// 自定义 fetch 函数以禁用缓存
const noCacheFetch = (url: string, options: RequestInit = {}) => {
  // 添加时间戳参数
  const separator = url.includes('?') ? '&' : '?';
  const urlWithTimestamp = `${url}${separator}t=${Date.now()}`;
  
  // 设置缓存控制头
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };
  
  return fetch(urlWithTimestamp, enhancedOptions);
};

// 获取基础URL（优先使用环境变量）
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // 客户端环境 - 使用当前页面的协议和主机
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  // 服务端环境
  return process.env.BETTER_AUTH_URL || 'https://localhost:3008';
};

// 创建认证客户端 - 与服务端配置保持一致
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetch: noCacheFetch
});

// ✅ 提供类型安全的辅助函数（使用安全检查）
export const signInWithPasskey = async (options?: any) => {
  if ('passkey' in authClient.signIn && typeof authClient.signIn.passkey === 'function') {
    return authClient.signIn.passkey(options);
  } else {
    // 如果 passkey 方法不可用，抛出错误提示用户
    throw new Error('Passkey authentication is not available. Please ensure the service worker is registered and WebAuthn is supported in your browser.');
  }
};

export const signUpWithPasskey = async () => {
  if ('passkey' in authClient.signUp && typeof authClient.signUp.passkey === 'function') {
    return authClient.signUp.passkey();
  } else {
    throw new Error('Passkey registration is not available. Please ensure the service worker is registered and WebAuthn is supported in your browser.');
  }
};

// 导出基础认证方法
export const { useSession, signIn, signOut, signUp } = authClient;

// 开发环境会话Hook
export const useDevSession = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查开发环境绕过
    if (process.env.NODE_ENV === 'development' && localStorage.getItem('jx_dev_bypass')) {
      const storedSession = localStorage.getItem('jx_session');
      if (storedSession) {
        setSession(JSON.parse(storedSession));
      }
    }
    setIsLoading(false);
  }, []);

  return { data: session, isLoading };
};


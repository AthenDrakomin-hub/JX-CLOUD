import { createAuthClient } from "better-auth/client";
import type { AuthClient as BetterAuthClient } from "better-auth/client";
import { useState, useEffect } from "react";
import { passkeyClient } from "@better-auth/passkey/client";

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

// Passkey 客户端插件配置
const passkeyPlugin = passkeyClient();

// 创建认证客户端 - 与服务端配置保持一致
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetch: noCacheFetch,
  plugins: [passkeyPlugin]
});

// ✅ 提供类型安全的辅助函数（使用类型守卫）
export const signInWithPasskey = async () => {
  if ('passkey' in authClient.signIn && typeof authClient.signIn.passkey === 'function') {
    return authClient.signIn.passkey();
  }
  throw new Error('Passkey authentication is not available. Please ensure the passkey plugin is properly initialized.');
};

export const signUpWithPasskey = async () => {
  if ('passkey' in authClient.signUp && typeof authClient.signUp.passkey === 'function') {
    return authClient.signUp.passkey();
  }
  throw new Error('Passkey registration is not available. Please ensure the passkey plugin is properly initialized.');
};

// 导出基础认证方法
export const { useSession, signIn, signOut, signUp } = authClient;

// 导出增强认证客户端（用于生物识别设置）
export const getEnhancedAuthClient = async () => {
  return authClient;
};

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


import { createAuthClient } from "better-auth/react";
import { useState, useEffect } from "react";

/**
 * 江西云厨 - 身份验证客户端 (支持 WebAuthn 异步加载)
 * 实现 Vercel 生产环境自适应 URL
 * WebAuthn 插件通过异步加载避免影响首屏性能
 */

// 异步加载 WebAuthn 插件，配置跨设备能力
let passkeyPluginPromise: Promise<any> | null = null;

const loadPasskeyPlugin = async () => {
  if (!passkeyPluginPromise) {
    passkeyPluginPromise = import("better-auth/client/plugins").then(
      (module) => module.passkeyClient({
        // 配置 WebAuthn 跨设备认证
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform", // 允许跨平台认证（手机/电脑）
          residentKey: "preferred", // 优先使用驻留密钥
          userVerification: "preferred" // 用户验证偏好
        },
        // 生产环境配置 RP ID，开发环境使用当前主机
        rpID: typeof window !== 'undefined' 
          ? window.location.hostname === 'localhost' 
            ? 'localhost'  // 开发环境使用localhost
            : window.location.hostname  // 生产环境使用实际域名
          : 'localhost'
      })
    );
  }
  return await passkeyPluginPromise;
};

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

// 创建基础认证客户端（不含 WebAuthn）
export const authClient = createAuthClient({
    baseURL: getBaseURL(),
    fetch: noCacheFetch
});

// 导出带 WebAuthn 功能的认证客户端（按需加载）
export const getEnhancedAuthClient = async () => {
  const passkeyPlugin = await loadPasskeyPlugin();
  return createAuthClient({
    baseURL: getBaseURL(),
    plugins: [passkeyPlugin],
    fetch: noCacheFetch
  });
};

// 扩展Better Auth客户端以包含自定义字段
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

// 类型扩展以包含扩展字段
declare module "better-auth/react" {
  interface User {
    role?: string;
    partnerId?: string;
    emailVerified?: boolean;
    authType?: string;
  }
}
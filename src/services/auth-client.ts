
import { createAuthClient } from "better-auth/react";

/**
 * 江西云厨 - 身份验证客户端 (支持 WebAuthn 异步加载)
 * 实现 Vercel 生产环境自适应 URL
 * WebAuthn 插件通过异步加载避免影响首屏性能
 */

// 异步加载 WebAuthn 插件，避免影响首屏加载
let passkeyPluginPromise: Promise<any> | null = null;

const loadPasskeyPlugin = async () => {
  if (!passkeyPluginPromise) {
    passkeyPluginPromise = import("better-auth/client/plugins").then(
      (module) => module.passkeyClient()
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

// 创建基础认证客户端（不含 WebAuthn）
export const authClient = createAuthClient({
    baseURL: 'https://www.jiangxijiudian.store',
    fetch: noCacheFetch
});

// 导出带 WebAuthn 功能的认证客户端（按需加载）
export const getEnhancedAuthClient = async () => {
  const passkeyPlugin = await loadPasskeyPlugin();
  return createAuthClient({
    baseURL: 'https://www.jiangxijiudian.store',
    plugins: [passkeyPlugin],
    fetch: noCacheFetch
  });
};

export const { useSession, signIn, signOut, signUp } = authClient;
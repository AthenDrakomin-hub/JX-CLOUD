
import { createAuthClient } from "better-auth/react";

/**
 * 江西云厨 - 身份验证客户端 (支持 WebAuthn 异步加载)
 * 实现 Vercel 生产环境自适应 URL
 * WebAuthn 插件通过异步加载避免影响首屏性能
 */

const getAuthBaseURL = () => {
    // 优先使用环境变量
    const envUrl = (import.meta as any).env?.VITE_BETTER_AUTH_URL || (process.env as any)?.VITE_BETTER_AUTH_URL;
    if (envUrl) return envUrl;
    
    // 生产环境自动检测
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        // 如果是Vercel部署，使用当前origin
        if (origin.includes('vercel.app')) {
            return origin;
        }
        // 本地开发环境
        return 'http://localhost:3001';
    }
    
    // 服务器端默认值
    return process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'http://localhost:3001';
};

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

// 创建基础认证客户端（不含 WebAuthn）
export const authClient = createAuthClient({
    baseURL: getAuthBaseURL()
});

// 导出带 WebAuthn 功能的认证客户端（按需加载）
export const getEnhancedAuthClient = async () => {
  const passkeyPlugin = await loadPasskeyPlugin();
  return createAuthClient({
    baseURL: getAuthBaseURL(),
    plugins: [passkeyPlugin]
  });
};

export const { useSession, signIn, signOut, signUp } = authClient;
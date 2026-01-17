
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

// 创建基础认证客户端（不含 WebAuthn）
export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : ''
});

// 导出带 WebAuthn 功能的认证客户端（按需加载）
export const getEnhancedAuthClient = async () => {
  const passkeyPlugin = await loadPasskeyPlugin();
  return createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : '',
    plugins: [passkeyPlugin]
  });
};

export const { useSession, signIn, signOut, signUp } = authClient;
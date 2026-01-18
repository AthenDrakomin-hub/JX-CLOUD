import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "@better-auth/passkey/client";
import type { AuthClient as BetterAuthClient } from "better-auth/client";

// ✅ 配置 Passkey 插件
const passkeyPlugin = passkeyClient({
  authenticatorSelection: {
    authenticatorAttachment: "cross-platform",
    residentKey: "preferred",
    userVerification: "preferred"
  },
  rpID: typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname 
    : 'localhost'
});

// ✅ 创建认证客户端
export const authClient = createAuthClient({
  plugins: [passkeyPlugin]
});

// ✅ 导出类型定义（类型安全）
export type AuthClient = BetterAuthClient<{ plugins: [typeof passkeyPlugin] }>;

// ✅ 基础 Passkey 辅助函数
export const signInWithPasskey = (options: { email?: string }) => 
  authClient.signIn.passkey(options);

export const signUpWithPasskey = () => authClient.signUp.passkey();

// 保留原有导出，兼容现有代码
export const { useSession, signIn, signOut: originalSignOut, signUp } = authClient;

// 🔒 安全退出函数，彻底清除所有认证状态
export const safeSignOut = async () => {
  try {
    // 1. 调用 Better Auth 官方退出接口
    await authClient.signOut();
    // 2. 强制清除所有认证相关存储（兜底方案）
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('better-auth.session');
      localStorage.removeItem('better-auth.session');
      localStorage.removeItem('better-auth.user');
      // 清除任何可能的认证相关存储
      Object.keys(localStorage).forEach(key => {
        if (key.includes('better-auth') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('better-auth') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    // 3. 强制跳转到登录页，避免 React 路由状态残留
    // 使用完整的 URL 确保正确重定向
    const loginUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}/auth`
      : '/auth';
    window.location.href = loginUrl;
  } catch (error) {
    console.error('退出登录失败:', error);
    // 即使出错也强制清除状态，避免死锁
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
    }
    const loginUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}/auth`
      : '/auth';
    window.location.href = loginUrl;
  }
};

// ✅ 修复：添加缺失的 getEnhancedAuthClient 函数并正确导出
// 兼容原有异步调用方式，无需修改调用方代码
export const getEnhancedAuthClient = async (): Promise<AuthClient> => {
  // 客户端已同步初始化完成，直接返回实例即可
  return authClient;
};
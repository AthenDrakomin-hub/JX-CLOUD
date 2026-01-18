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
// Better Auth客户端的正确导出方式
export const useSession = () => authClient.useSession();
export const signIn = authClient.signIn;
export const signOut: any = authClient.signOut;
export const signUp = authClient.signUp;

// 🔒 安全退出函数，彻底清除所有认证状态
export const safeSignOut = async () => {
  try {
    // 1. 调用 Better Auth 官方退出接口
    await authClient.signOut();
  } catch (error) {
    console.error('Better Auth 退出接口失败:', error);
    // 即使官方接口失败，也要继续执行清理操作
  }
  
  // 2. 强制清除所有认证相关存储（兜底方案）
  if (typeof window !== 'undefined') {
    try {
      // 清除 Better Auth 相关存储
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
    } catch (error) {
      console.error('清除认证存储失败:', error);
    }
  }
  
  // 3. 立即重定向到登录页，避免 React 状态问题
  const loginUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth`
    : '/auth';
  
  // 直接赋值而不是 replace，确保立即跳转
  window.location.href = loginUrl;
};

// ✅ 修复：添加缺失的 getEnhancedAuthClient 函数并正确导出
// 兼容原有异步调用方式，无需修改调用方代码
export const getEnhancedAuthClient = async (): Promise<AuthClient> => {
  // 客户端已同步初始化完成，直接返回实例即可
  return authClient;
};
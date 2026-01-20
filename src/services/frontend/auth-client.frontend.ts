import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

/**
 * 江西云厨 - 身份验证客户端 (Security Protocol v2.5)
 * 实现 WebAuthn / FIDO2 生物识别优先准入策略
 */

const getAuthBaseURL = () => {
    // 使用 Supabase Edge Functions 作为 Better-Auth 基础URL
    const envUrl = (import.meta as any).env?.VITE_BETTER_AUTH_URL || (process.env as any)?.VITE_BETTER_AUTH_URL;
    if (envUrl) return envUrl;
    
    // 从 VITE_SUPABASE_URL 构建 Better-Auth URL
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (process.env as any)?.VITE_SUPABASE_URL;
    if (supabaseUrl) {
        // 从 Supabase URL 构建对应的 Edge Function URL
        try {
            const urlObj = new URL(supabaseUrl);
            const projectId = urlObj.hostname.split('.')[0]; // 提取项目ID
            return `https://${projectId}.supabase.co/functions/v1/better-auth`;
        } catch (e) {
            console.warn("Could not parse SUPABASE_URL, falling back to default");
        }
    }
    
    // 回退到当前域名
    if (typeof window !== 'undefined') return window.location.origin + '/functions/v1/better-auth';
    return "https://www.jiangxijiudian.store/functions/v1/better-auth";
};

const authClientInternal = createAuthClient({
    baseURL: getAuthBaseURL(),
    plugins: [
        anonymousClient()
    ]
}) as any;

// 导出方法
export const useSession = authClientInternal.useSession;
export const signIn = authClientInternal.signIn;
export const signOut = authClientInternal.signOut;
export const signUp = authClientInternal.signUp;

// 导出内部客户端实例
export default authClientInternal;

/**
 * 生产级安全登出协议
 * 彻底清除 Better-Auth 会话残余及本地持久化标记
 */
export const safeSignOut = async () => {
    try {
        await authClientInternal.signOut;
        // 物理清除敏感存储
        sessionStorage.removeItem('better-auth.session');
        localStorage.removeItem('better-auth.session');
        localStorage.removeItem('jx_root_authority_bypass');
        localStorage.removeItem('jx_bypass_timestamp');
        
        // 强制重定向至准入网关
        window.location.href = '/auth';
    } catch (err) {
        console.error("Critical: SignOut interruption", err);
        window.location.reload();
    }
};
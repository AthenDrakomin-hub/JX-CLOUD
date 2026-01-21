import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

/**
 * 江西云厨 - 身份验证客户端 (Security Protocol v2.5)
 * 实现 WebAuthn / FIDO2 生物识别优先准入策略
 * 优化：针对 Vercel 部署和跨域问题
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

// 配置 fetch 以处理跨域和超时问题
const customFetch = async (url: string, options: RequestInit = {}) => {
    try {
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            // 添加跨域支持
            credentials: 'include',
            headers: {
                ...options.headers,
                // 确保正确的 CORS 头
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });
        
        clearTimeout(timeoutId);
        
        return response;
    } catch (error) {
        if ((error as any).name === 'AbortError') {
            throw new Error(`请求超时: ${url}`);
        }
        throw error;
    }
};

const authClientInternal = createAuthClient({
    baseURL: getAuthBaseURL(),
    plugins: [
        anonymousClient()
    ],
    // 自定义 fetch 实现以处理 Vercel 部署中的网络问题
    fetch: customFetch,
    // 针对亚太地区网络优化的超时设置
    timeout: 30000,
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
        await authClientInternal.signOut();
        // 物理清除敏感存储
        sessionStorage.removeItem('better-auth.session');
        localStorage.removeItem('better-auth.session');
        localStorage.removeItem('jx_root_authority_bypass');
        localStorage.removeItem('jx_bypass_timestamp');
        
        // 强制重定向至准入网关
        window.location.href = '/auth';
    } catch (err) {
        console.error("Critical: SignOut interruption", err);
        // 添加错误处理，确保即使登出失败也能重定向
        window.location.href = '/auth';
    }
};

/**
 * 诊断 BetterAuth 连接
 */
export const diagnoseBetterAuth = async () => {
    const baseUrl = getAuthBaseURL();
    const diagnosis = {
        baseUrl,
        isConfigured: !!baseUrl,
        connectionTest: null as any,
        jwksTest: null as any
    };
    
    try {
        // 测试基础连接
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(baseUrl, {
            method: 'HEAD',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        diagnosis.connectionTest = {
            status: response.status,
            ok: response.ok,
        };
    } catch (error) {
        diagnosis.connectionTest = {
            status: 0,
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    
    // 测试 JWKS 端点
    try {
        const jwksUrl = `${baseUrl}/api/auth/jwks`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(jwksUrl, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        diagnosis.jwksTest = {
            status: response.status,
            ok: response.ok,
            ...(response.ok ? { data: await response.json() } : {})
        };
    } catch (error) {
        diagnosis.jwksTest = {
            status: 0,
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    
    return diagnosis;
};
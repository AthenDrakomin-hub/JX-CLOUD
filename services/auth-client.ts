
import { createAuthClient } from "better-auth/react";
import { passkeyClient, anonymousClient } from "better-auth/client/plugins";

/**
 * 江西云厨 - 身份验证客户端
 * 实现 Vercel 生产环境自适应 URL
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

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
    plugins: [
        passkeyClient(),
        anonymousClient()
    ]
});

export const { useSession, signIn, signOut, signUp } = authClient;
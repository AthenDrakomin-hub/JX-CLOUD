
import { createAuthClient } from "better-auth/react";
import { passkeyClient, anonymousClient } from "better-auth/client/plugins";

/**
 * 江西云厨 - 身份验证客户端
 * 实现 Vercel 生产环境自适应 URL
 */

const getAuthBaseURL = () => {
    const envUrl = (import.meta as any).env?.VITE_BETTER_AUTH_URL || (process.env as any)?.VITE_BETTER_AUTH_URL;
    if (envUrl) return envUrl;
    
    // 如果在浏览器环境且未配置 URL，则使用当前 Origin (Vercel 部署首选方案)
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return "";
};

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
    plugins: [
        passkeyClient(),
        anonymousClient()
    ]
});

export const { useSession, signIn, signOut, signUp } = authClient;

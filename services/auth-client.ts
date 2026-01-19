
import { createAuthClient } from "better-auth/react";
import { passkeyClient, anonymousClient } from "better-auth/client/plugins";

/**
 * 江西云厨 - 身份验证客户端 (Security Protocol v2.5)
 * 实现 WebAuthn / FIDO2 生物识别优先准入策略
 */

const getAuthBaseURL = () => {
    const envUrl = (import.meta as any).env?.VITE_BETTER_AUTH_URL || (process.env as any)?.VITE_BETTER_AUTH_URL;
    if (envUrl) return envUrl;
    if (typeof window !== 'undefined') return window.location.origin;
    return "";
};

// 物理层 Passkey 插件配置：遵循企业级多因素认证标准
const passkeyPlugin = passkeyClient({
    authenticatorSelection: {
        authenticatorAttachment: "cross-platform", // 支持跨设备 (如手机扫码认证 PC)
        residentKey: "preferred",                  // 优先使用驻留密钥 (无需输入账户名)
        userVerification: "preferred"              // 优先进行生物识别验证
    },
    // 动态绑定 RPID 为当前主机名，解决不同子域下的凭证跨域问题
    rpID: typeof window !== 'undefined' ? window.location.hostname : undefined
});

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
    plugins: [
        passkeyPlugin,
        anonymousClient()
    ]
});

/**
 * 生产级安全登出协议
 * 彻底清除 Better-Auth 会话残余及本地持久化标记
 */
export const safeSignOut = async () => {
    try {
        await authClient.signOut();
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

export const { useSession, signIn, signOut, signUp } = authClient;

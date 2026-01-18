import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "@better-auth/passkey/client";

// ✅ 简化初始化 Passkey 插件，使用 any 跳过复杂类型
const passkeyPlugin = passkeyClient();

// ✅ 使用 any 类型跳过复杂类型定义，确保功能可用
export const authClient = createAuthClient({
  plugins: [passkeyPlugin]
}) as any;

// ✅ 简化 Passkey 登录函数，直接调用底层 API
export const signInWithPasskey = async () => {
  try {
    // 尝试登录，这会触发浏览器的指纹/面部识别弹窗
    return await authClient.signIn.passkey();
  } catch (error) {
    console.error("Passkey 登录错误:", error);
    // 统一错误处理
    if (error instanceof Error && (error.message.includes("no credentials") || error.message.includes("No credentials"))) {
      throw new Error("未找到你的生物识别凭证，请先注册");
    }
    throw error;
  }
};

// ✅ 简化 Admin Passkey 注册函数
export const registerAdminPasskey = async (email: string) => {
  try {
    // 使用 signUp.passkey 进行初始化注册
    return await authClient.signUp.passkey({ 
      email: email,
      // 添加用户名作为凭证标识
      username: email.split('@')[0] 
    });
  } catch (error) {
    console.error("Admin Passkey 注册失败:", error);
    throw error;
  }
};

// 保留原有导出，兼容现有代码
export const { useSession, signIn, signOut, signUp } = authClient;
export const getEnhancedAuthClient = async () => authClient;
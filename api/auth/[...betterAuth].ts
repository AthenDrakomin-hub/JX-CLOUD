import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../src/services/db.server.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    // 🔥 核心修正：强制让后端感知到自己在 3000 端口运行
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    
    emailAndPassword: {
        enabled: false
    },
    plugins: [
        // 确保指纹插件已开启
        {
            id: "passkey",
            options: {}
        }
    ],
    // 允许跨域凭证
    trustedOrigins: ["http://localhost:3000"]
});

// 为 Vercel 兼容性导出 HTTP 处理程序
export const { GET, POST, PUT, DELETE } = auth;
export default auth;
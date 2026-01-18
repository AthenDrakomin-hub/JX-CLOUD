import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// 导入数据库连接和认证表
import { db } from "../../src/services/db.server.js";
import { user } from "../../drizzle/schema.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  plugins: [
    passkey({
      rpName: "江西云厨",
      rpID: process.env.NODE_ENV === "production" 
        ? process.env.AUTH_RP_ID || process.env.NEXT_PUBLIC_APP_DOMAIN || "jiangxijiudian.store"
        : "localhost",
      origin: process.env.BETTER_AUTH_URL || "http://localhost:3002"
    })
  ],
  emailAndPassword: { enabled: false }, // 禁用传统密码认证，只使用 Passkey
  social: { enabled: false } // 禁用社交登录
});
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../src/services/db.server.js';
import { user as authUser, session as authSession } from '../../drizzle/schema.js';

/**
 * Better Auth 服务器端配置
 * 使用 Drizzle 适配器连接到 Supabase PostgreSQL 数据库 (连接池模式)
 * 所有用户数据存储在 Supabase 的 public 模式下
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.VERCEL_URL ? 
    `https://${process.env.VERCEL_URL}` : 
    'http://localhost:3001',
  database: drizzleAdapter(db, {
    provider: 'pg', // 明确指定使用 Postgres
    // 映射 Better Auth 默认表到我们定义的表结构（使用标准字段名）
    schema: {
      user: {
        model: authUser,
        fields: {
          id: 'id',
          email: 'email',
          emailVerified: 'emailVerified',
          name: 'name',
          image: 'image',
          role: 'role', // 扩展字段：用户角色
          partnerId: 'partnerId', // 扩展字段：合伙人ID
          modulePermissions: 'modulePermissions', // 扩展字段：模块权限
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
        },
      },
      session: {
        model: authSession,
        fields: {
          id: 'id',
          userId: 'userId',
          expiresAt: 'expiresAt',
          token: 'token',
          ipAddress: 'ipAddress',
          userAgent: 'userAgent',
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
        },
      },
    },
  }),
  socialProviders: {
    // 可选的社交登录提供商
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 根据业务需求调整
  },
  advanced: {
    // 自定义登录页面或其他高级选项
  },
});

// 导出 API 处理程序
export { auth as default };
// api/admin/create-user.ts
import { db } from '../../src/services/db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod'; // 添加 Zod 验证

// 存储临时注册token的内存映射（生产环境建议使用Redis）
const registrationTokens = new Map<string, { userId: string; createdAt: Date; email: string }>();

// 请求体验证 schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().optional(),
  partnerId: z.string().nullable().optional(),
  createdBy: z.string().optional()
});

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析并验证请求体
    const body = await request.json();
    const { email, name, role, partnerId, createdBy } = CreateUserSchema.parse(body);

    // 权限校验：检查请求者是否为管理员
    // 这里需要从前端传递管理员session信息进行验证
    // 简化实现：假设通过请求头传递管理员邮箱
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin email required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证管理员权限
    const adminUser = await db.query.user.findFirst({
      where: and(
        eq(authUser.email, adminEmail),
        eq(authUser.role, 'admin')
      )
    });

    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Not an admin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查用户是否已存在
    const existingUser = await db.query.user.findFirst({
      where: eq(authUser.email, email)
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查目标邮箱是否已存在
    const existingEmailUser = await db.query.user.findFirst({
      where: eq(authUser.email, email)
    });

    if (existingEmailUser) {
      return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成用户ID
    const userId = `user_${Date.now()}_${nanoid(8)}`;

    // 创建认证用户（模拟 Better Auth createUser 调用）
    await db.insert(authUser).values({
      id: userId,
      name: name,
      email: email,
      emailVerified: true,
      image: null,
      role: role || 'user',
      partnerId: partnerId ?? null,
      modulePermissions: null, // 也可以传 {} 但 null 更符合数据库默认值
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 创建业务用户数据
    await db.insert(businessUsers).values({
      id: userId,
      username: email.split('@')[0],
      email: email,
      name: name,
      role: role || 'staff',
      partnerId: partnerId ?? null,
      modulePermissions: null,
      authType: 'passkey',
      emailVerified: true,
      isActive: false,
      isPasskeyBound: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 生成一次性注册token（30分钟有效期）
    const registrationToken = nanoid(32);
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
    
    registrationTokens.set(registrationToken, {
      userId,
      email,
      createdAt: new Date()
    });

    // 清理过期的token（定期清理）
    cleanupExpiredTokens();

    // 生成注册链接
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || 'http://localhost:3002';
    const registrationLink = `${baseUrl}/auth/register-passkey?userId=${userId}&token=${registrationToken}`;

    return new Response(JSON.stringify({
      success: true,
      userId: userId,
      registrationLink: registrationLink,
      message: 'User created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    // 区分验证错误和其他错误
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to create user',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 清理过期token的函数
function cleanupExpiredTokens() {
  const now = new Date();
  for (const [token, data] of registrationTokens.entries()) {
    const expiryTime = new Date(data.createdAt.getTime() + 30 * 60 * 1000);
    if (now > expiryTime) {
      registrationTokens.delete(token);
    }
  }
}

// 导出token验证函数供其他API使用
export function validateRegistrationToken(token: string, email: string): { valid: boolean; userId?: string } {
  const tokenData = registrationTokens.get(token);

  if (!tokenData) {
    return { valid: false };
  }

  // 检查token是否过期
  const expiryTime = new Date(tokenData.createdAt.getTime() + 30 * 60 * 1000);
  if (new Date() > expiryTime) {
    registrationTokens.delete(token); // 删除过期token
    return { valid: false };
  }

  // 检查邮箱是否匹配
  if (tokenData.email !== email) {
    return { valid: false };
  }

  return { valid: true, userId: tokenData.userId };
}
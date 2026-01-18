// api/users/index.ts - 用户管理API端点
import { db } from '../../src/services/db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateUser, hasPartnerAccess, getUserPartnerId } from '../middleware/auth-middleware.js';
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
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 对于创建管理员用户的特殊端点，我们不进行用户认证
  if (request.method === 'POST' && pathname === '/api/admin/create-user') {
    return handleAdminCreateUser(request);
  }
  
  // 对于普通用户操作，需要认证用户
  const currentUser = await authenticateUser(request);
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // GET /api/users - 获取所有用户
    if (request.method === 'GET' && pathname === '/api/users') {
      const requestedPartnerId = url.searchParams.get('partnerId');
      
      // 验证用户是否有权访问请求的partner数据
      if (!hasPartnerAccess(currentUser, requestedPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to access this partner data' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 强制使用partnerId进行过滤，防止跨租户数据访问
      if (!requestedPartnerId) {
        return new Response(JSON.stringify({ error: 'Partner ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const users = await db.select()
        .from(businessUsers)
        .where(eq(businessUsers.partnerId, requestedPartnerId));
      
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/users - 创建用户（普通用户创建，需要认证）
    if (request.method === 'POST' && pathname === '/api/users') {
      const body = await request.json();
      
      // 验证当前用户权限
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to create users' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 确保新用户与当前用户的partnerId关联
      const newUser = await db.insert(businessUsers).values({
        ...body,
        partnerId: currentPartnerId // 强制设置为当前用户的partnerId
      }).returning();
      
      return new Response(JSON.stringify(newUser[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/users/:id - 更新用户
    if (request.method === 'PUT' && pathname.match(/^\/api\/users\/.+$/)) {
      const userId = pathname.split('/')[3]; // /api/users/{id}
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const body = await request.json();
      
      // 获取目标用户的partnerId
      const targetUser = await db.query.users.findFirst({
        where: eq(businessUsers.id, userId)
      });
      
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权更新目标用户
      if (!hasPartnerAccess(currentUser, targetUser.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update this user' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许更新属于当前用户partnerId的用户
      const updatedUsers = await db.update(businessUsers)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(
          eq(businessUsers.id, userId),
          eq(businessUsers.partnerId, getUserPartnerId(currentUser)) // 确保只能更新属于当前partner的用户
        ))
        .returning();
      
      if (updatedUsers.length === 0) {
        return new Response(JSON.stringify({ error: 'User not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedUsers[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE /api/users/:id - 删除用户
    if (request.method === 'DELETE' && pathname.match(/^\/api\/users\/.+$/)) {
      const userId = pathname.split('/')[3]; // /api/users/{id}
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标用户的partnerId
      const targetUser = await db.query.users.findFirst({
        where: eq(businessUsers.id, userId)
      });
      
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权删除目标用户
      if (!hasPartnerAccess(currentUser, targetUser.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to delete this user' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许删除属于当前用户partnerId的用户
      const deletedUsers = await db.delete(businessUsers)
        .where(and(
          eq(businessUsers.id, userId),
          eq(businessUsers.partnerId, getUserPartnerId(currentUser)) // 确保只能删除属于当前partner的用户
        ))
        .returning();
      
      if (deletedUsers.length === 0) {
        return new Response(JSON.stringify({ error: 'User not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Users API error:', error);
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 管理员创建用户的处理函数
async function handleAdminCreateUser(request: Request) {
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
import { db } from '../../src/services/db.server.js';
import { user, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
// @ts-ignore
import { auth } from '../auth/[...betterAuth].js';

export const config = {
  runtime: 'nodejs',
};

// 生产级响应头
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Node': 'Edge-V5'
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/admin/, '');
  
  let session: any = null;
  try {
    // @ts-ignore - Better Auth type recursion is too deep for TS to track
    const sessionResponse = (await auth.api.getSession({
      headers: req.headers,
      request: req,
    })) as any;
    session = sessionResponse;
  } catch (error) {
    console.error('Session verification failed:', error);
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid session' }), 
      { status: 401, headers: corsHeaders }
    );
  }

  // 验证管理员权限
  if (!session || !session.user || session.user.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Admin access required' }), 
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    // 创建新用户 (Admin only)
    if (path === '/users' && req.method === 'POST') {
      const { email, name, role = 'staff', partnerId } = await req.json();

      // 验证输入
      if (!email || !name) {
        return new Response(
          JSON.stringify({ error: 'Email and name are required' }), 
          { status: 400, headers: corsHeaders }
        );
      }

      // 检查邮箱是否已存在
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return new Response(
          JSON.stringify({ error: 'User with this email already exists' }), 
          { status: 409, headers: corsHeaders }
        );
      }

      // 在 Better Auth 的 user 表中创建用户（仅用于认证）
      const userData: any = {
        email,
        name,
        role: role,
        partnerId: partnerId || session.user.partnerId, // 继承创建者的 partnerId
        emailVerified: true, // 管理员创建的用户默认已验证
      };
      const newUser = await db
        .insert(user)
        .values(userData)
        .returning();

      // 同时在业务 users 表中创建记录
      const businessUserData: any = {
        id: newUser[0].id,
        email,
        username: email.split('@')[0], // 使用邮箱用户名部分作为默认用户名
        name,
        role: role,
        partnerId: partnerId || session.user.partnerId,
      };
      await db
        .insert(businessUsers)
        .values(businessUserData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { id: newUser[0].id, email, name, role } 
        }), 
        { status: 201, headers: corsHeaders }
      );
    }

    // 获取用户列表 (Admin only)
    if (path === '/users' && req.method === 'GET') {
      const usersList = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          partnerId: user.partnerId,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.partnerId, session.user.partnerId));

      return new Response(
        JSON.stringify({ users: usersList }), 
        { status: 200, headers: corsHeaders }
      );
    }

    // 更新用户 (Admin only)
    if (path.startsWith('/users/') && req.method === 'PUT') {
      const userId = path.split('/')[2];
      const { role, partnerId } = await req.json();

      // 验证目标用户是否属于当前管理员的合伙人群组
      const targetUser = await db
        .select()
        .from(user)
        .where(and(eq(user.id, userId), eq(user.partnerId, session.user.partnerId)))
        .limit(1);

      if (targetUser.length === 0) {
        return new Response(
          JSON.stringify({ error: 'User not found or unauthorized' }), 
          { status: 404, headers: corsHeaders }
        );
      }

      // 保护role字段：只有admin可以修改role，其他用户只能修改自己的非敏感信息
      const isSelfUpdate = userId === session.user.id;
      const isAdmin = session.user.role === 'admin';
      
      // 如果是自己更新且不是admin，则不允许修改role
      if (isSelfUpdate && !isAdmin && role !== undefined) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Only admin can modify role' }), 
          { status: 403, headers: corsHeaders }
        );
      }

      // 构建更新负载，只包含允许修改的字段
      const updateUserPayload: any = {};
      if (role !== undefined && isAdmin) {
        updateUserPayload.role = role;
      }
      if (partnerId !== undefined && isAdmin) {
        updateUserPayload.partnerId = partnerId;
      }

      // 如果没有允许的字段要更新，则返回错误
      if (Object.keys(updateUserPayload).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }), 
          { status: 400, headers: corsHeaders }
        );
      }

      await db
        .update(user)
        .set(updateUserPayload)
        .where(eq(user.id, userId));

      // 同步更新业务表
      const businessUpdatePayload: any = {};
      if (role !== undefined && isAdmin) {
        businessUpdatePayload.role = role;
      }
      if (partnerId !== undefined && isAdmin) {
        businessUpdatePayload.partnerId = partnerId;
      }
      businessUpdatePayload.updatedAt = new Date();

      if (Object.keys(businessUpdatePayload).length > 0) {
        await db
          .update(businessUsers)
          .set(businessUpdatePayload)
          .where(eq(businessUsers.id, userId));
      }

      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: corsHeaders }
      );
    }

    // 删除用户 (Admin only)
    if (path.startsWith('/users/') && req.method === 'DELETE') {
      const userId = path.split('/')[2];

      // 保护根管理员账户
      const targetUserInfo = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
      if (targetUserInfo.length > 0 && targetUserInfo[0].email === 'athendrakomin@proton.me') {
        return new Response(
          JSON.stringify({ error: 'Cannot delete root administrator account' }), 
          { status: 403, headers: corsHeaders }
        );
      }

      // 验证目标用户是否属于当前管理员的合伙人群组
      const targetUser = await db
        .select()
        .from(user)
        .where(and(eq(user.id, userId), eq(user.partnerId, session.user.partnerId)))
        .limit(1);

      if (targetUser.length === 0) {
        return new Response(
          JSON.stringify({ error: 'User not found or unauthorized' }), 
          { status: 404, headers: corsHeaders }
        );
      }

      await db
        .delete(user)
        .where(eq(user.id, userId));

      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }), 
      { status: 404, headers: corsHeaders }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
    
    return new Response(
      JSON.stringify({ 
        error: 'Server Error', 
        details: errorMessage,
        code: errorCode
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
}
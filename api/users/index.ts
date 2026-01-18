// api/users/index.ts - 用户管理API端点
import { db } from '../../src/services/db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateUser, hasPartnerAccess, getUserPartnerId } from '../middleware/auth-middleware.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  // 认证用户
  const currentUser = await authenticateUser(request);
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  
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
      const users = await db.select()
        .from(businessUsers)
        .where(eq(businessUsers.partnerId, requestedPartnerId));
      
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/users - 创建用户
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
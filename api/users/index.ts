// api/users/index.ts - 用户管理API端点
import { db } from '../../src/services/db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // GET /api/users - 获取所有用户
    if (request.method === 'GET' && pathname === '/api/users') {
      const partnerId = url.searchParams.get('partnerId');
      
      let users;
      if (partnerId) {
        users = await db.query.users.findMany({
          where: eq(businessUsers.partnerId, partnerId)
        });
      } else {
        users = await db.query.users.findMany();
      }
      
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/users - 创建用户
    if (request.method === 'POST' && pathname === '/api/users') {
      const body = await request.json();
      
      // 这里应该调用认证系统的用户创建逻辑
      // 暂时返回成功响应
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'User creation endpoint placeholder' 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/users/:id - 更新用户
    if (request.method === 'PUT') {
      const userId = pathname.split('/')[3]; // /api/users/{id}
      const body = await request.json();
      
      if (userId) {
        await db.update(businessUsers)
          .set({
            ...body,
            updatedAt: new Date()
          })
          .where(eq(businessUsers.id, userId));
          
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // DELETE /api/users/:id - 删除用户
    if (request.method === 'DELETE') {
      const userId = pathname.split('/')[3]; // /api/users/{id}
      
      if (userId) {
        await db.delete(businessUsers).where(eq(businessUsers.id, userId));
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
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
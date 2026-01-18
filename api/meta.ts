// api/meta.ts - 统一的轻量级功能性接口
import { db } from '../src/services/db.server.js';
import { users } from '../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authenticateUser } from './middleware/auth-middleware.js';

export default async function metaApi(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  // 根据原路径分发请求，前端完全不需要修改
  switch (true) {
    case path.endsWith('/health'):
      return Response.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: 'v1.0.0'
      });
    
    case path.endsWith('/db-check'):
      try {
        await db.execute('SELECT 1');
        return Response.json({ 
          db: 'connected', 
          status: 'ok',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({ 
          db: 'disconnected', 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    
    case path.endsWith('/system/status'):
      return Response.json({
        version: 'v4.0.0-PROD',
        uptime: Math.floor(process.uptime()),
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    
    case path.endsWith('/users/joined'):
      // 复用原来的 users/joined.ts 逻辑，保留多租户隔离
      const authResult = await authenticateUser(req);
      if (!authResult) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      try {
        const joinedUsers = await db.select().from(users)
          .where(eq(users.partnerId, authResult.partnerId || ''))
          .orderBy(desc(users.createdAt));
        
        return Response.json(joinedUsers);
      } catch (error) {
        console.error('Joined users query error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch joined users' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    
    default:
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}
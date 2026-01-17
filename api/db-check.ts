
import { db } from '../src/services/db.server.js';
import { users } from '../drizzle/schema.js';
import { sql } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  const start = Date.now();
  
  try {
    // 1. 测试基础连接与延迟 (使用简单查询)
    const connectStart = Date.now();
    const connTest = await db.execute(sql`SELECT 1 as test`);
    const connectTime = Date.now() - connectStart;

    // 2. 测试业务表读取正确性 (users 表)
    const countResult = await db.select({ count: sql`COUNT(*)` }).from(users);
    const userCount = parseInt(countResult[0]?.count || '0');

    const totalTime = Date.now() - start;

    return new Response(
      JSON.stringify({
        status: 'online',
        timestamp: new Date().toISOString(),
        metrics: {
          connect_ms: connectTime,
          query_ms: totalTime - connectTime,
          total_ms: totalTime,
        },
        diagnostics: {
          database_state: 'active',
          user_registry_count: userCount,
          edge_node: process.env.VERCEL_REGION || 'unknown',
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-JX-Diagnostic': 'Passed'
        } 
      }
    );
  } catch (error: any) {
    // 类型收窄/Narrowing - 更优雅的处理方式
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}
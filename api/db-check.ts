// 江西云厨 - 无状态数据库检查API (v4.0.0-STATELESS)
// 完全无状态，使用共享连接池

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
    // 1. 测试基础连接与延迟 (使用共享db实例 - 无状态)
    const connectStart = Date.now();
    const connTest = await db.execute(sql`SELECT 1 as test`);
    const connectTime = Date.now() - connectStart;

    // 2. 测试业务表读取正确性 (users 表 - 使用ORM自动管理连接)
    const countResult = await db.select({ count: sql`COUNT(*)` }).from(users);
    const userCount = parseInt(String(countResult[0]?.count || '0'));

    const totalTime = Date.now() - start;

    // 连接自动归还给池，无需手动处理

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
          version: '4.0.0-STATELESS' // 版本标识
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-JX-Diagnostic': 'Passed',
          'X-API-Version': '4.0.0-STATELESS'
        } 
      }
    );
  } catch (error) {
    // 标准的、类型安全的错误处理
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        version: '4.0.0-STATELESS'
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
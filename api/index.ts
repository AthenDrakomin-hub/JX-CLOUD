
import { db } from '../src/services/db.server.js';
import { systemConfig, orders } from '../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * 江西云厨 - 云端 API 网关 (Vercel Edge Runtime)
 * 安全隔离层：使用 Drizzle ORM 统一数据库操作
 */

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
  const path = url.pathname.replace(/^\/api/, '');

  try {
    // 2. 路由分发
    // 健康检查
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'online', engine: 'JX-Cloud-Edge' }), { status: 200, headers: corsHeaders });
    }

    // 获取系统状态快照 (仅限内网或管理端调用)
    if (path === '/system/status') {
      const config = await db.select().from(systemConfig).where(eq(systemConfig.id, 'global')).limit(1);
      const orderCountResult = await db.select({ count: sql`COUNT(*)` }).from(orders);
      
      return new Response(JSON.stringify({
        hotel: config[0]?.hotelName,
        activeOrders: parseInt(String(orderCountResult[0]?.count || '0')),
        timestamp: new Date().toISOString()
      }), { status: 200, headers: corsHeaders });
    }

    // 安全数据清除 (示例操作)
    if (path === '/maintenance/purge-logs' && req.method === 'POST') {
      // 真实环境下需校验 Admin JWT
      return new Response(JSON.stringify({ message: "Purge protocol standby." }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      error: "Protocol mismatch", 
      message: "API Node reached, but specific endpoint not defined." 
    }), { status: 404, headers: corsHeaders });

  } catch (error) {
    // 标准的、类型安全的错误处理
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN_GATEWAY_ERROR';
    
    return new Response(
      JSON.stringify({ 
        error: 'Gateway Error', 
        details: errorMessage,
        code: errorCode
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
}

import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 云端 API 网关 (Vercel Edge Runtime)
 * 安全隔离层：用于处理需要 Service Role 权限的敏感操作
 */

export const config = {
  runtime: 'edge',
};

// 从环境变量获取核心凭证
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
    // 1. 初始化 Supabase 客户端 (使用 Service Role 绕过 RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. 路由分发
    // 健康检查
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'online', engine: 'JX-Cloud-Edge' }), { status: 200, headers: corsHeaders });
    }

    // 获取系统状态快照 (仅限内网或管理端调用)
    if (path === '/system/status') {
      const { data: config } = await supabase.from('system_config').select('*').single();
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      
      return new Response(JSON.stringify({
        hotel: config?.hotel_name,
        activeOrders: orderCount,
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

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Gateway Error', details: err.message }), { status: 500, headers: corsHeaders });
  }
}

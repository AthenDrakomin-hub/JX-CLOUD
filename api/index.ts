import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 云端 API 网关 (Vercel Edge Runtime)
 * 旧版API网关 - 现已迁移到模块化路由结构
 * 为了向后兼容保留此文件，新的API端点请使用 /api/v1/*
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

  // 重定向到新的API结构
  if (path.startsWith('/v1/')) {
    // 现在 /api/v1/* 路由由 /api/v1/route.ts 处理
    // 返回重定向响应或错误，指示用户使用新端点
    return new Response(JSON.stringify({ 
      error: "API Endpoint Moved", 
      message: "This endpoint has been moved to the new modular structure. Please update your client to use the new API routes.",
      new_routes: [
        "GET /api/v1/config/global",
        "POST /api/v1/orders", 
        "GET /api/v1/rooms/{roomId}/orders",
        "GET /api/v1/payment_configs"
      ]
    }), { status: 301, headers: { ...corsHeaders, 'Location': '/api/v1' } });
  }

  // 保留一些通用端点
  if (path === '/health') {
    return new Response(JSON.stringify({ status: 'online', engine: 'JX-Cloud-Edge' }), { status: 200, headers: corsHeaders });
  }

  if (path === '/system/status') {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: config } = await supabase.from('system_config').select('*').single();
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    return new Response(JSON.stringify({
      hotel: config?.hotel_name,
      activeOrders: orderCount,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ 
    error: "Deprecated Endpoint", 
    message: "This API endpoint is deprecated. Please use the new modular API structure under /api/v1/",
    available_routes: [
      "GET /api/health",
      "GET /api/system/status",
      "New endpoints: See /api/v1/route.ts for v1 endpoints"
    ]
  }), { status: 410, headers: corsHeaders }); // 410 Gone indicates resource is permanently removed
}
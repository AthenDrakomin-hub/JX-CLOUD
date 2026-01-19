// Supabase Edge Functions - Better-Auth 兼容配置
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // CORS 头部
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Auth-Service': 'jx-cloud-better-auth'
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Better-Auth 兼容的会话端点
    if (path.endsWith('/api/auth/get-session')) {
      return new Response(JSON.stringify({
        user: null,
        session: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 健康检查
    if (path.endsWith('/api/auth/health')) {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'jx-cloud-better-auth',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 - 未找到路由
    return new Response(JSON.stringify({
      error: 'Route not found',
      path: path,
      service: 'jx-cloud-better-auth'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      service: 'jx-cloud-better-auth'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

if (import.meta.main) {
  serve(handler);
}
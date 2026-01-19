// Supabase Edge Functions - 重定向到新的API入口点
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Engine': 'Supabase-Edge-V1'
};

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', '');
  const method = req.method;

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 重定向到新的API入口点
  return new Response(JSON.stringify({ 
    message: "API has been relocated to /api/index",
    newPath: "/api/index",
    service: 'jx-cloud-api-redirect'
  }), {
    status: 301,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'Location': '/functions/v1/api/index' 
    }
  });
};

// 兼容Deno serve
if (import.meta.main) {
  serve(handler);
}
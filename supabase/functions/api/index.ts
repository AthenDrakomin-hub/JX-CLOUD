// Supabase Edge Functions - 通用API路由处理器
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS头部配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Engine': 'Supabase-Edge-V1'
};

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', ''); // 移除Edge Functions前缀
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 数据库健康检查
  if (path === '/api/db-check' || path === '/api/health') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      if (!supabaseUrl) throw new Error("Environment Not Ready");

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { count, error } = await supabase.from('user').select('*', { count: 'exact', head: true });
      
      if (error) throw error;

      return new Response(JSON.stringify({
        status: 'online',
        diagnostics: { 
          rls: 'active', 
          registry: count, 
          region: 'edge',
          engine: 'supabase-edge-functions'
        }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: e.message,
        engine: 'supabase-edge-functions'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }

  // 未找到的路由
  return new Response(JSON.stringify({ 
    error: "API Route Not Found",
    path: path,
    engine: 'supabase-edge-functions'
  }), { 
    status: 404, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
};

// 兼容Deno serve
if (import.meta.main) {
  serve(handler);
}
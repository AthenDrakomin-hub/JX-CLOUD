// Supabase Edge Functions - 主API网关
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// CORS配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Engine': 'Supabase-Edge-V1'
};

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', ''); // 移除Edge Functions前缀
  const method = req.method;

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 获取Supabase客户端
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 路由分发
    
    // 1. 健康检查和数据库状态
    if (path === '/api/health' || path === '/api/db-check') {
      const { count, error } = await supabase.from('user').select('*', { count: 'exact', head: true });
      
      if (error) throw error;

      return new Response(JSON.stringify({
        status: 'online',
        service: 'jx-cloud-api-edge',
        diagnostics: { 
          rls: 'active', 
          registry: count, 
          region: 'supabase-edge',
          engine: 'deno'
        }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. 菜品管理API
    if (path === '/api/dishes' && method === 'GET') {
      const { data, error } = await supabase.from('menu_dishes').select('*').order('id');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. 订单管理API
    if (path === '/api/orders' && method === 'GET') {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. 用户管理API
    if (path === '/api/users' && method === 'GET') {
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. 房间状态API
    if (path === '/api/rooms' && method === 'GET') {
      const { data, error } = await supabase.from('rooms').select('*').order('id');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. 类别管理API
    if (path === '/api/categories' && method === 'GET') {
      const { data, error } = await supabase.from('menu_categories').select('*').order('display_order');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. 翻译API
    if (path.startsWith('/api/translations') && method === 'GET') {
      // 这个请求应该被转发到专门的翻译服务
      // 实际上，我们会把翻译API放在单独的文件中 (i18n.ts)
      // 这里只是作为一个fallback
      return new Response(JSON.stringify({ 
        message: "Translation API moved to dedicated service",
        service: 'jx-cloud-api-edge'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404 未找到路由
    return new Response(JSON.stringify({ 
      error: "API route not found",
      path: path,
      method: method,
      service: 'jx-cloud-api-edge'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 错误处理
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-api-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// 兼容Deno serve
if (import.meta.main) {
  serve(handler);
}
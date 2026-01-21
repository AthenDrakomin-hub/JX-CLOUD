// Supabase Edge Functions - API网关
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', '');
  const method = req.method;

  // CORS头部
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-API-Gateway': 'jx-cloud-api-gateway'
  };

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 获取Supabase客户端
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 健康检查
    if (path === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'healthy',
        service: 'jx-cloud-api-gateway',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 数据库连接检查
    if (path === '/api/db-check' && method === 'GET') {
      try {
        const { data, error } = await supabase.rpc('version');
        return new Response(JSON.stringify({
          status: 'connected',
          dbVersion: data,
          service: 'jx-cloud-api-gateway'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (dbError) {
        return new Response(JSON.stringify({
          status: 'disconnected',
          error: dbError.message,
          service: 'jx-cloud-api-gateway'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 系统状态检查
    if (path === '/api/system/status' && method === 'GET') {
      const { data: ordersData } = await supabase.from('orders').select('count', { count: 'exact' });
      const { data: usersData } = await supabase.from('users').select('count', { count: 'exact' });

      return new Response(JSON.stringify({
        status: 'operational',
        stats: {
          totalOrders: ordersData?.length || 0,
          totalUsers: usersData?.length || 0,
          timestamp: new Date().toISOString()
        },
        service: 'jx-cloud-api-gateway'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 配置API
    if (path.startsWith('/api/config/') && method === 'GET') {
      const configKey = path.replace('/api/config/', '');
      // 简单的配置获取逻辑
      return new Response(JSON.stringify({
        key: configKey,
        value: 'default_value',
        service: 'jx-cloud-api-gateway'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 菜品API
    if (path.startsWith('/api/dishes') && method === 'GET') {
      if (path === '/api/dishes') {
        // 获取所有菜品
        const { data, error } = await supabase.from('menu_dishes').select('*');
        if (error) {
          return new Response(JSON.stringify({
            error: 'Failed to fetch dishes',
            service: 'jx-cloud-api-gateway'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(data || []), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 订单API
    if (path.startsWith('/api/orders') && method === 'POST') {
      // 创建订单
      const body = await req.json();
      const { data, error } = await supabase.from('orders').insert(body).select();
      if (error) {
        return new Response(JSON.stringify({
          error: 'Failed to create order',
          message: error.message,
          service: 'jx-cloud-api-gateway'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        order: data[0],
        service: 'jx-cloud-api-gateway'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 用户API
    if (path.startsWith('/api/users') && method === 'GET') {
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch users',
          service: 'jx-cloud-api-gateway'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 供应商API
    if (path.startsWith('/api/partners') && method === 'GET') {
      const { data, error } = await supabase.from('partners').select('*');
      if (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch partners',
          service: 'jx-cloud-api-gateway'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 支出API
    if (path.startsWith('/api/expenses') && method === 'GET') {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch expenses',
          service: 'jx-cloud-api-gateway'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404
    return new Response(JSON.stringify({ 
      error: 'API route not found',
      path: path,
      service: 'jx-cloud-api-gateway'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-api-gateway'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

if (import.meta.main) {
  serve(handler);
}
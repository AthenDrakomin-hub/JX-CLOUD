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

// 注册请求处理器
async function handleRegistrationRequest(req: Request, supabase: any) {
  try {
    const { email, name, requestTime } = await req.json();
    
    if (!email || !name) {
      return new Response(JSON.stringify({ 
        error: 'Email and name are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Response(JSON.stringify({
      success: true,
      requestId,
      message: 'Registration request submitted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process registration request',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 注册审批处理器
async function handleRegistrationApproval(req: Request, supabase: any) {
  try {
    const { requestId } = await req.json();
    
    if (!requestId) {
      return new Response(JSON.stringify({ 
        error: 'Request ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Registration request ${requestId} approved`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to approve registration',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 注册拒绝处理器
async function handleRegistrationRejection(req: Request, supabase: any) {
  try {
    const { requestId, reason } = await req.json();
    
    if (!requestId) {
      return new Response(JSON.stringify({ 
        error: 'Request ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Registration request ${requestId} rejected`,
      reason: reason || 'Admin decision'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to reject registration',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 获取注册请求列表
async function handleGetRegistrationRequests(req: Request, supabase: any) {
  try {
    // 返回空列表（演示用）
    return new Response(JSON.stringify({
      requests: [],
      totalCount: 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch registration requests',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

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
    
    // 1. 注册管理API
    if (path === '/api/auth/request-registration' && method === 'POST') {
      return await handleRegistrationRequest(req, supabase);
    }
    
    if (path === '/api/auth/approve-registration' && method === 'POST') {
      return await handleRegistrationApproval(req, supabase);
    }
    
    if (path === '/api/auth/reject-registration' && method === 'POST') {
      return await handleRegistrationRejection(req, supabase);
    }
    
    if (path === '/api/auth/registration-requests' && method === 'GET') {
      return await handleGetRegistrationRequests(req, supabase);
    }
    
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
      const { data, error } = await supabase.from('users').select('*').order('id'); // 使用id排序，因为name可能为空
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

    // 6. 类别管理API
    if (path === '/api/categories' && method === 'GET') {
      const { data, error } = await supabase.from('menu_categories').select('*').order('display_order');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7. 配料管理API
    if (path === '/api/ingredients' && method === 'GET') {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 8. 合作伙伴管理API
    if (path === '/api/partners' && method === 'GET') {
      const { data, error } = await supabase.from('partners').select('*').order('name');
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 9. 支出管理API
    if (path === '/api/expenses' && method === 'GET') {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 10. 系统配置API
    if (path === '/api/config' && method === 'GET') {
      const { data, error } = await supabase.from('system_config').select('*').single();
      if (error) {
        // 如果没有配置，返回默认值
        if (error.code === 'PGRST116') {
          return new Response(JSON.stringify({
            id: 'global',
            hotelName: '江西云厨酒店',
            version: '8.8.0',
            updatedAt: new Date().toISOString()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }
      
      return new Response(JSON.stringify(data || {}), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 11. 翻译API
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

    // 12. 菜品管理API - POST
    if (path === '/api/dishes' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('menu_dishes').insert(body).select();
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 13. 订单管理API - POST
    if (path === '/api/orders' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('orders').insert(body).select();
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 14. 用户管理API - POST
    if (path === '/api/users' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('users').insert(body).select();
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 15. 配料管理API - POST
    if (path === '/api/ingredients' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('ingredients').insert(body).select();
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 16. 合作伙伴管理API - POST
    if (path === '/api/partners' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('partners').insert(body).select();
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 17. 支出管理API - POST
    if (path === '/api/expenses' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('expenses').insert(body).select();
      if (error) throw error;
      
      return new Response(JSON.stringify(data || []), {
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
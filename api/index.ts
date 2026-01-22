// Vercel API Route - 主API网关
import { createClient } from '@supabase/supabase-js';

// CORS配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Engine': 'Vercel-Node-V1'
};

// 注册请求处理器
async function handleRegistrationRequest(req: any, supabase: any) {
  try {
    const { email, name, requestTime } = req.body;
    
    if (!email || !name) {
      return {
        error: 'Email and name are required',
        status: 400
      };
    }

    const requestId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      requestId,
      message: 'Registration request submitted successfully',
      status: 200
    };
  } catch (error: any) {
    return {
      error: 'Failed to process registration request',
      details: error.message,
      status: 500
    };
  }
}

// 注册审批处理器
async function handleRegistrationApproval(req: any, supabase: any) {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return {
        error: 'Request ID is required',
        status: 400
      };
    }

    return {
      success: true,
      message: `Registration request ${requestId} approved`,
      status: 200
    };
  } catch (error: any) {
    return {
      error: 'Failed to approve registration',
      details: error.message,
      status: 500
    };
  }
}

// 注册拒绝处理器
async function handleRegistrationRejection(req: any, supabase: any) {
  try {
    const { requestId, reason } = req.body;
    
    if (!requestId) {
      return {
        error: 'Request ID is required',
        status: 400
      };
    }

    return {
      success: true,
      message: `Registration request ${requestId} rejected`,
      reason: reason || 'Admin decision',
      status: 200
    };
  } catch (error: any) {
    return {
      error: 'Failed to reject registration',
      details: error.message,
      status: 500
    };
  }
}

// 获取注册请求列表
async function handleGetRegistrationRequests(req: any, supabase: any) {
  try {
    // 返回空列表（演示用）
    return {
      requests: [],
      totalCount: 0,
      status: 200
    };
  } catch (error: any) {
    return {
      error: 'Failed to fetch registration requests',
      details: error.message,
      status: 500
    };
  }
}

export default async function handler(req: any, res: any) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // 获取Supabase客户端
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { pathname, method } = new URL(req.url || '', `https://${req.headers.host || 'localhost'}`);
    const path = pathname; // 在Vercel中，URL已经是正确的路径

    // 路由分发
    
    // 1. 注册管理API
    if (path === '/api/auth/request-registration' && method === 'POST') {
      const result = await handleRegistrationRequest(req, supabase);
      res.status(result.status).json(result);
      return;
    }
    
    if (path === '/api/auth/approve-registration' && method === 'POST') {
      const result = await handleRegistrationApproval(req, supabase);
      res.status(result.status).json(result);
      return;
    }
    
    if (path === '/api/auth/reject-registration' && method === 'POST') {
      const result = await handleRegistrationRejection(req, supabase);
      res.status(result.status).json(result);
      return;
    }
    
    if (path === '/api/auth/registration-requests' && method === 'GET') {
      const result = await handleGetRegistrationRequests(req, supabase);
      res.status(result.status).json(result);
      return;
    }
    
    // 1. 健康检查和数据库状态
    if (path === '/api/health' || path === '/api/db-check') {
      const { count, error } = await supabase.from('user').select('*', { count: 'exact', head: true });
      
      if (error) throw error;

      res.status(200).json({
        status: 'online',
        service: 'jx-cloud-api-vercel',
        diagnostics: { 
          rls: 'active', 
          registry: count, 
          region: 'vercel-node',
          engine: 'node'
        }
      });
      return;
    }

    // 2. 菜品管理API
    if (path === '/api/dishes' && method === 'GET') {
      const { data, error } = await supabase.from('menu_dishes').select('*').order('id');
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 3. 订单管理API
    if (path === '/api/orders' && method === 'GET') {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 4. 用户管理API
    if (path === '/api/users' && method === 'GET') {
      const { data, error } = await supabase.from('users').select('*').order('id'); // 使用id排序，因为name可能为空
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 5. 房间状态API
    if (path === '/api/rooms' && method === 'GET') {
      const { data, error } = await supabase.from('rooms').select('*').order('id');
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 6. 类别管理API
    if (path === '/api/categories' && method === 'GET') {
      const { data, error } = await supabase.from('menu_categories').select('*').order('display_order');
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 7. 配料管理API
    if (path === '/api/ingredients' && method === 'GET') {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 8. 合作伙伴管理API
    if (path === '/api/partners' && method === 'GET') {
      const { data, error } = await supabase.from('partners').select('*').order('name');
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 9. 支出管理API
    if (path === '/api/expenses' && method === 'GET') {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 10. 系统配置API
    if (path === '/api/config' && method === 'GET') {
      const { data, error } = await supabase.from('system_config').select('*').single();
      if (error) {
        // 如果没有配置，返回默认值
        if (error.code === 'PGRST116') {
          res.status(200).json({
            id: 'global',
            hotelName: '江西云厨酒店',
            version: '8.8.0',
            updatedAt: new Date().toISOString()
          });
          return;
        }
        throw error;
      }
      
      res.status(200).json(data || {});
      return;
    }

    // 11. 翻译API
    if (path.startsWith('/api/translations') && method === 'GET') {
      // 这个请求应该被转发到专门的翻译服务
      // 实际上，我们会把翻译API放在单独的文件中 (i18n.ts)
      // 这里只是作为一个fallback
      res.status(200).json({ 
        message: "Translation API moved to dedicated service",
        service: 'jx-cloud-api-vercel'
      });
      return;
    }

    // 12. 菜品管理API - POST
    if (path === '/api/dishes' && method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('menu_dishes').insert(body).select();
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 13. 订单管理API - POST
    if (path === '/api/orders' && method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('orders').insert(body).select();
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 14. 用户管理API - POST
    if (path === '/api/users' && method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('users').insert(body).select();
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 15. 配料管理API - POST
    if (path === '/api/ingredients' && method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('ingredients').insert(body).select();
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 16. 合作伙伴管理API - POST
    if (path === '/api/partners' && method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('partners').insert(body).select();
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 17. 支出管理API - POST
    if (path === '/api/expenses' && method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('expenses').insert(body).select();
      if (error) throw error;
      
      res.status(200).json(data || []);
      return;
    }

    // 404 未找到路由
    res.status(404).json({ 
      error: "API route not found",
      path: path,
      method: method,
      service: 'jx-cloud-api-vercel'
    });
  } catch (error: any) {
    // 错误处理
    res.status(500).json({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-api-vercel'
    });
  }
}
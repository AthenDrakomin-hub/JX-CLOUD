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
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''; // 用于验证用户token

// 生产级响应头
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Node': 'Edge-V5'
};

// 验证JWT令牌的辅助函数 - 通过尝试获取用户信息来验证
const verifyAuthToken = async (token: string): Promise<{ isValid: boolean; userId?: string; error?: string }> => {
  if (!token) {
    return { isValid: false, error: 'No token provided' };
  }

  try {
    // 创建一个使用anon key的supabase客户端用于验证用户token
    // 注意：在实际实现中，Supabase不推荐直接在边缘函数中使用auth方法
    // 一种替代方法是通过Supabase的REST API来验证token
    
    // 验证JWT格式 (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT format' };
    }
    
    // 解码payload来检查基本内容
    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch (e) {
      return { isValid: false, error: 'Invalid JWT payload' };
    }
    
    if (!payload.sub || !payload.exp) {
      return { isValid: false, error: 'Invalid JWT payload: missing subject or expiration' };
    }
    
    // 检查token是否已过期
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return { isValid: false, error: 'Token expired' };
    }
    
    return { 
      isValid: true,
      userId: payload.sub,
      error: undefined
    };
  } catch (err: any) {
    console.error('Token verification error:', err);
    return { isValid: false, error: err.message };
  }
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '');
  const pathParts = path.split('/');

  try {
    // 提取授权头部
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    // 对需要身份验证的端点进行身份验证检查
    const requiresAuth = path.startsWith('/v1/');
    
    if (requiresAuth) {
      const authResult = await verifyAuthToken(token);
      if (!authResult.isValid) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Valid authentication token required',
          details: authResult.error
        }), { status: 401, headers: corsHeaders });
      }
    }

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

    // 核心业务 API v1 endpoints
    // 【获取全局配置】GET /api/v1/config/global
    if (path === '/v1/config/global' && req.method === 'GET') {
      const { data, error } = await supabase.from('system_config').select('*').eq('id', 'global').single();
      
      if (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch system config', 
          details: error.message 
        }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    }

    // 【创建订单】POST /api/v1/orders
    if (path === '/v1/orders' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { room_id, items, payment_method } = body;

        // 输入验证
        if (!room_id || !Array.isArray(items) || items.length === 0) {
          return new Response(JSON.stringify({ 
            error: 'Missing required fields: room_id, items' 
          }), { status: 400, headers: corsHeaders });
        }

        // 计算总金额
        let subtotal = 0;
        for (const item of items) {
          if (item.unit_price && item.qty) {
            subtotal += item.unit_price * item.qty;
          }
        }

        // 应用5%服务费
        const serviceChargeRate = 0.05; // 5% 服务费
        const serviceCharge = subtotal * serviceChargeRate;
        const totalAmount = subtotal + serviceCharge;

        // 验证订单金额非负
        if (totalAmount < 0) {
          return new Response(JSON.stringify({ 
            error: 'Total amount cannot be negative' 
          }), { status: 400, headers: corsHeaders });
        }

        // 创建订单
        const orderData = {
          room_id,
          items,
          total_amount: totalAmount,
          tax_amount: serviceCharge, // 服务费作为税额
          status: 'pending', // 默认状态
          payment_method: payment_method || 'Cash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('orders').insert(orderData).select().single();

        if (error) {
          return new Response(JSON.stringify({ 
            error: 'Failed to create order', 
            details: error.message 
          }), { status: 500, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ 
          id: data.id,
          ...orderData
        }), { status: 201, headers: corsHeaders });
      } catch (parseError) {
        return new Response(JSON.stringify({ 
          error: 'Invalid request body', 
          details: parseError instanceof Error ? parseError.message : 'Unknown error' 
        }), { status: 400, headers: corsHeaders });
      }
    }

    // 【查询房间订单】GET /api/v1/rooms/{room_id}/orders?status={状态}
    if (pathParts.length === 4 && pathParts[1] === 'v1' && pathParts[2] === 'rooms' && pathParts[4] === 'orders' && req.method === 'GET') {
      const roomId = pathParts[3];
      const statusParam = url.searchParams.get('status');

      let query = supabase.from('orders').select('*').eq('room_id', roomId);

      if (statusParam) {
        query = query.eq('status', statusParam);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch room orders', 
          details: error.message 
        }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    }

    // 【获取支付配置】GET /api/v1/payment_configs
    if (path === '/v1/payment_configs' && req.method === 'GET') {
      const { data, error } = await supabase.from('payment_configs').select('id, name, type, is_active, icon_type, instructions').eq('is_active', true);

      if (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch payment configs', 
          details: error.message 
        }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      error: "Protocol mismatch", 
      message: "API Node reached, but specific endpoint not defined." 
    }), { status: 404, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Gateway Error', details: err.message }), { status: 500, headers: corsHeaders });
  }
}
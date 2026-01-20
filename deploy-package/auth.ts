// Supabase Edge Functions - 认证服务
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
    'X-Auth-Service': 'jx-cloud-auth-edge'
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
    // 会话检查
    if (path.endsWith('/session')) {
      // 这里可以添加真实的会话验证逻辑
      return new Response(JSON.stringify({ 
        user: null,
        service: 'jx-cloud-auth-edge',
        status: 'initialized'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取会话端点 (Better-Auth 兼容)
    if (path.endsWith('/get-session')) {
      try {
        // 检查认证头
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({
            message: 'No authorization header provided',
            service: 'jx-cloud-auth-edge'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 简化的会话验证 - 实际应该解析 JWT token
        // 这里返回一个基本的成功响应
        return new Response(JSON.stringify({
          user: {
            id: 'demo-user',
            email: 'demo@example.com',
            name: 'Demo User'
          },
          session: {
            expiresAt: new Date(Date.now() + 3600000).toISOString() // 1小时后过期
          },
          service: 'jx-cloud-auth-edge'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          message: 'Failed to get session',
          error: error.message,
          service: 'jx-cloud-auth-edge'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 健康检查
    if (path.endsWith('/health')) {
      return new Response(JSON.stringify({ 
        status: 'healthy',
        service: 'jx-cloud-auth-edge',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 登录端点（简化版）
    if (path.endsWith('/login') && method === 'POST') {
      const body = await req.json();
      const { email, password } = body;

      // 简化的登录逻辑 - 实际应该使用Supabase Auth
      return new Response(JSON.stringify({
        message: 'Login endpoint ready',
        email: email,
        service: 'jx-cloud-auth-edge'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 注册请求端点
if (path.endsWith('/request-registration') && method === 'POST') {
  const body = await req.json();
  const { email, name } = body;

  try {
    // 检查是否已存在相同邮箱的请求
    const { data: existingRequests } = await supabase
      .from('registration_requests')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending');

    if (existingRequests && existingRequests.length > 0) {
      return new Response(JSON.stringify({
        message: 'Registration request already exists',
        service: 'jx-cloud-auth-edge'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 创建注册请求记录
    const { data, error } = await supabase
      .from('registration_requests')
      .insert({
        email: email,
        name: name,
        status: 'pending',
        request_time: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    // 发送通知给管理员（这里可以集成邮件服务）
    console.log(`New registration request from ${email}`);

    return new Response(JSON.stringify({
      message: 'Registration request submitted successfully',
      requestId: data[0].id,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      message: 'Failed to submit registration request',
      error: error.message,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 管理员审核端点
if (path.endsWith('/approve-registration') && method === 'POST') {
  const body = await req.json();
  const { requestId } = body;

  try {
    // 验证管理员权限（这里应该检查JWT token）
    // const adminVerified = await verifyAdminToken(req.headers.get('Authorization'));
    // if (!adminVerified) {
    //   return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    // }

    // 获取请求详情
    const { data: request } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) {
      return new Response(JSON.stringify({
        message: 'Registration request not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 更新请求状态为已批准
    const { error: updateError } = await supabase
      .from('registration_requests')
      .update({ 
        status: 'approved',
        approved_time: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 创建实际用户账户（使用Better Auth）
    // 这里应该调用Better Auth的用户创建API
    console.log(`Approved registration for ${request.email}`);

    return new Response(JSON.stringify({
      message: 'Registration approved successfully',
      service: 'jx-cloud-auth-edge'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      message: 'Failed to approve registration',
      error: error.message,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 拒绝注册请求
if (path.endsWith('/reject-registration') && method === 'POST') {
  const body = await req.json();
  const { requestId, reason } = body;

  try {
    const { error } = await supabase
      .from('registration_requests')
      .update({ 
        status: 'rejected',
        rejected_time: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', requestId);

    if (error) throw error;

    return new Response(JSON.stringify({
      message: 'Registration rejected successfully',
      service: 'jx-cloud-auth-edge'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      message: 'Failed to reject registration',
      error: error.message,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 获取注册请求列表（管理员专用）
if (path.endsWith('/registration-requests') && method === 'GET') {
  try {
    // 验证管理员权限
    // const adminVerified = await verifyAdminToken(req.headers.get('Authorization'));
    // if (!adminVerified) {
    //   return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    // }

    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .order('request_time', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      message: 'Failed to fetch registration requests',
      error: error.message,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

    // 404
    return new Response(JSON.stringify({ 
      error: 'Auth route not found',
      path: path,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

if (import.meta.main) {
  serve(handler);
}
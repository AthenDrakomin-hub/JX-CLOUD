// Vercel API Route - 认证服务
import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method; // 从 req 对象获取方法，而不是 URL 对象
    
    // CORS头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Auth-Service': 'jx-cloud-auth-vercel'
    };

    // 会话检查
    if (pathname.endsWith('/session')) {
      return res.status(200).json({ 
        user: null,
        service: 'jx-cloud-auth-vercel',
        status: 'initialized'
      });
    }

    // 获取会话端点 (Better-Auth 兼容)
    if (pathname.endsWith('/get-session')) {
      try {
        // 检查认证头
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({
            message: 'No authorization header provided',
            service: 'jx-cloud-auth-vercel'
          });
        }

        // 简化的会话验证 - 实际应该解析 JWT token
        return res.status(200).json({
          user: {
            id: 'demo-user',
            email: 'demo@example.com',
            name: 'Demo User'
          },
          session: {
            expiresAt: new Date(Date.now() + 3600000).toISOString() // 1小时后过期
          },
          service: 'jx-cloud-auth-vercel'
        });
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to get session',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // 健康检查
    if (pathname.endsWith('/health')) {
      return res.status(200).json({ 
        status: 'healthy',
        service: 'jx-cloud-auth-vercel',
        timestamp: new Date().toISOString()
      });
    }

    // 登录端点（简化版）
    if (pathname.endsWith('/login') && method === 'POST') {
      const { email, password } = req.body;

      // 简化的登录逻辑 - 实际应该使用Supabase Auth
      return res.status(200).json({
        message: 'Login endpoint ready',
        email: email,
        service: 'jx-cloud-auth-vercel'
      });
    }

    // Passkey 登录端点 - 代理到BetterAuth
    if (pathname.includes('/sign-in/passkey')) {
      try {
        // 构建BetterAuth端点URL - 移除/auth前缀，只保留基础认证路径
        const basePath = pathname.replace('/auth', '');
        const betterAuthEndpoint = `${process.env.BETTER_AUTH_URL || `${process.env.VERCEL_URL ? 'https://' : 'http://'}${process.env.VERCEL_URL || 'localhost:3000'}`}${basePath}`;
        
        // 代理请求到BetterAuth
        const response = await fetch(betterAuthEndpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...req.headers,
          },
          body: req.body ? JSON.stringify(req.body) : undefined
        });

        const responseText = await response.text();
        
        res.status(response.status).json(JSON.parse(responseText));
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to process passkey sign-in',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // Passkey 相关的所有端点都代理到BetterAuth
    if (pathname.includes('/passkey') || pathname.includes('/webauthn')) {
      try {
        // 构建BetterAuth端点URL - 移除/auth前缀，只保留基础认证路径
        const basePath = pathname.replace('/auth', '');
        const betterAuthEndpoint = `${process.env.BETTER_AUTH_URL || `${process.env.VERCEL_URL ? 'https://' : 'http://'}${process.env.VERCEL_URL || 'localhost:3000'}`}${basePath}`;
        
        // 代理请求到BetterAuth
        const response = await fetch(betterAuthEndpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...req.headers,
          },
          body: req.body ? JSON.stringify(req.body) : undefined
        });

        const responseText = await response.text();
        
        res.status(response.status).json(JSON.parse(responseText));
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to process passkey request',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // 注册请求端点
    if (pathname.endsWith('/request-registration') && method === 'POST') {
      const { email, name } = req.body;

      try {
        // 检查是否已存在相同邮箱的请求
        const { data: existingRequests } = await supabase
          .from('registration_requests')
          .select('id')
          .eq('email', email)
          .eq('status', 'pending');

        if (existingRequests && existingRequests.length > 0) {
          return res.status(409).json({
            message: 'Registration request already exists',
            service: 'jx-cloud-auth-vercel'
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

        return res.status(200).json({
          message: 'Registration request submitted successfully',
          requestId: data[0].id,
          service: 'jx-cloud-auth-vercel'
        });
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to submit registration request',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // 管理员审核端点
    if (pathname.endsWith('/approve-registration') && method === 'POST') {
      const { requestId } = req.body;

      try {
        // 获取请求详情
        const { data: request } = await supabase
          .from('registration_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (!request) {
          return res.status(404).json({
            message: 'Registration request not found'
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

        return res.status(200).json({
          message: 'Registration approved successfully',
          service: 'jx-cloud-auth-vercel'
        });
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to approve registration',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // 拒绝注册请求
    if (pathname.endsWith('/reject-registration') && method === 'POST') {
      const { requestId, reason } = req.body;

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

        return res.status(200).json({
          message: 'Registration rejected successfully',
          service: 'jx-cloud-auth-vercel'
        });
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to reject registration',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // 获取注册请求列表（管理员专用）
    if (pathname.endsWith('/registration-requests') && method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('registration_requests')
          .select('*')
          .order('request_time', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data || []);
      } catch (error: any) {
        return res.status(500).json({
          message: 'Failed to fetch registration requests',
          error: error.message,
          service: 'jx-cloud-auth-vercel'
        });
      }
    }

    // 404
    return res.status(404).json({ 
      error: 'Auth route not found',
      path: pathname,
      service: 'jx-cloud-auth-vercel'
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-auth-vercel'
    });
  }
}
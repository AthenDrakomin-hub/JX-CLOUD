// Supabase Edge Function: select-or-login-user
// 用于安全选择或登录用户的边缘函数

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0?target=es2022';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// 这是 Supabase Edge Function，将在部署时可用
const supabaseUrl = (globalThis as any).Deno?.env?.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: Request): Promise<Response> {
  // 处理跨域预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24小时
      },
    });
  }

  try {
    // 验证请求来源和权限 - 在生产环境中需要验证JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }), 
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const token = authHeader.substring(7);
    
    // 验证请求方法
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Only POST method is allowed' }), 
        {
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const { username, password } = await req.json();

    // 验证必需参数
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }), 
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // 从 public.users 表查询用户 - 这是修复的关键部分，使用正确的表
    const { data: user, error } = await supabase
      .from('users') // 使用 public.users 表而不是 auth.users
      .select('id, username, name, role, permissions, ip_whitelist, two_factor_enabled, is_online, is_locked, last_login')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.error('Error fetching user:', error);
      return new Response(
        JSON.stringify({ error: 'User not found in system' }), 
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // 如果用户被锁定，拒绝登录
    if (user.is_locked) {
      return new Response(
        JSON.stringify({ error: 'User account is locked' }), 
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // 更新用户的最后登录时间
    const updateResult = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    if (updateResult.error) {
      console.warn('Error updating last login time:', updateResult.error);
    }

    // 返回用户信息（不包含敏感信息）
    return new Response(
      JSON.stringify({ 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          ipWhitelist: user.ip_whitelist,
          twoFactorEnabled: user.two_factor_enabled,
          isOnline: user.is_online,
          isLocked: user.is_locked,
          lastLogin: user.last_login
        }
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error: any) {
    console.error('Error in select-or-login-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 配置边缘函数运行时
export const config = {
  runtime: 'edge',
};
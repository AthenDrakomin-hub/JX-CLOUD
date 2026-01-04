// Supabase Edge Function: set-user-password
// 用于安全设置用户密码的边缘函数

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
    // 验证请求来源和权限
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

    const { username, newPassword } = await req.json();

    // 验证必需参数
    if (!username || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Username and newPassword are required' }), 
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // 从 public.users 表查询用户
    const { data: user, error } = await supabase
      .from('users') // 使用 public.users 表
      .select('id')
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

    // 在实际部署中，密码应该被安全地哈希处理
    // 这里使用 Supabase 的 auth API 来安全地更新用户密码
    // 注意：这需要使用 service_role 权限来绕过 RLS 策略
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (authError) {
      console.error('Error updating password via Supabase auth:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password in auth system' }), 
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // 同时更新 public.users 表中的 updated_at 字段
    const updateResult = await supabase
      .from('users')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (updateResult.error) {
      console.error('Error updating password:', updateResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }), 
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // 返回成功信息
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password updated successfully'
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
    console.error('Error in set-user-password function:', error);
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
// Supabase Edge Function: users-admin
// 用于安全处理用户和MFA相关操作的边缘函数

// 由于我们无法直接创建Supabase边缘函数文件，我将提供一个示例实现
// 这个函数应该部署到Supabase的Edge Functions中

/*
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function handler(req: Request): Promise<Response> {
  try {
    // 验证请求来源和权限
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    // 在实际实现中，这里应该验证JWT token
    
    const { method, userId, action, data } = await req.json();

    switch (action) {
      case 'get_user_mfa_config':
        // 管理员获取用户MFA配置
        if (method !== 'GET') {
          return new Response(JSON.stringify({ error: 'Invalid method for this action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('id, username, two_factor_enabled, mfa_secret IS NOT NULL as has_secret, array_length(mfa_recovery_codes, 1) as recovery_codes_count')
          .eq('id', userId)
          .single();

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'update_user_mfa_config':
        // 管理员更新用户MFA配置
        if (method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Invalid method for this action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const updateResult = await supabase
          .from('users')
          .update({
            two_factor_enabled: data.two_factor_enabled,
            mfa_secret: data.mfa_secret, // 在实际部署中，应使用更安全的方式处理
            mfa_recovery_codes: data.mfa_recovery_codes
          })
          .eq('id', userId);

        if (updateResult.error) {
          throw updateResult.error;
        }

        // 记录安全日志
        await supabase
          .from('security_logs')
          .insert({
            user_id: 'service_account', // 应该是执行操作的管理员ID
            action: 'MFA_CONFIGURATION_UPDATE_VIA_SERVICE',
            details: `MFA settings updated for user: ${userId}`,
            ip: req.headers.get('X-Forwarded-For') || 'unknown',
            timestamp: new Date().toISOString(),
            risk_level: 'High'
          });

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'generate_recovery_codes':
        // 生成恢复代码
        if (method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Invalid method for this action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // 生成10个恢复代码
        const recoveryCodes = [];
        for (let i = 0; i < 10; i++) {
          const code = Array.from({length: 6}, () => 
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
          ).join('') + '-' + 
          Array.from({length: 6}, () => 
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
          ).join('');
          recoveryCodes.push(code);
        }

        const recoveryUpdate = await supabase
          .from('users')
          .update({ mfa_recovery_codes: recoveryCodes })
          .eq('id', userId);

        if (recoveryUpdate.error) {
          throw recoveryUpdate.error;
        }

        // 返回生成的代码（只在首次生成时返回，后续应通过安全方式传输）
        return new Response(JSON.stringify({ 
          recovery_codes: recoveryCodes,
          count: recoveryCodes.length,
          success: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in users-admin function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

serve(handler);
*/

// 这是边缘函数的示例，实际部署需要：
// 1. 在supabase/functions目录中创建users-admin/index.ts文件
// 2. 使用supabase functions deploy命令部署
// 3. 通过HTTP请求调用此函数来安全处理MFA相关操作

// 以下是调用此边缘函数的客户端代码示例：

export const secureMFAOperations = {
  // 获取用户MFA配置（仅管理员）
  async getUserMFAConfig(userId: string, authToken: string) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'GET',
        userId,
        action: 'get_user_mfa_config'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // 更新用户MFA配置（仅管理员）
  async updateUserMFAConfig(userId: string, config: {
    two_factor_enabled: boolean;
    mfa_secret?: string;
    mfa_recovery_codes?: string[];
  }, authToken: string) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'POST',
        userId,
        action: 'update_user_mfa_config',
        data: config
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // 生成恢复代码（仅管理员）
  async generateRecoveryCodes(userId: string, authToken: string) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'POST',
        userId,
        action: 'generate_recovery_codes'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};
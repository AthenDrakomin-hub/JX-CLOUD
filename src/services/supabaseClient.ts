
import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 核心接入引擎 (Vercel 部署优化版)
 * 兼容性：支持 Vercel 自动注入的环境变量
 * 优化：针对亚太地区网络延迟和跨域问题进行调整
 */

// 尝试从 Vite 特有的 import.meta.env 或 Node 风格的 process.env 读取
// 优先级：VITE_ 前缀 (开发) -> 自动注入变量 (Vercel)
const getEnv = (key: string) => {
  return (import.meta as any).env?.[`VITE_${key}`] || 
         (import.meta as any).env?.[key] ||
         (process.env as any)[`VITE_${key}`] || 
         (process.env as any)[key] || 
         '';
};

export const supabaseUrl = getEnv('SUPABASE_URL');
export const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// 演示模式探测
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined';

// 创建 Supabase 客户端，针对 Vercel 部署进行优化
export const supabase = isDemoMode 
  ? null as any 
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      // 针对亚太地区节点的网络优化
      realtime: {
        params: {
          // 增加心跳间隔以适应网络波动
          heartbeatIntervalMs: 30000,
          // 增加超时时间以应对网络延迟
          timeout: 60000,
        },
      }
    });

export const ADMIN_CREDENTIALS = { email: 'athendrakomin@proton.me' };
export const STAFF_CREDENTIALS = { id: 'staff_user' };

/**
 * 诊断工具 - 增强版，支持 Vercel 环境检测
 */
export const getConnectionStatus = async () => {
  if (isDemoMode) return { ok: false, msg: '环境检测失败：未探测到 SUPABASE_URL。请确保 Vercel 关联已完成。' };
  
  try {
    // 增加重试机制以应对网络不稳定
    const { data, error } = await supabase
      .from('system_config')
      .select('id')
      .limit(1)
      .throwOnError();
    
    if (error) return { ok: false, msg: error.message, code: error.code };
    return { ok: true, msg: '云端链路已激活 (Connected to Supabase)', hasData: true };
  } catch (e: any) {
    console.error('Supabase 连接错误详情:', e);
    return { ok: false, msg: `连接异常: ${e.message || '未知错误'}`, error: e };
  }
};

/**
 * 网络诊断工具 - 专门用于 Vercel 部署问题排查
 */
export const diagnoseConnection = async () => {
  const diagnosis: any = {
    supabaseUrl: supabaseUrl || '未配置',
    supabaseAnonKey: supabaseAnonKey ? '[已配置]' : '未配置',
    isDemoMode,
    vercelEnvironment: typeof window !== 'undefined' ? false : !!process.env.VERCEL,
    runtime: typeof window !== 'undefined' ? 'browser' : 'server'
  };
  
  if (!isDemoMode) {
    try {
      // 测试基本连接
      const pingResult = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      
      diagnosis.pingStatus = pingResult.status;
      diagnosis.pingOk = pingResult.ok;
    } catch (e) {
      diagnosis.pingError = e instanceof Error ? e.message : '未知错误';
    }
  }
  
  return diagnosis;
};

// 2. 验证生产环境请求
export async function checkSupabaseConnection() {
  if (isDemoMode) return { success: false, error: new Error('演示模式下不进行真实连接检查') };
  
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Supabase 生产环境连接失败：', error);
    return { success: false, error };
  }
}
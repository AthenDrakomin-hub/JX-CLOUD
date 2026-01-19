
import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 核心接入引擎 (Vercel 部署优化版)
 * 兼容性：支持 Vercel 自动注入的环境变量
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

export const supabase = isDemoMode 
  ? null as any 
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });

export const ADMIN_CREDENTIALS = { email: 'athendrakomin@proton.me' };
export const STAFF_CREDENTIALS = { id: 'staff_user' };

/**
 * 诊断工具
 */
export const getConnectionStatus = async () => {
  if (isDemoMode) return { ok: false, msg: '环境检测失败：未探测到 SUPABASE_URL。请确保 Vercel 关联已完成。' };
  try {
    const { data, error } = await supabase.from('system_config').select('id').limit(1);
    if (error) return { ok: false, msg: error.message, code: error.code };
    return { ok: true, msg: '云端链路已激活 (Connected to Supabase)', hasData: true };
  } catch (e: any) {
    return { ok: false, msg: '连接异常: ' + e.message };
  }
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
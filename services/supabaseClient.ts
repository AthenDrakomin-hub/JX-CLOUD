
import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 云端集成引擎 (Vercel & Vite Production Optimized)
 * V5.6 - 增强型环境变量探测
 */

// 尝试从不同的全局作用域获取环境变量
const getEnv = (key: string): string => {
  const metaEnv = (import.meta as any).env || {};
  const procEnv = (typeof process !== 'undefined' ? process.env : {}) || {};
  // 按照优先级探测变量名
  return metaEnv[key] || metaEnv[`VITE_${key}`] || procEnv[key] || procEnv[`VITE_${key}`] || '';
};

const SUPABASE_URL = getEnv('PROJECT_URL') || getEnv('SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY'); // 仅使用 anon key，绝不能使用 service_role key

export const supabaseUrl = SUPABASE_URL;
export const isDemoMode = !SUPABASE_URL || !SUPABASE_KEY;

// 初始化客户端
export const supabase = isDemoMode 
  ? null as any 
  : createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 'x-application-name': 'jx-cloud-v5-enterprise' }
      }
    });

if (isDemoMode) {
  console.warn('⚠️ JX-CLOUD: 未检测到有效的 Supabase 配置，系统运行在演示模式。');
  console.info('提示：请检查 .env 文件中的变量名是否为 VITE_PROJECT_URL 和 VITE_SUPABASE_ANON_KEY');
} else {
  console.log('✅ JX-CLOUD: 已成功识别环境配置 - ' + (SUPABASE_URL ? new URL(SUPABASE_URL).hostname : 'unknown'));
}
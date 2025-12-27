import { createClient } from '@supabase/supabase-js';

/**
 * 跨环境获取环境变量
 * 优先支持 Vercel 生产环境注入
 */
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  if (typeof window !== 'undefined' && (window as any)._env_?.[key]) return (window as any)._env_[key];
  // 生产环境 VITE_ 前缀环境变量通过 import.meta.env 获取
  if (typeof window !== 'undefined' && (window as any).__ENV__?.[key]) return (window as any).__ENV__[key];
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

const isValidUrl = (url: string) => {
  try { return url && new URL(url).protocol.startsWith('http'); } catch { return false; }
};

const isPlaceholder = !isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key';

// 导出演示模式标志
export const isDemoMode = isPlaceholder;

const finalUrl = isPlaceholder ? 'https://placeholder-project.supabase.co' : supabaseUrl;
const finalKey = isPlaceholder ? 'placeholder-anon-key' : supabaseAnonKey;

// 创建客户端
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    flowType: 'pkce',
    persistSession: false
  }
});

// 部署状态自检
if (isPlaceholder) {
  console.group('🚀 JX Cloud 部署提醒');
  console.warn('状态: [演示模式]');
  console.info('原因: 未检测到有效的 Supabase 环境变量。');
  console.info('解决: 请在 Vercel Settings -> Environment Variables 中添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
  console.groupEnd();
} else {
  console.log('✅ 江西云厨: 生产环境网关已锁定，安全通信链已建立。');
}

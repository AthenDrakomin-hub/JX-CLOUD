
import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 核心接入引擎 (Vercel 部署优化版)
 * 兼容性：支持 Vercel 自动注入的环境变量
 * 注意：此模块现在仅用于 Supabase 实时功能和认证，数据库操作已迁移到 Drizzle
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

// 演示模式探测 - 仅用于实时功能
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined';

// 强制检查数据库连接字符串
const isProductionDB = !!process.env.POSTGRES_URL;

if (isProductionDB) {
  console.log("🚀 生产数据库已就绪，正在关闭 Demo 模式...");
  // 注意：数据库操作已迁移到 Drizzle，此标记仅用于实时功能
} else {
  console.warn("⚠️ 未检测到 POSTGRES_URL，系统进入演示模式。");
}

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
 * 诊断工具 - 仅用于实时功能
 */
export const getConnectionStatus = async () => {
  if (isDemoMode) return { ok: false, msg: '环境检测失败：未探测到 SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY。本地开发请确保 .env 文件已正确配置。' };
  try {
    // 尝试连接到 Supabase 进行实时功能测试
    // 注意：数据库查询已迁移到 Drizzle，这里只测试连接性
    const { data, error } = await supabase.rpc('version'); // 使用一个简单的RPC调用来测试连接
    if (error) return { ok: false, msg: error.message, code: error.code };
    return { ok: true, msg: '云端链路已激活 (Connected to Supabase)', hasData: true };
  } catch (e: any) {
    return { ok: false, msg: '连接异常: ' + e.message };
  }
};
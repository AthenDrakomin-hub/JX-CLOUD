
import { createClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 云端集成引擎 (Vercel & Vite Production Optimized)
 * V5.6 - 增强型环境变量探测
 */

// 尝試從不同的全局作用域獲取環境變量，兼容更多部署環境
const getEnv = (key: string): string => {
  // 瀏覽器環境中的全局變量
  const globalEnv = typeof window !== 'undefined' ? (window as any).__ENV__ || {} : {};
  
  // Vite 環境變量
  const metaEnv = (import.meta as any).env || {};
  
  // Node.js 環境變量
  const procEnv = (typeof process !== 'undefined' ? process.env : {}) || {};
  
  // 瀏覽器存儲中的環境變量（作為最後備選）
  let storageEnv = {};
  if (typeof localStorage !== 'undefined') {
    try {
      const storedEnv = localStorage.getItem('jx_env');
      if (storedEnv) {
        storageEnv = JSON.parse(storedEnv);
      }
    } catch (e) {
      // 忽略存儲錯誤
    }
  }
  
  // 按優先級順序查找環境變量
  return (
    // 瀏覽器全局變量
    globalEnv[key] || 
    globalEnv[`VITE_${key}`] || 
    globalEnv[key.toUpperCase()] || 
    globalEnv[`VITE_${key.toUpperCase()}`] ||
    
    // Vite 環境變量
    metaEnv[key] || 
    metaEnv[`VITE_${key}`] || 
    metaEnv[key.toUpperCase()] || 
    metaEnv[`VITE_${key.toUpperCase()}`] ||
    
    // Node.js 環境變量
    procEnv[key] || 
    procEnv[`VITE_${key}`] || 
    procEnv[key.toUpperCase()] || 
    procEnv[`VITE_${key.toUpperCase()}`] ||
    
    // 瀏覽器存儲
    (storageEnv as any)[key] || 
    (storageEnv as any)[`VITE_${key}`] || 
    (storageEnv as any)[key.toUpperCase()] || 
    (storageEnv as any)[`VITE_${key.toUpperCase()}`] ||
    
    // 默認值
    ''
  );
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * 江西云厨 - 云端集成引擎
 * 自动检测 Vite 或 Vercel 环境注入的凭据
 */

// 兼容多种环境变量命名方式
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (window as any).process?.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (window as any).process?.env?.VITE_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

// 初始化 Supabase 客户端
export const supabase = isDemoMode 
  ? {
      from: (table: string) => ({
        select: () => ({ 
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        insert: (data: any) => Promise.resolve({ data, error: null }),
        upsert: (data: any) => Promise.resolve({ data, error: null }),
        update: (data: any) => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        on: () => ({ subscribe: () => {} })
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: { user: {} }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      storage: {
        from: () => ({ upload: () => Promise.resolve({ data: null, error: null }) })
      },
      channel: () => ({ on: () => ({ subscribe: () => {} }) })
    }
  : createClient(supabaseUrl, supabaseAnonKey);

if (isDemoMode) {
  console.warn('⚠️ JX CLOUD: 处于[离线演示模式]，请在 Vercel 环境变量中配置 VITE_SUPABASE_URL。');
} else {
  console.log('🚀 JX CLOUD: 已成功连接到 [Supabase 云端生产数据库]。');
}

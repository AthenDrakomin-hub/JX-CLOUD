
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * 江西云厨 - 云端集成引擎 (Vercel & Edge Optimized)
 * 采用 NEXT_PUBLIC 命名规范，支持 Vercel Environment Variables
 */

const getEnv = (key: string) => {
  return (import.meta as any).env?.[`VITE_${key}`] 
    || (window as any).process?.env?.[`NEXT_PUBLIC_${key}`]
    || (window as any).process?.env?.[key];
};

export const supabaseUrl = getEnv('SUPABASE_URL') || 'https://zlbemopcgjohrnyyiwvs.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Njg5MzksImV4cCI6MjA4MTQ0NDkzOX0.vsV-Tkt09tlMN5EmYdRm_x_YI6oNL4otkVwEjqtji6g';

// In production mode only
const isDemoMode = false;
export { isDemoMode };

// 初始化客户端，针对 Vercel Serverless 环境优化 fetch 行为
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: { 'x-application-name': 'jx-cloud-v3' }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

console.log('🔗 JX-CLOUD: 已挂载生产级云端路由: zlbemopcgjohrnyyiwvs');
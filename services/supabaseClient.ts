/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

// 初始化客户端，针对 Vercel Serverless 环境优化 fetch 行为
export const supabase = isDemoMode 
  ? null as any 
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 
          'x-application-name': 'jx-cloud-v3',
          // 添加请求拦截器来处理会话问题
          ...(() => {
            const token = localStorage.getItem('supabase.auth.token');
            if (token) {
              try {
                const tokenObj = JSON.parse(token);
                const accessToken = tokenObj?.currentSession?.access_token;
                if (accessToken) {
                  return { 'Authorization': `Bearer ${accessToken}` };
                }
              } catch (e) {
                console.warn('Failed to parse stored token:', e);
              }
            }
            return {};
          })()
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

if (!isDemoMode) {
  console.log('🔗 JX-CLOUD: 已挂载生产级云端路由: zlbemopcgjohrnyyiwvs');
}

// 会话管理辅助函数
export const getStoredSession = () => {
  try {
    const sessionData = localStorage.getItem('supabase.auth.token');
    if (sessionData) {
      const sessionObj = JSON.parse(sessionData);
      return sessionObj?.currentSession || null;
    }
  } catch (e) {
    console.warn('Failed to get stored session:', e);
  }
  return null;
};

// 检查会话是否有效
export const isValidSession = (session: any) => {
  if (!session || !session.access_token) return false;
  
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (e) {
    console.warn('Failed to validate session:', e);
    return false;
  }
};
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { isDemoMode } from './supabaseClient';

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
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY'); // 仅使用 anon key，绝不能使用 service_role key

console.log("ENHANCED DEBUG: getEnv('PROJECT_URL') returned:", getEnv('PROJECT_URL'));
console.log("ENHANCED DEBUG: getEnv('SUPABASE_URL') returned:", getEnv('SUPABASE_URL'));
console.log("ENHANCED DEBUG: Final SUPABASE_URL used:", SUPABASE_URL);
console.log("ENHANCED DEBUG: Final SUPABASE_ANON_KEY used (first 5 chars):", SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 5) : "N/A");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase env vars SUPABASE_URL or SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 小助手函数：从会话获取认证头
export function getAuthHeaderFromSession(session: Session | null) {
  if (!session?.access_token) return null;
  return `Bearer ${session.access_token}`;
}

// 刷新会话（如果需要）
export async function refreshSessionIfNeeded() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // 如果访问令牌即将过期（在5分钟内），尝试刷新
  if (session?.expires_at) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = session.expires_at - currentTime;
    
    // 如果令牌将在5分钟内过期，则刷新
    if (timeUntilExpiry < 300) {
      const refreshToken = session.refresh_token;
      if (refreshToken) {
        try {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Failed to refresh session:', error);
            return session; // 返回原会话
          }
          
          return data.session;
        } catch (refreshError) {
          console.error('Error during session refresh:', refreshError);
          return session; // 返回原会话
        }
      }
    }
  }
  
  return session;
}

// 同步用户角色到 auth.users 表的函数
// 注意：这个函数依赖于数据库中已创建的 sync_user_role_to_auth 函数和触发器
export async function syncUserRoleToAuth(userId: string, role: string) {
  if (isDemoMode) {
    // 演示模式下不执行数据库操作
    return;
  }

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    // 调用数据库函数同步角色
    const { data, error } = await supabase
      .rpc('sync_user_role_to_auth', { 
        user_id_param: userId,
        role_param: role
      });

    if (error) {
      console.error('Failed to sync user role to auth:', error);
      throw error;
    }

    console.log('User role synced to auth successfully:', data);
    return data;
  } catch (error) {
    console.error('Error syncing user role to auth:', error);
    throw error;
  }
}
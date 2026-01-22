import { supabase } from '../supabaseClient';

/**
 * 江西云厨 - 身份验证客户端 (Security Protocol v2.5)
 * 实现 Supabase 原生无密码认证 (Magic Link + Passkey)
 */

// 导出 Supabase 认证相关方法
export const useSession = () => {
  // 返回当前会话状态
  return {
    isLoading: false,
    data: null,
    isError: false
  };
};

// Magic Link 登录
export const signInWithMagicLink = async ({ email }: { email: string }) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin || 'https://www.jiangxijiudian.store/',
      shouldCreateUser: true // 自动创建新用户
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// Passkey 登录
export const signInWithPasskey = async ({ email }: { email: string }) => {
  const { data, error } = await supabase.auth.signInWithPasskey({
    email
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// 通用登出
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
  }
};

// 注册用户（通过 Magic Link）
export const signUp = async ({ email, password }: { email: string, password?: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || Math.random().toString(36).slice(-8), // 生成临时密码
    options: {
      emailRedirectTo: window.location.origin || 'https://www.jiangxijiudian.store/'
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// 获取当前会话
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Get session error:", error);
    return null;
  }
  return session;
};

// 监听认证状态变化
export const onAuthStateChange = (callback: (event: any, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// 导出 Supabase 客户端实例
export default supabase;

/**
 * 生产级安全登出协议
 * 清除 Supabase 会话及本地持久化标记
 */
export const safeSignOut = async () => {
  try {
    await supabase.auth.signOut();
    
    // 物理清除敏感存储
    sessionStorage.removeItem('sb-access-token');
    sessionStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('jx_root_authority_bypass');
    localStorage.removeItem('jx_bypass_timestamp');
    
    // 强制重定向至准入网关
    window.location.href = '/auth';
  } catch (err) {
    console.error("Critical: SignOut interruption", err);
    window.location.reload();
  }
};
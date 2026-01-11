import { supabase, getAuthHeaderFromSession, refreshSessionIfNeeded } from './enhancedSupabaseClient';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  signal?: AbortSignal;
};

/**
 * 与Vercel边缘函数API交互的封装函数
 * 自动处理认证头和令牌刷新
 */
export async function apiFetch(path: string, opts: ApiOptions = {}) {
  const url = path.startsWith('/') ? path : `/${path}`;
  const method = opts.method ?? 'GET';
  
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 获取当前会话并添加认证头
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = getAuthHeaderFromSession(session);
  
  if (authHeader) headers['Authorization'] = authHeader;
  
  let res = await fetch(url, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  
  // 如果收到401未授权响应，尝试刷新令牌并重试
  if (res.status === 401) {
    console.log('Received 401, attempting to refresh session...');
    
    // 尝试刷新会话
    const refreshedSession = await refreshSessionIfNeeded();
    
    if (!refreshedSession) {
      // 如果无法刷新会话，登出用户并清除所有会话状态
      await supabase.auth.signOut();
      
      // 清除所有前端会话状态和缓存
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // Clear cookies by setting them to expire
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      
      throw new Error('Unauthorized and session refresh failed');
    }
    
    // 使用新的访问令牌重试请求
    const newAuthHeader = getAuthHeaderFromSession(refreshedSession);
    if (newAuthHeader) {
      headers['Authorization'] = newAuthHeader;
      
      const retryRes = await fetch(url, {
        method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal,
      });
      
      if (!retryRes.ok) {
        const text = await retryRes.text();
        throw new Error(`API Error ${retryRes.status}: ${text}`);
      }
      
      return retryRes.json();
    } else {
      throw new Error('Failed to obtain new access token after refresh');
    }
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  
  return res.json();
}

/**
 * 专门用于调用江西云厨API v1端点的函数
 */
export const jxApi = {
  // 获取全局配置
  getConfig: () => apiFetch('/api/v1/config/global', { method: 'GET' }),
  
  // 创建订单
  createOrder: (orderData: { room_id: string; items: any[]; payment_method?: string }) => 
    apiFetch('/api/v1/orders', { method: 'POST', body: orderData }),
  
  // 获取房间订单
  getRoomOrders: (roomId: string, status?: string) => {
    let url = `/api/v1/rooms/${encodeURIComponent(roomId)}/orders`;
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    return apiFetch(url, { method: 'GET' });
  },
  
  // 获取支付配置
  getPaymentConfigs: () => apiFetch('/api/v1/payment_configs', { method: 'GET' }),
  
  // 通用的获取所有资源方法
  getAll: (resource: string) => apiFetch(`/api/v1/${resource}`, { method: 'GET' }),
  
  // 通用的创建资源方法
  create: (resource: string, data: any) => apiFetch(`/api/v1/${resource}`, { method: 'POST', body: data }),
  
  // 通用的更新资源方法
  update: (resource: string, id: string, data: any) => apiFetch(`/api/v1/${resource}/${id}`, { method: 'PUT', body: data }),
  
  // 通用的删除资源方法
  delete: (resource: string, id: string) => apiFetch(`/api/v1/${resource}/${id}`, { method: 'DELETE' }),
};

import { Order, Dish, HotelRoom, Expense, User, OrderStatus, RoomStatus, MaterialImage, SecurityLog } from '../types';
import { supabase, isDemoMode } from './supabaseClient';
import { INITIAL_DISHES, ROOM_NUMBERS } from '../constants';

/**
 * 增强型重试装饰器
 * 如果处于演示模式或数据库未就绪，直接返回回退数据，避免控制台报错。
 */
const withRetry = async <T>(fn: () => Promise<T>, fallback: T, retries = 1): Promise<T> => {
  // 核心修复：如果是演示模式，直接跳过 API 调用
  if (isDemoMode) {
    return fallback;
  }

  try {
    return await fn();
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    
    // 捕获网络连接错误 (TypeError: Failed to fetch) 或 数据库表不存在 (42P01)
    const isNetworkError = errorMsg.includes('fetch') || errorMsg.includes('NetworkError');
    const isMissingTable = err?.code === '42P01' || errorMsg.includes('relation') || errorMsg.includes('not found');
    
    if (isNetworkError || isMissingTable) {
      console.warn(`[JX-API] 网络异常或表缺失，切换至回退数据: ${errorMsg}`);
      return fallback;
    }

    if (retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return withRetry(fn, fallback, retries - 1);
    }
    
    console.error(`[JX-API] 请求最终失败: ${errorMsg}`);
    return fallback;
  }
};

const logAuditAction = async (action: string, userId: string = 'system') => {
  if (isDemoMode) return;
  try {
    await supabase.from('security_logs').insert({
      user_id: userId,
      action,
      timestamp: new Date().toISOString(),
      ip: 'Cloud-Gateway',
      risk_level: 'Low'
    });
  } catch (e) {
    // 审计日志失败不阻断主流程
  }
};

export const api = {
  rooms: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('rooms').select('*').order('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rooms in DB');
      return data as HotelRoom[];
    }, ROOM_NUMBERS.map(id => ({ id, status: RoomStatus.READY }))),
    
    update: (room: HotelRoom) => withRetry(async () => {
      const { data, error } = await supabase.from('rooms').update({ status: room.status }).eq('id', room.id).select().single();
      if (error) throw error;
      logAuditAction(`Station ${room.id} status updated to ${room.status}`);
      return data as HotelRoom;
    }, room)
  },
  
  orders: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    }, []),
    
    create: (order: Order) => withRetry(async () => {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      return data as Order;
    }, order),
    
    updateStatus: (orderId: string, status: OrderStatus) => withRetry(async () => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
    }, undefined)
  },
  
  dishes: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('dishes').select('*').order('name');
      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_DISHES;
      return data as Dish[];
    }, INITIAL_DISHES),
    
    create: (dish: Dish) => withRetry(async () => {
      const { data, error } = await supabase.from('dishes').insert(dish).select().single();
      if (error) throw error;
      return data as Dish;
    }, dish),
    
    update: (dish: Dish) => withRetry(async () => {
      const { data, error } = await supabase.from('dishes').update(dish).eq('id', dish.id).select().single();
      if (error) throw error;
      return data as Dish;
    }, dish),
    
    delete: (id: string) => withRetry(async () => {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
    }, undefined)
  },
  
  logs: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('security_logs').select('*').order('timestamp', { ascending: false }).limit(50);
      if (error) throw error;
      return data as SecurityLog[];
    }, [])
  },
  
  expenses: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    }, []),
    
    create: (exp: Expense) => withRetry(async () => {
      const { data, error } = await supabase.from('expenses').insert(exp).select().single();
      if (error) throw error;
      return data as Expense;
    }, exp),
    
    delete: (id: string) => withRetry(async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    }, undefined)
  },
  
  users: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data as User[];
    }, [{ id: '1', username: 'admin', role: 'admin' as any, name: 'System Admin' }]),
    
    create: (user: User) => withRetry(async () => {
      const { data, error } = await supabase.from('users').insert(user).select().single();
      if (error) throw error;
      return data as User;
    }, user),
    
    delete: (id: string) => withRetry(async () => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    }, undefined)
  },
  
  materials: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('materials').select('*').order('name');
      if (error) throw error;
      return data as MaterialImage[];
    }, []),
    
    create: (m: MaterialImage) => withRetry(async () => {
      const { data, error } = await supabase.from('materials').insert(m).select().single();
      if (error) throw error;
      return data as MaterialImage;
    }, m),
    
    delete: (id: string) => withRetry(async () => {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    }, undefined)
  },

  translations: {
    getAll: () => withRetry(async () => {
      const { data, error } = await supabase.from('translations').select('key, zh, en, tl');
      if (error) throw error;
      return data;
    }, [])
  }
};

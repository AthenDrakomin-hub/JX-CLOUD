/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { Order, Dish, HotelRoom, Expense, User, OrderStatus, RoomStatus, MaterialImage, SecurityLog, UserRole, PaymentMethod, PaymentMethodConfig, SystemConfig, Ingredient, PasswordResetRequest, PasswordResetResponse } from '../types';
import { ROOM_NUMBERS } from '../constants';
import { supabase, isDemoMode, supabaseUrl } from './supabaseClient';
import { notificationService } from './notification';

/**
 * 江西云厨 - 混合动力存储引擎 (Reliability Layer)
 */

const STORAGE_KEYS = {
  ROOMS: 'jx_virtual_rooms',
  ORDERS: 'jx_virtual_orders',
  DISHES: 'jx_virtual_dishes',
  EXPENSES: 'jx_virtual_expenses',
  USERS: 'jx_virtual_users',
  SYNC_QUEUE: 'jx_pending_sync',
  CONFIG: 'jx_virtual_config',
  MATERIALS: 'jx_virtual_materials',
  TRANSLATIONS: 'jx_virtual_translations'
};

const VirtualDB = {
  get: <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  queueForSync: (action: string, table: string, payload: any) => {
    const queue = VirtualDB.get<any[]>(STORAGE_KEYS.SYNC_QUEUE, []);
    
    // 生成唯一键用于去重
    const key = `${table}:${payload.id ?? JSON.stringify(payload)}`;
    
    // 移除相同键的先前操作
    const filtered = queue.filter(q => q.key !== key);
    
    // 添加新操作
    filtered.push({ key, action, table, payload, timestamp: Date.now() });
    VirtualDB.set(STORAGE_KEYS.SYNC_QUEUE, filtered);
  }
};

// 辅助函数：检查边缘功能是否可用
const checkEdgeFunctionStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dish-crud-api/dishes?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Edge function status check failed:', error);
    return false;
  }
};

export const api = {
  auth: {
    // 重置密码功能
    resetPassword: async (data: { token: string; newPassword: string }) => {
      if (isDemoMode) return { success: true };
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/users-admin/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to reset password: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error resetting password:', error);
        throw error;
      }
    }
  },
  
  db: {
    getStats: async () => {
      if (isDemoMode) return { orders: 0, dishes: 0, users: 0, rooms: 0, status: 'Virtual' };
      try {
        // 更严格的连接测试：先执行一个简单的查询验证连接
        const { error: healthCheckError } = await supabase.from('users').select('id').limit(1);
        
        if (healthCheckError) {
          throw healthCheckError;
        }
        
        const [o, d, u, r] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('dishes').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('rooms').select('*', { count: 'exact', head: true })
        ]);
        
        // 检查是否有任何查询失败
        const hasError = [o, d, u, r].some(result => result.error);
        
        if (hasError) {
          return { orders: 0, dishes: 0, users: 0, rooms: 0, status: 'Sync Error' };
        }
        
        return { 
          orders: o.count || 0, 
          dishes: d.count || 0, 
          users: u.count || 0, 
          rooms: r.count || 0, 
          status: 'Cloud Active' 
        };
      } catch (e) {
        console.error('Database connection error:', e);
        return { orders: 0, dishes: 0, users: 0, rooms: 0, status: 'Sync Error' };
      }
    },
    
    // 获取当前用户信息的函数，使用新的边缘函数
    getCurrentUser: async (): Promise<User | null> => {
      if (isDemoMode) return null;
      
      try {
        // 从 Supabase 获取当前会话
        const { data: { session } } = await supabase.auth.getSession();
        
        let token;
        if (session && session.access_token) {
          token = session.access_token;
        } else {
          // 如果没有当前会话，尝试使用存储的令牌
          const storedSession = localStorage.getItem('supabase.auth.token');
          if (storedSession) {
            try {
              const sessionObj = JSON.parse(storedSession);
              token = sessionObj?.currentSession?.access_token;
            } catch (e) {
              console.error('Failed to parse stored session:', e);
            }
          }
        }
        
        if (!token) {
          console.log('No active session found');
          return null;
        }
        
        // 使用新的 get-current-user 边缘函数
        const response = await fetch(`${supabaseUrl}/functions/v1/get-current-user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.warn('JWT verification failed - unauthorized');
            return null;
          }
          throw new Error(`Failed to fetch current user: ${response.status} ${response.statusText}`);
        }
        
        const payload = await response.json();
        const row = payload.user ?? payload;
        
        if (!row) {
          return null;
        }
        
        // 将返回的数据转换为 User 类型，不包含敏感字段
        return {
          id: row.id,
          username: row.username,
          name: row.name,
          role: row.role,
          password: undefined, // 不在客户端暴露密码
          permissions: row.permissions,
          ipWhitelist: row.ip_whitelist,
          twoFactorEnabled: row.two_factor_enabled,
          mfaSecret: undefined, // 不在客户端暴露MFA密钥
          isOnline: row.is_online,
          isLocked: row.is_locked,
          lastLogin: row.last_login
        };
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    },
    
    // 选择或登录用户的函数，使用新的边缘函数
    selectOrLoginUser: async (credentials?: { username: string; password: string }): Promise<User | null> => {
      if (isDemoMode) return null;
      
      try {
        // 从 Supabase 获取当前会话
        const { data: { session } } = await supabase.auth.getSession();
        
        // 仅在有会话时使用access_token调用
        if (!session) {
          console.warn('No session - select/login requires authentication');
          return null;
        }
        
        // 使用新的 select-or-login-user 边缘函数
        const response = await fetch(`${supabaseUrl}/functions/v1/select-or-login-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials || {})
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.warn('User authentication failed');
            return null;
          }
          throw new Error(`Failed to select or login user: ${response.status} ${response.statusText}`);
        }
        
        const payload = await response.json();
        const row = payload.user ?? payload;
        
        if (!row) {
          return null;
        }
        
        // 将返回的数据转换为 User 类型，不包含敏感字段
        return {
          id: row.id,
          username: row.username,
          name: row.name,
          role: row.role,
          password: undefined, // 不在客户端暴露密码
          permissions: row.permissions,
          ipWhitelist: row.ip_whitelist,
          twoFactorEnabled: row.two_factor_enabled,
          mfaSecret: undefined, // 不在客户端暴露MFA密钥
          isOnline: row.is_online,
          isLocked: row.is_locked,
          lastLogin: row.last_login
        };
      } catch (error) {
        console.error('Error in select or login user:', error);
        return null;
      }
    },
    
    // 新增：实时连接状态检测
    getConnectionStatus: async () => {
      if (isDemoMode) return { status: 'Virtual', connected: false };
      
      try {
        // 检查网络状态
        if (!navigator.onLine) {
          return { status: 'Offline', connected: false };
        }
        
        // 执行一个简单的查询来验证连接
        const { error } = await supabase.from('users').select('id').limit(1);
        
        if (error) {
          console.error('Connection test failed:', error);
          return { status: 'Connection Failed', connected: false };
        }
        
        return { status: 'Connected', connected: true };
      } catch (e) {
        console.error('Connection status check failed:', e);
        return { status: 'Connection Failed', connected: false };
      }
    },
    
    // 设置用户密码
    setUserPassword: async (username: string, newPassword: string): Promise<PasswordResetResponse> => {
      if (isDemoMode) {
        console.log(`演示模式：设置用户 ${username} 的密码`);
        return { success: true, message: 'Password updated successfully in demo mode' };
      }
      
      try {
        // 在前端环境中，我们没有直接的会话访问权限，但需要传递认证信息
        // 这里我们使用 localStorage 中存储的 token
        const sessionData = localStorage.getItem('supabase.auth.token');
        let token = '';
        
        if (sessionData) {
          try {
            const sessionObj = JSON.parse(sessionData);
            token = sessionObj.currentSession?.access_token || '';
          } catch (e) {
            console.error('Failed to parse session data:', e);
          }
        }
        
        // 使用新的 set-user-password 边缘函数（部署在 Vercel 上）
        const response = await fetch('/api/set-user-password', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            newPassword
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to set user password: ${response.status} ${response.statusText}`);
        }
        
        const result: PasswordResetResponse = await response.json();
        return result;
      } catch (error) {
        console.error('Error setting user password:', error);
        throw error;
      }
    },
    
    // 订单处理API，使用 Vercel API 路由
    processOrder: async (order: Order) => {
      if (isDemoMode) return order;
      
      try {
        let token;
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.access_token) {
          token = session.access_token;
        } else {
          // 如果没有当前会话，尝试使用存储的令牌
          const storedSession = localStorage.getItem('supabase.auth.token');
          if (storedSession) {
            try {
              const sessionObj = JSON.parse(storedSession);
              token = sessionObj?.currentSession?.access_token;
            } catch (e) {
              console.error('Failed to parse stored session:', e);
            }
          }
        }
        
        if (!token) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`/api/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: order.roomId,
            items: order.items,
            total_amount: order.totalAmount,
            tax_amount: order.taxAmount,
            payment_method: order.paymentMethod
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to process order: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error processing order via Vercel API:', error);
        // 如果 Vercel API 失败，返回原始订单以供后续处理
        return order;
      }
    },
    
    // 订单通知API，使用新的边缘函数
    notifyOrder: async (orderEvent: { orderId: string; eventType: string; payload?: any }) => {
      if (isDemoMode) return true;
      
      try {
        let token;
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.access_token) {
          token = session.access_token;
        } else {
          // 如果没有当前会话，尝试使用存储的令牌
          const storedSession = localStorage.getItem('supabase.auth.token');
          if (storedSession) {
            try {
              const sessionObj = JSON.parse(storedSession);
              token = sessionObj?.currentSession?.access_token;
            } catch (e) {
              console.error('Failed to parse stored session:', e);
            }
          }
        }
        
        if (!token) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/order-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderEvent)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to notify order: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error notifying order via edge function:', error);
        return false;
      }
    },
    
    // 支付处理API，使用新的边缘函数
    processPayment: async (paymentData: { order_id: string; method: string; amount: number }) => {
      if (isDemoMode) return { success: true, provider_response: { provider: paymentData.method, payment_id: `mock_${Date.now()}`, status: 'pending' } };
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/payment-processing/process`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to process payment: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error processing payment via edge function:', error);
        throw error;
      }
    },
    
    // 支付验证API，使用新的边缘函数
    verifyPayment: async (verificationData: { payment_id: string; provider: string }) => {
      if (isDemoMode) return { success: true, status: 'confirmed' };
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/payment-verification/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verificationData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to verify payment: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error verifying payment via edge function:', error);
        throw error;
      }
    },
    
    // 获取支持的支付方式
    getPaymentMethods: async () => {
      if (isDemoMode) return { methods: ['gcash', 'maya', 'card'] };
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/payment-processing/methods`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get payment methods: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error getting payment methods via edge function:', error);
        throw error;
      }
    },
    
    // 从订单处理API获取支付方式
    getPaymentMethodsFromOrderApi: async () => {
      if (isDemoMode) return [];
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/order-processing-api/methods`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get payment methods: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error getting payment methods from order API:', error);
        throw error;
      }
    },
    
    // 创建支付记录
    createPayment: async (paymentData: { user_id: string; order_id: string; method_id: string; amount: number; proof_url?: string; note?: string }) => {
      if (isDemoMode) return { id: `demo_payment_${Date.now()}`, ...paymentData };
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/order-processing-api/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create payment: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error creating payment via edge function:', error);
        throw error;
      }
    },
    
    // 获取支付记录
    getPayment: async (paymentId: string) => {
      if (isDemoMode) return { id: paymentId, status: 'confirmed' };
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/order-processing-api/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get payment: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error getting payment via edge function:', error);
        throw error;
      }
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('rooms').select('*').order('id');
          if (data && data.length > 0) return data;
        } catch (e) {
          console.error('Error fetching rooms:', e);
        }
      }
      // 在非演示模式下，如果没有本地房间数据，则返回空数组，强制从云端获取真实房间数据
      const localRooms = VirtualDB.get<HotelRoom[]>(STORAGE_KEYS.ROOMS, []);
      if (localRooms.length > 0 || isDemoMode) {
        return localRooms;
      } else {
        // 返回空数组，让应用等待云端数据
        return [];
      }
    },
    update: async (room: HotelRoom) => {
      const rooms = VirtualDB.get<HotelRoom[]>(STORAGE_KEYS.ROOMS, []);
      VirtualDB.set(STORAGE_KEYS.ROOMS, rooms.map(r => r.id === room.id ? room : r));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('rooms').upsert({ id: room.id, status: room.status });
          if (error) throw error;
        } catch (e) {
          VirtualDB.queueForSync('UPSERT', 'rooms', room);
        }
      }
    }
  },
  
  orders: {
    getAll: async (): Promise<Order[]> => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (data) {
            return data.map((o: any) => ({
              id: o.id,
              roomId: o.room_id,
              items: o.items,
              totalAmount: Number(o.total_amount),
              taxAmount: Number(o.tax_amount),
              serviceCharge: Number(o.service_charge || 0),
              status: o.status,
              paymentMethod: o.payment_method,
              createdAt: o.created_at,
              updatedAt: o.updated_at
            }));
          }
        } catch (e) {
          console.error('Error fetching orders:', e);
        }
      }
      return VirtualDB.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    },
    create: async (order: Order) => {
      const orders = VirtualDB.get<Order[]>(STORAGE_KEYS.ORDERS, []);
      VirtualDB.set(STORAGE_KEYS.ORDERS, [order, ...orders]);
      
      if (!isDemoMode) {
        try {
          // 使用新的订单处理边缘函数
          const processedOrder = await api.db.processOrder(order);
          
          // 更新房间状态
          await supabase.from('rooms').update({ status: RoomStatus.ORDERING }).eq('id', order.roomId);
        } catch (e) {
          VirtualDB.queueForSync('INSERT', 'orders', order);
        }
      }
      
      // Send notification to kitchen
      notificationService.send('新订单', `房间 ${order.roomId} 发起点餐 ₱${order.totalAmount}`, 'NEW_ORDER');
      
      // Trigger webhook if enabled
      try {
        const config = await api.config.get();
        if (config.isWebhookEnabled && config.webhookUrl) {
          await notificationService.triggerWebhook(order, config.webhookUrl);
        }
      } catch (e) {
        console.warn('Failed to get config or trigger webhook:', e);
      }
      
      // 使用新的订单通知边缘函数
      try {
        await api.db.notifyOrder({
          orderId: order.id,
          eventType: 'NEW_ORDER',
          payload: { roomId: order.roomId, totalAmount: order.totalAmount }
        });
      } catch (e) {
        console.warn('Failed to send order notification via edge function:', e);
      }
    },
    updateStatus: async (orderId: string, status: OrderStatus) => {
      const orders = VirtualDB.get<Order[]>(STORAGE_KEYS.ORDERS, []);
      VirtualDB.set(STORAGE_KEYS.ORDERS, orders.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
      
      if (!isDemoMode) {
        try {
          let token;
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.access_token) {
            token = session.access_token;
          } else {
            // 如果没有当前会话，尝试使用存储的令牌
            const storedSession = localStorage.getItem('supabase.auth.token');
            if (storedSession) {
              try {
                const sessionObj = JSON.parse(storedSession);
                token = sessionObj?.currentSession?.access_token;
              } catch (e) {
                console.error('Failed to parse stored session:', e);
              }
            }
          }
          
          if (token) {
            const response = await fetch(`/api/update-order`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ order_id: orderId, status })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to update order status: ${response.status} ${response.statusText}`);
            }
            
            if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
               const { data } = await supabase.from('orders').select('room_id').eq('id', orderId).single();
               if (data) await supabase.from('rooms').update({ status: RoomStatus.READY }).eq('id', (data as any).room_id);
            }
          }
        } catch (e) {
          VirtualDB.queueForSync('UPDATE_STATUS', 'orders', { orderId, status });
          console.error('Error updating order status via Vercel API:', e);
        }
      }
      
      // Send notification about order status update
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const statusText = {
          [OrderStatus.PENDING]: '待处理',
          [OrderStatus.PREPARING]: '制作中',
          [OrderStatus.DELIVERING]: '配送中',
          [OrderStatus.COMPLETED]: '已完成',
          [OrderStatus.CANCELLED]: '已取消'
        }[status] || status;
        
        notificationService.send('订单状态更新', `订单 ${orderId} 状态更新为: ${statusText}`, 'ORDER_UPDATE');
      }
      
      // 使用新的订单通知边缘函数
      try {
        await api.db.notifyOrder({
          orderId,
          eventType: 'STATUS_UPDATE',
          payload: { status, updatedAt: new Date().toISOString() }
        });
      } catch (e) {
        console.warn('Failed to send order notification via edge function:', e);
      }
    }
  },

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (!isDemoMode) {
        try {
          // 使用 Vercel 边缘函数作为代理，避免 CORS 问题
          const response = await fetch(`/api/edge/get-dishes`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data)) {
              return data.map((d: any) => ({
                id: d.id,
                name: d.name,
                nameEn: d.name_en,
                description: d.description,
                price: Number(d.price),
                category: d.category,
                stock: Number(d.stock),
                imageUrl: d.image_url,
                isRecommended: d.is_recommended,
                isAvailable: d.is_available,
                calories: d.calories,
                allergens: d.allergens
              }));
            }
          } else {
            console.error(`Failed to fetch dishes: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to fetch dishes from Vercel edge function:', error);
        }
      }
      // 首先尝试从本地存储获取数据，如果本地没有数据且不是演示模式，则返回空数组等待云端数据
      const localDishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      if (localDishes.length > 0 || isDemoMode) {
        return localDishes;
      } else {
        // 在非演示模式下，如果没有本地数据，则返回空数组，让应用等待云端数据
        return [];
      }
    },
    create: async (dish: Dish) => {
      const payload = {
        id: dish.id,
        name: dish.name,
        name_en: dish.nameEn,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        stock: dish.stock,
        image_url: dish.imageUrl,
        is_available: dish.isAvailable,
        is_recommended: dish.isRecommended,
        calories: dish.calories,
        allergens: dish.allergens
      };
      
      if (!isDemoMode) {
        try {
          // 使用新的 dish-crud-api 边缘功能
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dish-crud-api/dish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create dish: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to create dish via edge function:', error);
          // 添加到同步队列以供后续处理
          VirtualDB.queueForSync('INSERT', 'dishes', dish);
        }
      }
      
      const dishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      VirtualDB.set(STORAGE_KEYS.DISHES, [...dishes, dish]);
    },
    update: async (dish: Dish) => {
      const payload = {
        name: dish.name,
        name_en: dish.nameEn,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        stock: dish.stock,
        image_url: dish.imageUrl,
        is_available: dish.isAvailable,
        is_recommended: dish.isRecommended,
        calories: dish.calories,
        allergens: dish.allergens
      };
      
      if (!isDemoMode) {
        try {
          // 使用新的 dish-crud-api 边缘功能
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dish-crud-api/dish/${dish.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update dish: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to update dish via edge function:', error);
          // 添加到同步队列以供后续处理
          VirtualDB.queueForSync('UPDATE', 'dishes', dish);
        }
      }
      
      const dishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      VirtualDB.set(STORAGE_KEYS.DISHES, dishes.map(d => d.id === dish.id ? dish : d));
    },
    delete: async (id: string) => {
      if (!isDemoMode) {
        try {
          // 使用新的 dish-crud-api 边缘功能
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dish-crud-api/dish/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete dish: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to delete dish via edge function:', error);
          // 添加到同步队列以供后续处理
          VirtualDB.queueForSync('DELETE', 'dishes', { id });
        }
      }
      
      const dishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      VirtualDB.set(STORAGE_KEYS.DISHES, dishes.filter(d => d.id !== id));
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      if (!isDemoMode) {
        // 仅选择非敏感列，避免返回密码和MFA密钥
        const { data } = await supabase.from('users').select('id,username,name,role,permissions,two_factor_enabled,is_online,is_locked,ip_whitelist,last_login');
        if (data) {
          return data.map((u: any) => ({
            id: u.id,
            username: u.username,
            name: u.name,
            role: u.role,
            password: undefined, // 不返回密码
            permissions: u.permissions,
            twoFactorEnabled: u.two_factor_enabled,
            mfaSecret: undefined, // 不返回MFA密钥
            isOnline: u.is_online,
            isLocked: u.is_locked,
            ipWhitelist: u.ip_whitelist,
            lastLogin: u.last_login
          }));
        }
      }
      // 在非演示模式下，如果没有本地用户数据，则返回空数组，强制从云端获取真实用户数据
      const localUsers = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      if (localUsers.length > 0 || isDemoMode) {
        return localUsers;
      } else {
        // 返回空数组，让应用等待云端数据
        return [];
      }
    },
    create: async (user: User) => {
      const payload = {
        id: user.id,
        username: user.username,
        password: user.password, // 注意：实际部署时，密码应该在服务端进行哈希处理
        role: user.role,
        name: user.name,
        permissions: user.permissions,
        ip_whitelist: user.ipWhitelist,
        two_factor_enabled: user.twoFactorEnabled,
        mfa_secret: user.mfaSecret, // 注意：实际部署时，MFA密钥不应该通过客户端传递
        is_online: user.isOnline,
        is_locked: user.isLocked
      };
      if (!isDemoMode) await supabase.from('users').insert(payload);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, [...users, {
        ...user,
        password: undefined, // 在本地存储中不保存密码
        mfaSecret: undefined  // 在本地存储中不保存MFA密钥
      }]);
    },
    update: async (user: User) => {
      const payload = {
        username: user.username,
        password: user.password, // 注意：实际部署时，密码应该在服务端进行哈希处理
        role: user.role,
        name: user.name,
        permissions: user.permissions,
        ip_whitelist: user.ipWhitelist,
        two_factor_enabled: user.twoFactorEnabled,
        mfa_secret: user.mfaSecret, // 注意：实际部署时，MFA密钥不应该通过客户端传递
        is_online: user.isOnline,
        is_locked: user.isLocked
      };
      if (!isDemoMode) await supabase.from('users').update(payload).eq('id', user.id);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, users.map(u => u.id === user.id ? {
        ...user,
        password: undefined, // 在本地存储中不保存密码
        mfaSecret: undefined  // 在本地存储中不保存MFA密钥
      } : u));
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('users').delete().eq('id', id);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
    },
    setOnlineStatus: async (userId: string, isOnline: boolean) => {
      if (!isDemoMode) await supabase.from('users').update({ is_online: isOnline, last_login: new Date().toISOString() }).eq('id', userId);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, users.map(u => u.id === userId ? { ...u, isOnline, lastLogin: new Date().toISOString() } : u));
    }
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('config').select('*').eq('id', 'global').single();
        if (data) {
          return {
            hotelName: data.hotel_name,
            version: data.version,
            serviceChargeRate: Number(data.service_charge_rate),
            exchangeRateCNY: Number(data.exchange_rate_cny),
            exchangeRateUSDT: Number(data.exchange_rate_usdt),
            webhookUrl: data.webhook_url,
            isWebhookEnabled: data.is_webhook_enabled
          };
        }
      }
      return VirtualDB.get(STORAGE_KEYS.CONFIG, { hotelName: '江西云厨', version: '3.5' } as any);
    },
    update: async (config: SystemConfig) => {
      const payload = {
        hotel_name: config.hotelName,
        version: config.version,
        service_charge_rate: config.serviceChargeRate,
        exchange_rate_cny: config.exchangeRateCNY,
        exchange_rate_usdt: config.exchangeRateUSDT,
        webhook_url: config.webhookUrl,
        is_webhook_enabled: config.isWebhookEnabled,
        updated_at: new Date().toISOString()
      };
      if (!isDemoMode) await supabase.from('config').upsert({ id: 'global', ...payload });
      VirtualDB.set(STORAGE_KEYS.CONFIG, config);
    }
  },

  expenses: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('expenses').select('*');
        if (data) return data;
      }
      return VirtualDB.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    },
    create: async (expense: Expense) => {
      if (!isDemoMode) await supabase.from('expenses').insert(expense);
      const expenses = VirtualDB.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      VirtualDB.set(STORAGE_KEYS.EXPENSES, [expense, ...expenses]);
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('expenses').delete().eq('id', id);
      const expenses = VirtualDB.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      VirtualDB.set(STORAGE_KEYS.EXPENSES, expenses.filter(e => e.id !== id));
    }
  },

  materials: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('material_images').select('*');
        if (data) {
          return data.map((m: any) => ({
            ...m,
            fileSize: m.file_size
          }));
        }
      }
      return VirtualDB.get<MaterialImage[]>(STORAGE_KEYS.MATERIALS, []);
    },
    create: async (m: MaterialImage) => {
      const payload = {
        id: m.id,
        url: m.url,
        name: m.name,
        category: m.category,
        file_size: m.fileSize,
        dimensions: m.dimensions
      };
      if (!isDemoMode) await supabase.from('material_images').insert(payload);
      const materials = VirtualDB.get<MaterialImage[]>(STORAGE_KEYS.MATERIALS, []);
      VirtualDB.set(STORAGE_KEYS.MATERIALS, [...materials, m]);
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('material_images').delete().eq('id', id);
      const materials = VirtualDB.get<MaterialImage[]>(STORAGE_KEYS.MATERIALS, []);
      VirtualDB.set(STORAGE_KEYS.MATERIALS, materials.filter(m => m.id !== id));
    }
  },

  logs: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('security_logs').select('*').order('timestamp', { ascending: false }).limit(200);
        if (data) {
          return data.map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            action: l.action,
            details: l.details,
            timestamp: l.timestamp,
            ip: l.ip,
            riskLevel: l.risk_level
          }));
        }
      }
      return [];
    },
    add: async (log: SecurityLog) => {
      if (!isDemoMode) {
        const payload = {
          user_id: log.userId,
          action: log.action,
          details: log.details,
          ip: log.ip,
          risk_level: log.riskLevel || 'Low',
          timestamp: new Date().toISOString()
        };
        const { error } = await supabase.from('security_logs').insert(payload);
        if (error) console.warn('Supabase Log Error:', error);
      }
    }
  },

  ingredients: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('ingredients').select('*');
        if (data) {
          return data.map((i: any) => ({
            ...i,
            minStock: i.min_stock,
            lastRestocked: i.last_restocked
          }));
        }
      }
      return [];
    },
    create: async (ing: Ingredient) => {
      const payload = {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        stock: ing.stock,
        min_stock: ing.minStock,
        category: ing.category,
        last_restocked: ing.lastRestocked
      };
      if (!isDemoMode) await supabase.from('ingredients').insert(payload);
    },
    update: async (ing: Ingredient) => {
      const payload = {
        name: ing.name,
        unit: ing.unit,
        stock: ing.stock,
        min_stock: ing.minStock,
        category: ing.category,
        last_restocked: ing.lastRestocked
      };
      if (!isDemoMode) await supabase.from('ingredients').update(payload).eq('id', ing.id);
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('ingredients').delete().eq('id', id);
    }
  },

  payments: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('payments').select('*');
        if (data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type as PaymentMethod,
            isActive: p.is_active,
            iconType: p.icon_type as any,
            instructions: p.instructions
          }));
        }
      }
      return [];
    },
    update: async (p: PaymentMethodConfig) => {
      const payload = {
        name: p.name,
        is_active: p.isActive,
        instructions: p.instructions
      };
      if (!isDemoMode) await supabase.from('payments').update(payload).eq('id', p.id);
    },
    toggle: async (id: string) => {
      if (!isDemoMode) {
        const { data } = await supabase.from('payments').select('is_active').eq('id', id).single();
        if (data) await supabase.from('payments').update({ is_active: !data.is_active }).eq('id', id);
      }
    }
  },

  translations: {
    getAll: async () => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('translations').select('*');
          if (data) {
            // Convert the database format to the expected translation dictionary format
            const translationDict: any = { zh: {}, en: {}, tl: {} };
            
            data.forEach((row: any) => {
              if (row.key) {
                if (row.zh) translationDict.zh[row.key] = row.zh;
                if (row.en) translationDict.en[row.key] = row.en;
                if (row.tl) translationDict.tl[row.key] = row.tl;
              }
            });
            
            return translationDict;
          }
        } catch (e) {
          console.warn('Translations fetch failed, using local storage:', e);
        }
      }
      return VirtualDB.get<any>(STORAGE_KEYS.TRANSLATIONS, {});
    },
    update: async (dict: any) => VirtualDB.set(STORAGE_KEYS.TRANSLATIONS, dict)
  },

  migration: {
    run: async (onProgress: (msg: string) => void) => {
      if (isDemoMode) {
        onProgress('错误：未检测到有效的云端连接。');
        return { success: false };
      }
      
      onProgress('正在封装本地资产...');
      const localRooms = VirtualDB.get<HotelRoom[]>(STORAGE_KEYS.ROOMS, []);
      const localDishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      
      onProgress(`准备同步 ${localRooms.length} 间客房数据...`);
      await supabase.from('rooms').upsert(localRooms.map(r => ({ id: r.id, status: r.status })));
      
      onProgress(`正在推送 ${localDishes.length} 项菜单资产...`);
      await supabase.from('dishes').upsert(localDishes.map(d => ({
        id: d.id,
        name: d.name,
        name_en: d.nameEn,
        description: d.description,
        price: d.price,
        category: d.category,
        stock: d.stock,
        image_url: d.imageUrl,
        is_available: d.isAvailable,
        is_recommended: d.isRecommended
      })));
      
      onProgress('正在对齐全局系统配置...');
      const localConfig = VirtualDB.get<SystemConfig>(STORAGE_KEYS.CONFIG, {} as any);
      await supabase.from('config').upsert({ 
        id: 'global', 
        hotel_name: localConfig.hotelName,
        service_charge_rate: localConfig.serviceChargeRate,
        exchange_rate_cny: localConfig.exchangeRateCNY,
        exchange_rate_usdt: localConfig.exchangeRateUSDT
      });

      onProgress('江西云厨：云端同步任务已完成。');
      return { success: true };
    }
  }
};
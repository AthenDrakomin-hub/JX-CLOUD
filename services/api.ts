
import { Order, Dish, HotelRoom, Expense, User, OrderStatus, RoomStatus, MaterialImage, SecurityLog, UserRole, PaymentMethod, PaymentMethodConfig, SystemConfig, Ingredient } from '../types';
import { INITIAL_DISHES, ROOM_NUMBERS } from '../constants';
import { supabase, isDemoMode } from './supabaseClient';
import { notificationService } from './notification';

/**
 * 江西云厨 - 混合动力存储引擎 (Reliability Layer)
 */

// Added missing keys: CONFIG, MATERIALS, TRANSLATIONS
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
    queue.push({ action, table, payload, timestamp: Date.now() });
    VirtualDB.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  }
};

export const api = {
  db: {
    getStats: async () => {
      if (isDemoMode) return { orders: 0, dishes: 0, users: 0, rooms: 0, status: 'Virtual' };
      try {
        const [o, d, u, r] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('dishes').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('rooms').select('*', { count: 'exact', head: true })
        ]);
        return { 
          orders: o.count || 0, 
          dishes: d.count || 0, 
          users: u.count || 0, 
          rooms: r.count || 0, 
          status: 'Cloud Active' 
        };
      } catch (e) {
        return { orders: 0, dishes: 0, USERS: 0, rooms: 0, status: 'Sync Error' };
      }
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      if (!isDemoMode) {
        try {
          const { data } = await supabase.from('rooms').select('*').order('id');
          if (data && data.length > 0) return data;
        } catch (e) {}
      }
      return VirtualDB.get<HotelRoom[]>(STORAGE_KEYS.ROOMS, []);
    },
    update: async (room: HotelRoom) => {
      // 1. 本地立即更新
      const rooms = VirtualDB.get<HotelRoom[]>(STORAGE_KEYS.ROOMS, []);
      VirtualDB.set(STORAGE_KEYS.ROOMS, rooms.map(r => r.id === room.id ? room : r));
      
      // 2. 尝试同步云端
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
          if (data) return data;
        } catch (e) {}
      }
      return VirtualDB.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    },
    create: async (order: Order) => {
      // 本地缓存
      const orders = VirtualDB.get<Order[]>(STORAGE_KEYS.ORDERS, []);
      VirtualDB.set(STORAGE_KEYS.ORDERS, [order, ...orders]);
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('orders').insert({
            id: order.id,
            room_id: order.roomId,
            items: order.items,
            total_amount: order.totalAmount,
            tax_amount: order.taxAmount,
            status: order.status,
            payment_method: order.paymentMethod
          });
          if (error) throw error;
          await supabase.from('rooms').update({ status: RoomStatus.ORDERING }).eq('id', order.roomId);
        } catch (e) {
          VirtualDB.queueForSync('INSERT', 'orders', order);
        }
      }
      notificationService.send('新订单', `房间 ${order.roomId} 发起点餐 ₱${order.totalAmount}`, 'NEW_ORDER');
    },
    updateStatus: async (orderId: string, status: OrderStatus) => {
      const orders = VirtualDB.get<Order[]>(STORAGE_KEYS.ORDERS, []);
      VirtualDB.set(STORAGE_KEYS.ORDERS, orders.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
      
      if (!isDemoMode) {
        try {
          const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
          if (error) throw error;
          if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
             const { data } = await supabase.from('orders').select('room_id').eq('id', orderId).single();
             if (data) await supabase.from('rooms').update({ status: RoomStatus.READY }).eq('id', (data as any).room_id);
          }
        } catch (e) {
          VirtualDB.queueForSync('UPDATE_STATUS', 'orders', { orderId, status });
        }
      }
    }
  },

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('dishes').select('*').order('name');
        if (data && data.length > 0) return data;
      }
      return VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, INITIAL_DISHES);
    },
    create: async (dish: Dish) => {
      if (!isDemoMode) await supabase.from('dishes').insert(dish);
      const dishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      VirtualDB.set(STORAGE_KEYS.DISHES, [...dishes, dish]);
    },
    update: async (dish: Dish) => {
      if (!isDemoMode) await supabase.from('dishes').update(dish).eq('id', dish.id);
      const dishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      VirtualDB.set(STORAGE_KEYS.DISHES, dishes.map(d => d.id === dish.id ? dish : d));
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('dishes').delete().eq('id', id);
      const dishes = VirtualDB.get<Dish[]>(STORAGE_KEYS.DISHES, []);
      VirtualDB.set(STORAGE_KEYS.DISHES, dishes.filter(d => d.id !== id));
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('users').select('*');
        if (data) return data;
      }
      return VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
    },
    create: async (user: User) => {
      if (!isDemoMode) await supabase.from('users').insert(user);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, [...users, user]);
    },
    update: async (user: User) => {
      if (!isDemoMode) await supabase.from('users').upsert(user);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, users.map(u => u.id === user.id ? user : u));
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('users').delete().eq('id', id);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
    },
    setOnlineStatus: async (userId: string, isOnline: boolean) => {
      if (!isDemoMode) await supabase.from('users').update({ is_online: isOnline }).eq('id', userId);
      const users = VirtualDB.get<User[]>(STORAGE_KEYS.USERS, []);
      VirtualDB.set(STORAGE_KEYS.USERS, users.map(u => u.id === userId ? { ...u, isOnline } : u));
    }
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('config').select('*').eq('id', 'global').single();
        if (data) return data;
      }
      return VirtualDB.get(STORAGE_KEYS.CONFIG, { hotelName: '江西云厨', version: '3.5' } as any);
    },
    update: async (config: SystemConfig) => {
      if (!isDemoMode) await supabase.from('config').upsert({ id: 'global', ...config });
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
        if (data) return data;
      }
      return VirtualDB.get<MaterialImage[]>(STORAGE_KEYS.MATERIALS, []);
    },
    create: async (m: MaterialImage) => {
      if (!isDemoMode) await supabase.from('material_images').insert(m);
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
        if (data) return data;
      }
      return [];
    },
    add: async (log: SecurityLog) => {
      if (!isDemoMode) {
        await supabase.from('security_logs').insert({
          user_id: log.userId,
          action: log.action,
          details: log.details,
          ip: log.ip,
          risk_level: log.riskLevel
        });
      }
    }
  },

  ingredients: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('ingredients').select('*');
        if (data) return data;
      }
      return [];
    },
    create: async (ing: Ingredient) => {
      if (!isDemoMode) await supabase.from('ingredients').insert(ing);
    },
    update: async (ing: Ingredient) => {
      if (!isDemoMode) await supabase.from('ingredients').update(ing).eq('id', ing.id);
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('ingredients').delete().eq('id', id);
    }
  },

  payments: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('payments').select('*');
        if (data && data.length > 0) return data;
      }
      return [];
    },
    update: async (p: PaymentMethodConfig) => {
      if (!isDemoMode) await supabase.from('payments').update(p).eq('id', p.id);
    },
    toggle: async (id: string) => {
      if (!isDemoMode) {
        const { data } = await supabase.from('payments').select('isActive').eq('id', id).single();
        if (data) await supabase.from('payments').update({ isActive: !data.isActive }).eq('id', id);
      }
    }
  },

  translations: {
    getAll: async () => VirtualDB.get<any>(STORAGE_KEYS.TRANSLATIONS, {}),
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
      await supabase.from('dishes').upsert(localDishes);
      
      onProgress('正在对齐全局系统配置...');
      const localConfig = VirtualDB.get<SystemConfig>(STORAGE_KEYS.CONFIG, {} as any);
      await supabase.from('config').upsert({ id: 'global', ...localConfig });

      onProgress('江西云厨：云端同步任务已完成。');
      return { success: true };
    }
  }
};

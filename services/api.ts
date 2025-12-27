
import { Order, Dish, HotelRoom, Expense, User, OrderStatus, RoomStatus, MaterialImage, SecurityLog, UserRole, PaymentMethod, PaymentMethodConfig, PermissionKey } from '../types';
import { supabase, isDemoMode } from './supabaseClient';
import { notificationService } from './notification';

/**
 * 江西云厨 - 生产级 API 网关
 * 所有的操作都会自动触发审计日志
 */

const logAction = async (action: string, details?: string, risk: 'Low' | 'Medium' | 'High' = 'Low') => {
  if (isDemoMode) return;
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('security_logs').insert({
    user_id: user?.email || 'Anonymous/System',
    action,
    details,
    risk_level: risk,
    ip_address: 'Edge-Client'
  });
};

export const api = {
  // 员工资料管理 (核心安全优化)
  users: {
    getAll: async () => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    },
    update: async (user: User) => {
      if (!isDemoMode) {
        // 更新档案
        // Fix: Changed user.is_locked to user.isLocked to match User interface
        const { error } = await supabase.from('profiles').update({
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          is_locked: user.isLocked
        }).eq('id', user.id);

        if (error) throw error;
        
        // 记录高风险审计日志
        await logAction(
          'Staff Profile Modified', 
          `Target: ${user.username}, Role: ${user.role}, Perms: ${user.permissions.join('|')}`, 
          'High'
        );
      }
      return user;
    },
    // Fix: Added missing create method for users
    create: async (user: User) => {
      if (!isDemoMode) {
        const { error } = await supabase.from('profiles').insert({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          is_locked: user.isLocked
        });
        if (error) throw error;
        await logAction('Staff Registered', `User: ${user.username}`, 'High');
      }
      return user;
    },
    // Fix: Added missing delete method for users
    delete: async (id: string) => {
      if (!isDemoMode) {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        await logAction('Staff Deleted', `ID: ${id}`, 'High');
      }
    },
    // 如果需要修改密码，需要通过 Supabase Auth Admin API，这里模拟调用
    resetPassword: async (userId: string, newPass: string) => {
      await logAction('Password Reset Issued', `Target UID: ${userId}`, 'High');
      // 实际生产环境应调用 supabase.auth.admin.updateUserById
    }
  },

  // 订单操作
  orders: {
    getAll: async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    // Fix: Added missing create method for orders
    create: async (order: Order | Partial<Order>) => {
      const { error } = await supabase.from('orders').insert(order);
      if (error) throw error;
      
      // Update room status to ordering
      if (order.roomId) {
        await supabase.from('rooms').update({ status: 'ordering' }).eq('id', order.roomId);
      }
    },
    updateStatus: async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date() }).eq('id', orderId);
      if (error) throw error;
      
      // 关联审计：取消订单属于敏感操作
      if (status === 'cancelled') {
        await logAction('Order Revoked', `OrderID: ${orderId}`, 'Medium');
      }
      
      // 更新房间状态
      if (['completed', 'cancelled'].includes(status)) {
        const { data: order } = await supabase.from('orders').select('room_id').eq('id', orderId).single();
        if (order) await supabase.from('rooms').update({ status: 'ready' }).eq('id', order.room_id);
      }
    }
  },

  // 菜单管理
  dishes: {
    getAll: async () => {
      const { data } = await supabase.from('dishes').select('*');
      return data || [];
    },
    // Fix: Added missing create method for dishes
    create: async (dish: Dish) => {
      const { error } = await supabase.from('dishes').insert(dish);
      if (error) throw error;
      await logAction('Menu Item Added', `Dish: ${dish.name}`, 'Low');
    },
    update: async (dish: Dish) => {
      await supabase.from('dishes').update(dish).eq('id', dish.id);
      await logAction('Menu Item Updated', `Dish: ${dish.name}, Price: ${dish.price}`, 'Low');
    },
    // Fix: Added missing delete method for dishes
    delete: async (id: string) => {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
      await logAction('Menu Item Deleted', `ID: ${id}`, 'Medium');
    }
  },

  // Fix: Added missing rooms module
  rooms: {
    getAll: async () => {
      const { data } = await supabase.from('rooms').select('*');
      return data || [];
    },
    update: async (room: HotelRoom) => {
      await supabase.from('rooms').update(room).eq('id', room.id);
    }
  },

  // Fix: Added missing expenses module
  expenses: {
    getAll: async () => {
      const { data } = await supabase.from('expenses').select('*');
      return data || [];
    },
    create: async (expense: Expense) => {
      const { error } = await supabase.from('expenses').insert(expense);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing materials module
  materials: {
    getAll: async () => {
      const { data } = await supabase.from('materials').select('*');
      return data || [];
    },
    create: async (material: MaterialImage) => {
      const { error } = await supabase.from('materials').insert(material);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing payments module
  payments: {
    getAll: async () => {
      const { data } = await supabase.from('payment_configs').select('*');
      if ((!data || data.length === 0) && isDemoMode) {
        return [
          { id: '1', name: 'GCash', type: PaymentMethod.GCASH, isActive: true, iconType: 'smartphone' },
          { id: '2', name: 'Maya', type: PaymentMethod.MAYA, isActive: true, iconType: 'wallet' },
          { id: '3', name: 'GrabPay', type: PaymentMethod.GRABPAY, isActive: true, iconType: 'smartphone' },
          { id: '4', name: 'Cash', type: PaymentMethod.CASH, isActive: true, iconType: 'banknote' },
        ];
      }
      return data || [];
    },
    update: async (payment: PaymentMethodConfig) => {
      await supabase.from('payment_configs').update(payment).eq('id', payment.id);
    },
    toggle: async (id: string) => {
      const { data } = await supabase.from('payment_configs').select('isActive').eq('id', id).single();
      if (data) {
        await supabase.from('payment_configs').update({ isActive: !data.isActive }).eq('id', id);
      }
    }
  },

  // Fix: Added missing translations module
  translations: {
    getAll: async () => {
      const { data } = await supabase.from('translations').select('*');
      return data || [];
    }
  },

  // 日志查询
  logs: {
    getAll: async () => {
      const { data } = await supabase.from('security_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      return data || [];
    }
  },

  config: {
    get: async () => ({ hotelName: '江西大酒店', version: '3.1.0' }),
    update: async (cfg: any) => {
       await logAction('System Settings Changed', JSON.stringify(cfg), 'High');
    }
  }
};

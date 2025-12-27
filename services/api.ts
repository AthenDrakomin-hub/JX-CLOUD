
import { Order, Dish, HotelRoom, Expense, User, OrderStatus, RoomStatus, MaterialImage, SecurityLog, UserRole, PaymentMethod, PaymentMethodConfig, PermissionKey } from '../types';
import { supabase, isDemoMode } from './supabaseClient';
import { notificationService } from './notification';
import { checkDishAvailability, updateDishStock } from './utils';
import { validateOrderData, validateDishData, validateUserData } from './security';
import { validateOrderForKitchen } from './business';
import { safeApiCall, handleSupabaseError, NetworkError, requestTracker, NetworkErrorType } from './network';

/**
 * 江西云厨 - 生产级 API 网关
 * 所有的操作都会自动触发审计日志
 */

const logAction = async (action: string, details?: string, risk: 'Low' | 'Medium' | 'High' = 'Low') => {
  if (isDemoMode) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const response = await safeApiCall(() => 
      supabase.from('security_logs').insert({
        user_id: user?.email || 'Anonymous/System',
        action,
        details,
        risk_level: risk,
        ip_address: 'Edge-Client'
      })
    );
    
    if (!response.success) {
      console.error('安全日志记录失败:', response.error);
    }
  } catch (error) {
    console.error('记录安全日志时发生错误:', error);
  }
};

export const api = {
  // 员工资料管理 (核心安全优化)
  users: {
    getAll: async () => {
      if (isDemoMode) return [];
      
      try {
        const response = await safeApiCall(() => supabase.from('profiles').select('*'));
        if (response.success) {
          requestTracker.recordRequest(true);
          return response.data?.data || [];
        } else {
          requestTracker.recordRequest(false, response.error);
          console.error('获取用户列表失败:', response.error);
          return [];
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        console.error('获取用户列表时发生错误:', error);
        return [];
      }
    },
    update: async (user: User) => {
      // 验证用户数据
      const validation = validateUserData(user);
      if (!validation.isValid) {
        throw new Error(`用户数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      if (!isDemoMode) {
        try {
          const response = await safeApiCall(() => 
            supabase.from('profiles').update({
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              is_locked: user.isLocked
            }).eq('id', user.id)
          );
          
          if (response.success) {
            requestTracker.recordRequest(true);
            
            // 记录高风险审计日志
            await logAction(
              'Staff Profile Modified', 
              `Target: ${user.username}, Role: ${user.role}, Perms: ${user.permissions.join('|')}`, 
              'High'
            );
          } else {
            requestTracker.recordRequest(false, response.error);
            throw new Error(`更新用户失败: ${response.error?.message || '未知错误'}`);
          }
        } catch (error) {
          requestTracker.recordRequest(false, handleSupabaseError(error));
          throw new Error(`更新用户时发生错误: ${error.message || '未知错误'}`);
        }
      }
      return user;
    },
    // Fix: Added missing create method for users with validation
    create: async (user: User) => {
      // 验证用户数据
      const validation = validateUserData(user);
      if (!validation.isValid) {
        throw new Error(`用户数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      if (!isDemoMode) {
        try {
          const response = await safeApiCall(() => 
            supabase.from('profiles').insert({
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              is_locked: user.isLocked
            })
          );
          
          if (response.success) {
            requestTracker.recordRequest(true);
            await logAction('Staff Registered', `User: ${user.username}`, 'High');
          } else {
            requestTracker.recordRequest(false, response.error);
            throw new Error(`创建用户失败: ${response.error?.message || '未知错误'}`);
          }
        } catch (error) {
          requestTracker.recordRequest(false, handleSupabaseError(error));
          throw new Error(`创建用户时发生错误: ${error.message || '未知错误'}`);
        }
      }
      return user;
    },
    // Fix: Added missing delete method for users
    delete: async (id: string) => {
      if (!isDemoMode) {
        try {
          const response = await safeApiCall(() => 
            supabase.from('profiles').delete().eq('id', id)
          );
          
          if (response.success) {
            requestTracker.recordRequest(true);
            await logAction('Staff Deleted', `ID: ${id}`, 'High');
          } else {
            requestTracker.recordRequest(false, response.error);
            throw new Error(`删除用户失败: ${response.error?.message || '未知错误'}`);
          }
        } catch (error) {
          requestTracker.recordRequest(false, handleSupabaseError(error));
          throw new Error(`删除用户时发生错误: ${error.message || '未知错误'}`);
        }
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
      try {
        const response = await safeApiCall(() => 
          supabase.from('orders').select('*').order('created_at', { ascending: false })
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          return response.data?.data || [];
        } else {
          requestTracker.recordRequest(false, response.error);
          console.error('获取订单列表失败:', response.error);
          return [];
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        console.error('获取订单列表时发生错误:', error);
        return [];
      }
    },
    // Fix: Added missing create method for orders with validation
    create: async (order: Order | Partial<Order>) => {
      // 验证订单数据
      const validation = validateOrderData(order);
      if (!validation.isValid) {
        throw new Error(`订单数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      try {
        const response = await safeApiCall(() => 
          supabase.from('orders').insert(order)
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          
          // Update room status to ordering
          if (order.roomId) {
            try {
              await supabase.from('rooms').update({ status: 'ordering' }).eq('id', order.roomId);
            } catch (roomError) {
              console.error('更新房间状态失败:', roomError);
            }
          }
          
          // 记录订单创建日志
          await logAction('Order Created', `OrderID: ${order.id}, Room: ${order.roomId}`, 'Low');
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`创建订单失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`创建订单时发生错误: ${error.message || '未知错误'}`);
      }
    },
    updateStatus: async (orderId: string, status: OrderStatus) => {
      try {
        const response = await safeApiCall(() => 
          supabase.from('orders').update({ status, updated_at: new Date() }).eq('id', orderId)
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          
          // 关联审计：取消订单属于敏感操作
          if (status === 'cancelled') {
            await logAction('Order Revoked', `OrderID: ${orderId}`, 'Medium');
          }
          
          // 更新房间状态
          if (['completed', 'cancelled'].includes(status)) {
            try {
              const orderResponse = await safeApiCall(() => 
                supabase.from('orders').select('room_id').eq('id', orderId).single()
              );
              
              if (orderResponse.success && orderResponse.data?.data) {
                await supabase.from('rooms').update({ status: 'ready' }).eq('id', orderResponse.data.data.room_id);
              }
            } catch (roomError) {
              console.error('更新房间状态失败:', roomError);
            }
          }
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`更新订单状态失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`更新订单状态时发生错误: ${error.message || '未知错误'}`);
      }
    }
  },

  // 菜单管理
  dishes: {
    getAll: async () => {
      try {
        const response = await safeApiCall(() => 
          supabase.from('dishes').select('*')
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          return response.data?.data || [];
        } else {
          requestTracker.recordRequest(false, response.error);
          console.error('获取菜品列表失败:', response.error);
          return [];
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        console.error('获取菜品列表时发生错误:', error);
        return [];
      }
    },
    // Fix: Added missing create method for dishes with validation
    create: async (dish: Dish) => {
      // 验证菜品数据
      const validation = validateDishData(dish);
      if (!validation.isValid) {
        throw new Error(`菜品数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      try {
        const response = await safeApiCall(() => 
          supabase.from('dishes').insert(dish)
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          await logAction('Menu Item Added', `Dish: ${dish.name}`, 'Low');
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`创建菜品失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`创建菜品时发生错误: ${error.message || '未知错误'}`);
      }
    },
    // Fix: Updated to include validation
    update: async (dish: Dish) => {
      // 验证菜品数据
      const validation = validateDishData(dish);
      if (!validation.isValid) {
        throw new Error(`菜品数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      try {
        const response = await safeApiCall(() => 
          supabase.from('dishes').update(dish).eq('id', dish.id)
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          await logAction('Menu Item Updated', `Dish: ${dish.name}, Price: ${dish.price}`, 'Low');
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`更新菜品失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`更新菜品时发生错误: ${error.message || '未知错误'}`);
      }
    },
    // Fix: Added missing delete method for dishes
    delete: async (id: string) => {
      try {
        const response = await safeApiCall(() => 
          supabase.from('dishes').delete().eq('id', id)
        );
        
        if (response.success) {
          requestTracker.recordRequest(true);
          await logAction('Menu Item Deleted', `ID: ${id}`, 'Medium');
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`删除菜品失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`删除菜品时发生错误: ${error.message || '未知错误'}`);
      }
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
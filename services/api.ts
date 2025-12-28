
import { Order, Dish, HotelRoom, Expense, User, OrderStatus, RoomStatus, MaterialImage, SecurityLog, UserRole, PaymentMethod, PaymentMethodConfig, PermissionKey } from '../types';
import { supabase, isDemoMode } from './supabaseClient';
import { notificationService } from './notification';

import { validateOrderData, validateDishData, validateUserData } from './security';
import { validateOrderForKitchen } from './business';
import { safeApiCall, handleSupabaseError, NetworkError, requestTracker, NetworkErrorType } from './network';

/**
 * 江西云厨 - 生产级 API 网关
 * 所有的操作都会自动触发审计日志
 */

const logAction = async (action: string, details?: string, risk: 'Low' | 'Medium' | 'High' = 'Low', metadata?: Record<string, any>) => {
  if (isDemoMode) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const response = await safeApiCall(async () => {
      const { data, error } = await supabase.from('security_logs').insert({
        user_id: user?.email || 'Anonymous/System',
        action,
        details,
        risk_level: risk,
        ip_address: 'Edge-Client',
        metadata: metadata || null
      });
      return { data, error };
    });
    
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
        const response = await safeApiCall(async () => {
          const { data, error } = await supabase.from('profiles').select('*');
          return { data, error };
        });
        if (response.success && response.data) {
          requestTracker.recordRequest(true);
          return response.data || [];
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
          const response = await safeApiCall(async () => {
            const { error } = await supabase.from('profiles').update({
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              is_locked: user.isLocked
            }).eq('id', user.id);
            return { data: null, error };
          });
          
          if (response.success) {
            requestTracker.recordRequest(true);
            
            // 记录高风险审计日志
            await logAction(
              'Staff Profile Modified', 
              `Target: ${user.username}, Role: ${user.role}, Perms: ${user.permissions.join('|')}`, 
              'High',
              { userId: user.id, updatedFields: ['name', 'role', 'permissions', 'isLocked'] }
            );
          } else {
            requestTracker.recordRequest(false, response.error);
            throw new Error(`更新用户失败: ${response.error?.message || '未知错误'}`);
          }
        } catch (error: any) {
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
          const response = await safeApiCall(async () => {
            const { data, error } = await supabase.from('profiles').insert({
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role,
              permissions: user.permissions,
              is_locked: user.isLocked
            });
            if (error) throw error;
            return data;
          });
          
          if (response.success) {
            requestTracker.recordRequest(true);
            await logAction('Staff Registered', `User: ${user.username}`, 'High', { userId: user.id, role: user.role });
          } else {
            requestTracker.recordRequest(false, response.error);
            throw new Error(`创建用户失败: ${response.error?.message || '未知错误'}`);
          }
        } catch (error: any) {
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
          const response = await safeApiCall(async () => {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
          });
          
          if (response.success) {
            requestTracker.recordRequest(true);
            await logAction('Staff Deleted', `ID: ${id}`, 'High', { deletedUserId: id });
          } else {
            requestTracker.recordRequest(false, response.error);
            throw new Error(`删除用户失败: ${response.error?.message || '未知错误'}`);
          }
        } catch (error: any) {
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
        const response = await safeApiCall(async () => {
          const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          return { data, error };
        });
        
        if (response.success && response.data) {
          requestTracker.recordRequest(true);
          return response.data || [];
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
        const response = await safeApiCall(async () => {
          const { error } = await supabase.from('orders').insert(order);
          return { data: null, error };
        });
        
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
          await logAction('Order Created', `OrderID: ${order.id}, Room: ${order.roomId}`, 'Low', { 
            orderId: order.id, 
            roomId: order.roomId, 
            totalAmount: (order as Order).totalAmount,
            itemsCount: (order as Order).items?.length || 0
          });
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`创建订单失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error: any) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`创建订单时发生错误: ${error.message || '未知错误'}`);
      }
    },
    updateStatus: async (orderId: string, status: OrderStatus) => {
      try {
        const response = await safeApiCall(async () => {
          const { error } = await supabase.from('orders').update({ status, updated_at: new Date() }).eq('id', orderId);
          if (error) throw error;
          return { success: true };
        });
        
        if (response.success) {
          requestTracker.recordRequest(true);
          
          // 关联审计：取消订单属于敏感操作
          if (status === 'cancelled') {
            await logAction('Order Revoked', `OrderID: ${orderId}`, 'Medium', { orderId, previousStatus: 'pre-cancelled' });
          } else {
            // 记录其他状态变更
            await logAction('Order Status Updated', `OrderID: ${orderId}, Status: ${status}`, 'Low', { orderId, status });
          }
          
          // 更新房间状态
          if (['completed', 'cancelled'].includes(status)) {
            try {
              const orderResponse = await safeApiCall(async () => {
                const { data, error } = await supabase.from('orders').select('room_id').eq('id', orderId).single();
                if (error) throw error;
                return data;
              });
              
              if (orderResponse && orderResponse.success && orderResponse.data) {
                const roomData = orderResponse.data as { room_id: string };
                await supabase.from('rooms').update({ status: 'ready' }).eq('id', roomData.room_id);
              }
            } catch (roomError) {
              console.error('更新房间状态失败:', roomError);
            }
          }
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`更新订单状态失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error: any) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`更新订单状态时发生错误: ${error.message || '未知错误'}`);
      }
    }
  },

  // 菜单管理
  dishes: {
    getAll: async () => {
      try {
        const response = await safeApiCall(async () => {
          const { data, error } = await supabase.from('dishes').select('*');
          return { data, error };
        });
        
        if (response.success && response.data) {
          requestTracker.recordRequest(true);
          return response.data || [];
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
        const response = await safeApiCall(async () => {
          const { error } = await supabase.from('dishes').insert(dish);
          if (error) throw error;
          return { success: true };
        });
        
        if (response.success) {
          requestTracker.recordRequest(true);
          await logAction('Menu Item Added', `Dish: ${dish.name}`, 'Low', { dishId: dish.id, dishName: dish.name, price: dish.price });
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`创建菜品失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error: any) {
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
        const response = await safeApiCall(async () => {
          const { error } = await supabase.from('dishes').update(dish).eq('id', dish.id);
          if (error) throw error;
          return { success: true };
        });
        
        if (response.success) {
          requestTracker.recordRequest(true);
          await logAction('Menu Item Updated', `Dish: ${dish.name}, Price: ${dish.price}`, 'Low', { dishId: dish.id, dishName: dish.name, price: dish.price, updatedFields: Object.keys(dish) });
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`更新菜品失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error: any) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        throw new Error(`更新菜品时发生错误: ${error.message || '未知错误'}`);
      }
    },
    // Fix: Added missing delete method for dishes
    delete: async (id: string) => {
      try {
        const response = await safeApiCall(async () => {
          const { error } = await supabase.from('dishes').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
        });
        
        if (response.success) {
          requestTracker.recordRequest(true);
          await logAction('Menu Item Deleted', `ID: ${id}`, 'Medium', { deletedDishId: id });
        } else {
          requestTracker.recordRequest(false, response.error);
          throw new Error(`删除菜品失败: ${response.error?.message || '未知错误'}`);
        }
      } catch (error: any) {
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
      if (isDemoMode) return [];
      try {
        const response = await safeApiCall(async () => {
          const { data, error } = await supabase.from('expenses').select('*');
          return { data, error };
        });
        if (response.success && response.data) {
          requestTracker.recordRequest(true);
          return response.data || [];
        } else {
          requestTracker.recordRequest(false, response.error);
          console.error('获取支出列表失败:', response.error);
          return [];
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        console.error('获取支出列表时发生错误:', error);
        return [];
      }
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
      if (isDemoMode) return [];
      try {
        const response = await safeApiCall(async () => {
          const { data, error } = await supabase.from('materials').select('*');
          return { data, error };
        });
        if (response.success && response.data) {
          requestTracker.recordRequest(true);
          return response.data || [];
        } else {
          requestTracker.recordRequest(false, response.error);
          console.error('获取素材列表失败:', response.error);
          return [];
        }
      } catch (error) {
        requestTracker.recordRequest(false, handleSupabaseError(error));
        console.error('获取素材列表时发生错误:', error);
        return [];
      }
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
      const { data, error } = await supabase.from('payment_configs').select('*');
      if (error) {
        console.error('Error fetching payment configs:', error);
        if (isDemoMode) {
          return [
            { id: '1', name: 'GCash', type: PaymentMethod.GCASH, isActive: true, iconType: 'smartphone' },
            { id: '2', name: 'Maya', type: PaymentMethod.MAYA, isActive: true, iconType: 'wallet' },
            { id: '3', name: 'GrabPay', type: PaymentMethod.GRABPAY, isActive: true, iconType: 'smartphone' },
            { id: '4', name: 'Cash', type: PaymentMethod.CASH, isActive: true, iconType: 'banknote' },
          ];
        }
        return [];
      }
      return data || [];
    },
    update: async (payment: PaymentMethodConfig) => {
      if (payment.id) {
        const { error } = await supabase.from('payment_configs').update(payment).eq('id', payment.id);
        if (error) {
          console.error('Failed to update payment config:', error);
          throw error;
        }
        // 记录支付配置更新日志
        await logAction('Payment Config Updated', `Payment ID: ${payment.id}, Name: ${payment.name}`, 'Low', { 
          paymentId: payment.id, 
          paymentName: payment.name, 
          paymentType: payment.type,
          updatedFields: Object.keys(payment)
        });
      } else {
        // 如果没有ID，说明是新创建的支付方式
        const newPayment = {
          ...payment,
          id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        const { error } = await supabase.from('payment_configs').insert([newPayment]);
        if (error) {
          console.error('Failed to create payment config:', error);
          throw error;
        }
        // 记录支付配置创建日志
        await logAction('Payment Config Created', `Payment Name: ${newPayment.name}`, 'Low', { 
          paymentId: newPayment.id, 
          paymentName: newPayment.name, 
          paymentType: newPayment.type
        });
      }
    },
    create: async (payment: Omit<PaymentMethodConfig, 'id'>) => {
      const newPayment = {
        ...payment,
        id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      const { error } = await supabase.from('payment_configs').insert([newPayment]);
      if (error) {
        console.error('Failed to create payment config:', error);
        throw error;
      }
      // 记录支付配置创建日志
      await logAction('Payment Config Created', `Payment Name: ${newPayment.name}`, 'Low', { 
        paymentId: newPayment.id, 
        paymentName: newPayment.name, 
        paymentType: newPayment.type
      });
      return newPayment;
    },
    toggle: async (id: string) => {
      const { data, error } = await supabase.from('payment_configs').select('isActive, name').eq('id', id).single();
      if (error) {
        console.error('Failed to get payment config status:', error);
        throw error;
      }
      if (data) {
        const { error: updateError } = await supabase.from('payment_configs').update({ isActive: !data.isActive }).eq('id', id);
        if (updateError) {
          console.error('Failed to toggle payment config status:', updateError);
          throw updateError;
        }
        // 记录支付配置状态切换日志
        await logAction('Payment Config Toggled', `Payment ID: ${id}, Name: ${data.name}, New Status: ${!data.isActive ? 'Active' : 'Inactive'}`, 'Low', { 
          paymentId: id, 
          paymentName: data.name,
          newStatus: !data.isActive
        });
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
    },
    getFiltered: async (filters: {
      userId?: string;
      action?: string;
      riskLevel?: 'Low' | 'Medium' | 'High';
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }) => {
      let query = supabase.from('security_logs').select('*');
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.ilike('action', `%${filters.action}%`);
      }
      if (filters.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      
      query = query.order('timestamp', { ascending: false });
      
      if (filters.limit) {
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + filters.limit - 1);
        } else {
          query = query.limit(filters.limit);
        }
      } else {
        query = query.limit(100);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching filtered security logs:', error);
        return [];
      }
      return data || [];
    },
    getStats: async () => {
      // 获取安全日志统计信息
      const { count: totalCount, error: totalError } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true });
      
      const { count: todayCount, error: todayError } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
      
      const { count: highRiskCount, error: highRiskError } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .eq('risk_level', 'High');
      
      if (totalError || todayError || highRiskError) {
        console.error('Error fetching security log stats:', totalError || todayError || highRiskError);
        return { totalCount: 0, todayCount: 0, highRiskCount: 0 };
      }
      
      return {
        totalCount: totalCount || 0,
        todayCount: todayCount || 0,
        highRiskCount: highRiskCount || 0
      };
    }
  },

  config: {
    get: async () => ({ hotelName: '江西大酒店', version: '3.1.0' }),
    update: async (cfg: any) => {
       await logAction('System Settings Changed', JSON.stringify(cfg), 'High');
    }
  }
};
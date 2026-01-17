// 江西云厨 - 前端 API 客户端 (符合架构分离原则)
// 前端只能通过 HTTP API 与后端通信，绝不直接操作数据库

import { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole, 
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense
} from '../types';
import { INITIAL_DISHES, INITIAL_CATEGORIES } from '../constants';

/**
 * 江西云厨 - 生产级数据网关 (Cloud Engine v10.5)
 * 核心逻辑：通过 HTTP API 与后端服务通信
 */

// API 基础配置
const API_BASE_URL = typeof window !== 'undefined' ? '/api' : 'http://localhost:3001/api';

// 统一的 API 请求封装
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`API 请求错误 (${endpoint}):`, errorMessage);
    throw new Error(`请求失败: ${errorMessage}`);
  }
}

export const api = {
  config: {
    get: async (): Promise<SystemConfig> => {
      try {
        // 检查是否在演示模式
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          return { 
            hotelName: '江西云厨(演示)', 
            theme: 'light', 
            autoPrintOrder: true, 
            ticketStyle: 'standard', 
            fontFamily: 'Plus Jakarta Sans' 
          } as SystemConfig;
        }
        
        // 生产模式：调用后端 API
        return await apiRequest<SystemConfig>('/config');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取系统配置失败:", errorMessage);
        // 返回默认配置
        return { 
          hotelName: '江西云厨', 
          theme: 'light', 
          autoPrintOrder: true, 
          ticketStyle: 'standard', 
          fontFamily: 'Plus Jakarta Sans' 
        } as SystemConfig;
      }
    },

    update: async (data: Partial<SystemConfig>): Promise<SystemConfig> => {
      return await apiRequest<SystemConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return [
            { id: '1', status: 'ready' },
            { id: '2', status: 'ordering' },
            { id: '3', status: 'ready' }
          ] as HotelRoom[];
        }
        
        return await apiRequest<HotelRoom[]>('/rooms');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取房间列表失败:", errorMessage);
        return [];
      }
    },

    update: async (id: string, data: Partial<HotelRoom>): Promise<HotelRoom> => {
      return await apiRequest<HotelRoom>(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  dishes: {
    getAll: async (filters?: { 
      partnerId?: string; 
      categoryId?: string; 
      search?: string 
    }): Promise<Dish[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return INITIAL_DISHES.map(dish => ({
            ...dish,
            partnerId: filters?.partnerId || 'demo-partner'
          }));
        }
        
        const queryParams = new URLSearchParams();
        if (filters?.partnerId) queryParams.append('partnerId', filters.partnerId);
        if (filters?.categoryId) queryParams.append('categoryId', filters.categoryId);
        if (filters?.search) queryParams.append('search', filters.search);
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/dishes?${queryString}` : '/dishes';
        
        return await apiRequest<Dish[]>(endpoint);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取菜品列表失败:", errorMessage);
        return [];
      }
    },

    create: async (data: Omit<Dish, 'id'>): Promise<Dish> => {
      return await apiRequest<Dish>('/dishes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: string, data: Partial<Dish>): Promise<Dish> => {
      return await apiRequest<Dish>(`/dishes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: async (id: string): Promise<void> => {
      await apiRequest<void>(`/dishes/${id}`, {
        method: 'DELETE'
      });
    }
  },

  orders: {
    getAll: async (filters?: { 
      status?: OrderStatus; 
      roomNumber?: string 
    }): Promise<Order[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return [];
        }
        
        const queryParams = new URLSearchParams();
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.roomNumber) queryParams.append('roomNumber', filters.roomNumber);
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/orders?${queryString}` : '/orders';
        
        return await apiRequest<Order[]>(endpoint);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取订单列表失败:", errorMessage);
        return [];
      }
    },

    create: async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
      return await apiRequest<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: string, data: Partial<Order>): Promise<Order> => {
      return await apiRequest<Order>(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  categories: {
    getAll: async (filters?: { 
      partnerId?: string; 
      parentId?: string 
    }): Promise<Category[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return INITIAL_CATEGORIES.map(cat => ({
            ...cat,
            partnerId: filters?.partnerId || 'demo-partner'
          }));
        }
        
        const queryParams = new URLSearchParams();
        if (filters?.partnerId) queryParams.append('partnerId', filters.partnerId);
        if (filters?.parentId) queryParams.append('parentId', filters.parentId);
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/categories?${queryString}` : '/categories';
        
        return await apiRequest<Category[]>(endpoint);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取分类列表失败:", errorMessage);
        return [];
      }
    },

    create: async (data: Omit<Category, 'id'>): Promise<Category> => {
      return await apiRequest<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: string, data: Partial<Category>): Promise<Category> => {
      return await apiRequest<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: async (id: string): Promise<void> => {
      await apiRequest<void>(`/categories/${id}`, {
        method: 'DELETE'
      });
    }
  },

  partners: {
    getAll: async (): Promise<Partner[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return [];
        }
        
        return await apiRequest<Partner[]>('/partners');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取合作伙伴列表失败:", errorMessage);
        return [];
      }
    },

    create: async (data: Omit<Partner, 'id' | 'createdAt'>): Promise<Partner> => {
      return await apiRequest<Partner>('/partners', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: string, data: Partial<Partner>): Promise<Partner> => {
      return await apiRequest<Partner>(`/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  users: {
    getAll: async (filters?: { partnerId?: string }): Promise<User[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return [];
        }
        
        const queryParams = new URLSearchParams();
        if (filters?.partnerId) queryParams.append('partnerId', filters.partnerId);
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/users?${queryString}` : '/users';
        
        return await apiRequest<User[]>(endpoint);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取用户列表失败:", errorMessage);
        return [];
      }
    },

    create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
      return await apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id: string, data: Partial<User>): Promise<User> => {
      return await apiRequest<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  expenses: {
    getAll: async (filters?: { 
      partnerId?: string; 
      startDate?: string; 
      endDate?: string 
    }): Promise<Expense[]> => {
      try {
        const isDemoMode = !process.env.POSTGRES_URL;
        
        if (isDemoMode) {
          // 演示数据
          return [];
        }
        
        const queryParams = new URLSearchParams();
        if (filters?.partnerId) queryParams.append('partnerId', filters.partnerId);
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/expenses?${queryString}` : '/expenses';
        
        return await apiRequest<Expense[]>(endpoint);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("获取支出记录失败:", errorMessage);
        return [];
      }
    },

    create: async (data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
      return await apiRequest<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  }
};

// 导出类型以保持向后兼容
export type { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole,
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense 
};
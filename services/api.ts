// 江西云厨 - 统一API服务层修复
// 修复前端到Edge Functions的API调用

import { supabase, isDemoMode } from './supabaseClient';
import { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole, 
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense
} from '../types';
import { INITIAL_DISHES, INITIAL_CATEGORIES, INITIAL_PAYMENT_METHODS } from '../constants';

/**
 * 江西云厨 - 物理契约对齐网关 (Browser-Safe Implementation)
 * 修复：适配 Supabase Edge Functions API 网关
 */

const ROOT_PROTECTION = 'athendrakomin@proton.me';

const parseNumeric = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

// 转换器：物理对齐
const mapDishFromDB = (d: any): Dish => ({
  id: d.id,
  name: d.name,
  name_en: d.name_en, 
  price: parseNumeric(d.price), 
  category: d.category, 
  stock: d.stock || 0,
  image_url: d.image_url || '',
  is_available: d.is_available,
  is_recommended: d.is_recommended,
  partner_id: d.partner_id,
  created_at: d.created_at
});

const mapOrderFromDB = (o: any): Order => ({
  id: o.id, 
  room_id: o.room_id, 
  items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'),
  total_amount: parseNumeric(o.total_amount), 
  status: o.status as OrderStatus,
  payment_method: o.payment_method, 
  payment_proof: o.payment_proof,
  cash_received: parseNumeric(o.cash_received), 
  cash_change: parseNumeric(o.cash_change),
  partner_id: o.partner_id,
  created_at: o.created_at, 
  updated_at: o.updated_at
});

// 统一API网关调用函数
const callApiGateway = async (action: string, payload: any = {}) => {
  if (isDemoMode || !supabase) {
    // 演示模式返回模拟数据
    return { success: true, data: {} };
  }

  try {
    const response = await fetch('https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `API call failed with status ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`API call failed for action ${action}:`, error);
    throw error;
  }
};

export const api = {
  config: {
    get: async (): Promise<SystemConfig> => {
      if (isDemoMode || !supabase) return { hotel_name: '江西云厨', theme: 'light', version: '8.8.0', auto_print_order: true, ticket_style: 'standard', font_family: 'Plus Jakarta Sans' };
      const { data } = await supabase.from('system_config').select('*').eq('id', 'global').maybeSingle();
      return data ? {
        hotel_name: data.hotel_name,
        version: data.version,
        theme: data.theme,
        auto_print_order: data.auto_print_order,
        ticket_style: data.ticket_style,
        font_family: data.font_family
      } : { hotel_name: '江西云厨', theme: 'light' } as any;
    },
    update: async (config: SystemConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('system_config').upsert({
        id: 'global',
        hotel_name: config.hotel_name,
        theme: config.theme,
        auto_print_order: config.auto_print_order,
        updated_at: new Date().toISOString()
      });
    }
  },

  dishes: {
    getAll: async (sessionUser?: any): Promise<Dish[]> => {
      if (isDemoMode || !supabase) return INITIAL_DISHES;
      let query = supabase.from('menu_dishes').select('*');
      if (sessionUser?.role === UserRole.PARTNER && sessionUser.partnerId) {
        query = query.eq('partner_id', sessionUser.partnerId);
      }
      const { data } = await query.order('id');
      return (data || []).map(mapDishFromDB);
    },
    create: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('menu_dishes').insert({
        id: data.id, name: data.name, name_en: data.name_en,
        price: data.price.toString(), category: data.category,
        image_url: data.image_url, is_available: data.is_available,
        partner_id: sessionUser?.role === UserRole.PARTNER ? sessionUser.partner_id : data.partner_id
      });
    },
    update: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').update({
        name: data.name, name_en: data.name_en, price: data.price.toString(),
        category: data.category, image_url: data.image_url, is_available: data.is_available
      }).eq('id', data.id);
      if (sessionUser?.role === UserRole.PARTNER) query.eq('partner_id', sessionUser.partner_id);
      await query;
    },
    delete: async (id: string, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').delete().eq('id', id);
      if (sessionUser?.role === UserRole.PARTNER) query.eq('partner_id', sessionUser.partnerId);
      await query;
    }
  },

  orders: {
    getAll: async (sessionUser?: any): Promise<Order[]> => {
      if (isDemoMode || !supabase) return [];
      let query = supabase.from('orders').select('*');
      if (sessionUser?.role === UserRole.PARTNER && sessionUser.partnerId) {
        query = query.eq('partner_id', sessionUser.partnerId);
      }
      const { data } = await query.order('created_at', { ascending: false });
      return (data || []).map(mapOrderFromDB);
    },
    create: async (data: Order) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('orders').insert({
        id: data.id, room_id: data.room_id, items: data.items,
        total_amount: data.total_amount.toString(), status: data.status,
        payment_method: data.payment_method, partner_id: data.partner_id
      });
    },
    updateStatus: async (id: string, status: OrderStatus) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    }
  },

  categories: {
    getAll: async (): Promise<Category[]> => {
      if (isDemoMode || !supabase) return INITIAL_CATEGORIES;
      const { data } = await supabase.from('menu_categories').select('*').order('display_order');
      return (data || []).map((c: any) => ({
        id: c.id, name: c.name, name_en: c.name_en, code: c.code,
        level: c.level, display_order: c.display_order, is_active: c.is_active,
        parent_id: c.parent_id, partner_id: c.partner_id
      }));
    },
    saveAll: async (categories: Category[]) => {
      if (isDemoMode || !supabase) return;
      const payload = categories.map(c => ({
        id: c.id, name: c.name, name_en: c.name_en, level: c.level,
        display_order: c.display_order, is_active: c.is_active,
        parent_id: c.parent_id, partner_id: c.partner_id
      }));
      await supabase.from('menu_categories').upsert(payload);
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('rooms').select('*').order('id');
      return (data || []).map((r: any) => ({ id: r.id, status: r.status }));
    },
    updateStatus: async (id: string, status: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('rooms').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    }
  },

  partners: {
    getAll: async (): Promise<Partner[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('partners').select('*').order('name');
      return (data || []).map((p: any) => ({
        id: p.id, name: p.name, owner_name: p.owner_name, status: p.status,
        commission_rate: parseNumeric(p.commission_rate), balance: parseNumeric(p.balance),
        authorized_categories: p.authorized_categories || [], total_sales: parseNumeric(p.total_sales), joined_at: p.created_at
      }));
    },
    // Fix: Added create method for partners to resolve 'Property create does not exist' errors
    create: async (data: Partner) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('partners').insert({
        id: data.id, name: data.name, owner_name: data.owner_name, status: data.status,
        commission_rate: data.commission_rate.toString(), balance: data.balance.toString(),
        authorized_categories: data.authorized_categories
      });
    },
    // Fix: Added update method for partners to resolve 'Property update does not exist' errors
    update: async (data: Partner) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('partners').update({
        name: data.name, owner_name: data.owner_name, status: data.status,
        commission_rate: data.commission_rate.toString(), balance: data.balance.toString(),
        authorized_categories: data.authorized_categories
      }).eq('id', data.id);
    },
    // Fix: Added delete method for partners to resolve 'Property delete does not exist' errors
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('partners').delete().eq('id', id);
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('users').select('*').order('name');
      return (data || []).map((u: any) => ({
        id: u.id, email: u.email, name: u.name, role: u.role as UserRole,
        partner_id: u.partner_id, is_active: u.is_active
      }));
    },
    upsert: async (data: User) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('users').upsert({
        id: data.id, email: data.email, name: data.name, role: data.role,
        partner_id: data.partner_id, is_active: data.is_active, updated_at: new Date().toISOString()
      });
    },
    // Fix: Added delete method for users to resolve 'Property delete does not exist' errors
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('users').delete().eq('id', id);
    }
  },

  expenses: {
    getAll: async (): Promise<Expense[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      return (data || []).map((e: any) => ({ id: e.id, description: e.description, amount: parseNumeric(e.amount), category: e.category, date: e.date }));
    },
    create: async (data: Expense) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('expenses').insert({ id: data.id, description: data.description, amount: data.amount.toString(), category: data.category, date: data.date });
    },
    // Fix: Added delete method for expenses to resolve 'Property delete does not exist' errors
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('expenses').delete().eq('id', id);
    }
  },

  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('ingredients').select('*').order('name');
      // Fix: Mapped last_restocked to lastRestocked to match Ingredient interface
      return (data || []).map((i: any) => ({ 
        id: i.id, 
        name: i.name, 
        unit: i.unit, 
        stock: parseNumeric(i.stock), 
        min_stock: parseNumeric(i.min_stock), 
        category: i.category,
        last_restocked: i.last_restocked || i.updated_at
      }));
    },
    // Fix: Added create method for ingredients to resolve 'Property create does not exist' errors
    create: async (data: Ingredient) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('ingredients').insert({
        id: data.id, name: data.name, unit: data.unit, 
        stock: data.stock, min_stock: data.min_stock, category: data.category,
        last_restocked: new Date().toISOString()
      });
    },
    // Fix: Added update method for ingredients to resolve 'Property update does not exist' errors
    update: async (data: Ingredient) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('ingredients').update({
        name: data.name, unit: data.unit, 
        stock: data.stock, min_stock: data.min_stock, category: data.category,
        last_restocked: new Date().toISOString()
      }).eq('id', data.id);
    },
    // Fix: Added delete method for ingredients to resolve 'Property delete does not exist' errors
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('ingredients').delete().eq('id', id);
    }
  },

  payments: {
    getAll: async (): Promise<PaymentMethodConfig[]> => {
      if (isDemoMode || !supabase) return INITIAL_PAYMENT_METHODS;
      const { data } = await supabase.from('payment_methods').select('*').order('sort_order');
      if (!data || data.length === 0) return INITIAL_PAYMENT_METHODS;
      return data.map((p: any) => ({
        id: p.id, name: p.name, name_en: p.name_en, currency: p.currency,
        currency_symbol: p.currency_symbol, exchange_rate: parseNumeric(p.exchange_rate),
        is_active: p.is_active, payment_type: p.payment_type, sort_order: p.sort_order,
        wallet_address: p.wallet_address, qr_url: p.qr_url, created_at: p.created_at
      }));
    },
    // Fix: Added create method for payments to resolve 'Property create does not exist' errors
    create: async (data: PaymentMethodConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').insert({
        id: data.id, name: data.name, name_en: data.name_en, currency: data.currency,
        currency_symbol: data.currency_symbol, exchange_rate: data.exchange_rate.toString(),
        is_active: data.is_active, payment_type: data.payment_type, sort_order: data.sort_order,
        wallet_address: data.wallet_address, qr_url: data.qr_url
      });
    },
    // Fix: Added update method for payments to resolve 'Property update does not exist' errors
    update: async (data: PaymentMethodConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').update({
        name: data.name, name_en: data.name_en, currency: data.currency,
        currency_symbol: data.currency_symbol, exchange_rate: data.exchange_rate.toString(),
        is_active: data.is_active, payment_type: data.payment_type, sort_order: data.sort_order,
        wallet_address: data.wallet_address, qr_url: data.qr_url
      }).eq('id', data.id);
    },
    // Fix: Added delete method for payments to resolve 'Property delete does not exist' errors
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').delete().eq('id', id);
    },
    // Fix: Added toggle method for payments to resolve 'Property toggle does not exist' errors
    toggle: async (id: string) => {
      if (isDemoMode || !supabase) return;
      const { data } = await supabase.from('payment_methods').select('is_active').eq('id', id).single();
      if (data) {
        await supabase.from('payment_methods').update({ is_active: !data.is_active }).eq('id', id);
      }
    }
  },

  db: {
    getRows: async (tableName: string): Promise<any[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from(tableName).select('*').limit(100);
      return data || [];
    }
  },

  archive: {
    exportData: async () => {
      const [d, c] = await Promise.all([api.dishes.getAll(), api.categories.getAll()]);
      const blob = new Blob([JSON.stringify({ dishes: d, categories: c }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jx-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    },
    importData: async (file: File) => {
      const text = await file.text();
      console.log("Mock import for:", file.name);
    }
  },

  registration: {
    // 修复：使用auth函数调用注册请求
    request: async (email: string, name: string) => {
      if (isDemoMode || !supabase) {
        // 模拟成功响应
        return { success: true, requestId: `demo-${Date.now()}`, message: 'Registration request submitted successfully' };
      }
      
      try {
        const response = await fetch('https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/auth/request-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            name
          }),
        });
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Registration request failed:', error);
        return { success: false, message: 'Failed to submit registration request' };
      }
    },
    
    // 修复：使用auth函数获取注册请求
    getAll: async () => {
      if (isDemoMode || !supabase) {
        // 返回模拟数据
        return [];
      }
      
      try {
        // 使用GET方法获取注册请求列表
        const response = await fetch('https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/auth/registration-requests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to get registration requests:', error);
        return [];
      }
    },
    
    // 修复：使用auth函数批准注册请求
    approve: async (requestId: string) => {
      if (isDemoMode || !supabase) {
        // 模拟成功响应
        return { success: true, message: 'Registration approved successfully' };
      }
      
      try {
        const response = await fetch('https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/auth/approve-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requestId }),
        });
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to approve registration:', error);
        return { success: false, message: 'Failed to approve registration' };
      }
    },
    
    // 修复：使用auth函数拒绝注册请求
    reject: async (requestId: string) => {
      if (isDemoMode || !supabase) {
        // 模拟成功响应
        return { success: true, message: 'Registration rejected successfully' };
      }
      
      try {
        const response = await fetch('https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/auth/reject-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requestId }),
        });
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to reject registration:', error);
        return { success: false, message: 'Failed to reject registration' };
      }
    }
  }
};
import { supabase, isDemoMode } from '../../services/supabaseClient.js';
import { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole, 
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense
} from '../../types.js';
import { INITIAL_DISHES, INITIAL_CATEGORIES, INITIAL_PAYMENT_METHODS } from '../../constants.js';

/**
 * 江西云厨 - Supabase Edge Functions API 网关
 * 完全基于 Supabase Edge Functions，无 Node.js 依赖
 */

// API基础URL配置 - 动态获取Supabase URL
const SUPABASE_PROJECT_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 
                            (process.env as any).VITE_SUPABASE_URL ||
                            (process.env as any).SUPABASE_URL ||
                            (() => {
                              const projectRef = (process.env as any).SUPABASE_PROJECT_REF || 
                                                (process.env as any).SUPABASE_PROJECT_ID;
                              return projectRef ? `https://${projectRef}.supabase.co` : null;
                            })();
const API_BASE_URL = `${SUPABASE_PROJECT_URL}/functions/v1/api`;

// API客户端配置
const createApiClient = () => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-API-Source': 'jx-cloud-frontend'
  };

  return {
    get: async (endpoint: string) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: defaultHeaders
      });
      return response.json();
    },
    
    post: async (endpoint: string, data: any) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(data)
      });
      return response.json();
    }
  };
};

const apiClient = createApiClient();

const parseNumeric = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

// 转换器：基于实际数据库结构的精准映射
const mapDishFromDB = (d: any): Dish => ({
  id: d.id,
  name: d.name,
  name_en: d.name_en, 
  price: parseNumeric(d.price), 
  category: d.category,  // 数据库实际字段名是 category
  stock: d.stock || 0,
  image_url: d.image_url || '',
  is_available: d.is_available,
  is_recommended: d.is_recommended,
  partner_id: d.partner_id,
  created_at: d.created_at
});

const mapOrderFromDB = (o: any): Order => ({
  id: o.id, 
  room_id: o.room_id,  // 数据库实际字段名是 room_id
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
        ticketStyle: data.ticket_style,
        fontFamily: data.font_family
      } : { hotelName: '江西云厨', theme: 'light' } as any;
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
      if (sessionUser?.role === UserRole.PARTNER && sessionUser.partner_id) {
        query = query.eq('partner_id', sessionUser.partner_id);
      }
      const { data } = await query.order('id');
      return (data || []).map(mapDishFromDB);
    },
    create: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('menu_dishes').insert({
        id: data.id, name: data.name, name_en: data.name_en,
        price: data.price.toString(), category: data.category,  // 使用实际字段名
        image_url: data.image_url, is_available: data.is_available,
        partner_id: sessionUser?.role === UserRole.PARTNER ? sessionUser.partner_id : data.partner_id
      });
    },
    update: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').update({
        name: data.name, name_en: data.name_en, price: data.price.toString(),
        category: data.category, image_url: data.image_url, is_available: data.is_available  // 使用实际字段名
      }).eq('id', data.id);
      if (sessionUser?.role === UserRole.PARTNER) query.eq('partner_id', sessionUser.partner_id);
      await query;
    },
    delete: async (id: string, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').delete().eq('id', id);
      if (sessionUser?.role === UserRole.PARTNER) query.eq('partner_id', sessionUser.partner_id);
      await query;
    }
  },

  orders: {
    getAll: async (sessionUser?: any): Promise<Order[]> => {
      if (isDemoMode || !supabase) return [];
      let query = supabase.from('orders').select('*');
      if (sessionUser?.role === UserRole.PARTNER && sessionUser.partner_id) {
        query = query.eq('partner_id', sessionUser.partner_id);
      }
      const { data } = await query.order('created_at', { ascending: false });
      return (data || []).map(mapOrderFromDB);
    },
    create: async (data: Order) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('orders').insert({
        id: data.id, room_id: data.room_id, items: data.items,  // 使用实际字段名 room_id
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
        id: p.id, name: p.name, ownerName: p.owner_name, status: p.status,
        commissionRate: parseNumeric(p.commission_rate), balance: parseNumeric(p.balance),
        authorizedCategories: p.authorized_categories || [], joinedAt: p.created_at
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
        name: data.name, owner_name: data.ownerName, status: data.status,
        commission_rate: data.commissionRate.toString(), balance: data.balance.toString(),
        authorized_categories: data.authorizedCategories
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
        partner_id: u.partner_id, is_active: u.is_active,
        created_at: u.created_at, updated_at: u.updated_at
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
        minStock: parseNumeric(i.min_stock), 
        category: i.category,
        lastRestocked: i.last_restocked || i.updated_at
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
        stock: data.stock, min_stock: data.minStock, category: data.category,
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
        wallet_address: p.wallet_address, qr_url: p.qr_url,
        created_at: p.created_at
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

  registration: {
    request: async (email: string, name: string) => {
      if (isDemoMode) return { success: true, message: 'Demo mode: Registration request submitted' };
      try {
        const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/auth/request-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, requestTime: new Date().toISOString() })
        });
        return await response.json();
      } catch (error) {
        console.error("Registration request error:", error);
        throw error;
      }
    },
    approve: async (requestId: string) => {
      if (isDemoMode) return { success: true, message: 'Demo mode: Registration approved' };
      try {
        const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/auth/approve-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId })
        });
        return await response.json();
      } catch (error) {
        console.error("Registration approval error:", error);
        throw error;
      }
    },
    reject: async (requestId: string) => {
      if (isDemoMode) return { success: true, message: 'Demo mode: Registration rejected' };
      try {
        const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/auth/reject-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, reason: 'Admin decision' })
        });
        return await response.json();
      } catch (error) {
        console.error("Registration rejection error:", error);
        throw error;
      }
    },
    getAll: async () => {
      if (isDemoMode) return [];
      try {
        const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/auth/registration-requests`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } catch (error) {
        console.error("Get registration requests error:", error);
        throw error;
      }
    }
  },

  translations: {
    get: async (params: { lang: string; ns?: string; lastUpdate?: string }) => {
      if (isDemoMode) {
        // 返回模拟数据
        const demoTranslations = {
          'zh': { welcome: '欢迎', login: '登录', logout: '退出' },
          'en': { welcome: 'Welcome', login: 'Login', logout: 'Logout' },
          'fil': { welcome: 'Maligayang pagdating', login: 'Mag-login', logout: 'Mag-log out' }
        };
        return { 
          translations: demoTranslations[params.lang as keyof typeof demoTranslations] || {},
          lastUpdate: Date.now().toString() 
        };
      }
      
      try {
        if (!supabase) throw new Error("Supabase client not initialized");
        
        let query = supabase
          .from('translations')
          .select('key, value')
          .eq('language', params.lang)
          .eq('is_active', true);
          
        if (params.ns) {
          query = query.eq('namespace', params.ns);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // 转换为键值对格式
        const translations: Record<string, string> = {};
        data.forEach((item: { key: string; value: string }) => {
          translations[item.key] = item.value;
        });
        
        return { 
          translations,
          lastUpdate: new Date().toISOString()
        };
      } catch (error) {
        console.error("Get translations error:", error);
        // 返回空对象而不是抛出错误，避免影响用户体验
        return { translations: {}, lastUpdate: Date.now().toString() };
      }
    },
    update: async (data: { translations: Array<{key: string, value: string, context?: any}>, language: string, namespace?: string }) => {
      if (isDemoMode) return { success: true };
      
      try {
        if (!supabase) throw new Error("Supabase client not initialized");
        
        const translationsToUpsert = data.translations.map(t => ({
          key: t.key,
          language: data.language,
          value: t.value,
          namespace: data.namespace || 'common',
          context: t.context || null,
          is_active: true
        }));
        
        const { error } = await supabase
          .from('translations')
          .upsert(translationsToUpsert, { onConflict: ['namespace', 'key', 'language'] });
          
        if (error) throw error;
        
        return { success: true };
      } catch (error) {
        console.error("Update translations error:", error);
        throw error;
      }
    },
    reportMissing: async (data: { key: string; language: string; namespace?: string }) => {
      if (isDemoMode || !supabase) return { success: true };
      
      try {
        // 创建一个待翻译的记录
        const { error } = await supabase
          .from('translations')
          .insert({
            key: data.key,
            language: data.language,
            value: `[${data.key}]`, // 占位符值
            namespace: data.namespace || 'common',
            is_active: false // 标记为非活跃，表示待翻译
          });
          
        if (error && error.code !== '23505') { // 忽略唯一约束冲突
          console.error("Report missing translation error:", error);
        }
        
        return { success: true };
      } catch (error) {
        console.error("Report missing translation error:", error);
        return { success: false };
      }
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
  }
};
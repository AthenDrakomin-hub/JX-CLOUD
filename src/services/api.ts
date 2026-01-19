
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

// API基础URL配置 - 统一指向Supabase Edge Functions
const SUPABASE_PROJECT_URL = 'https://zlbemopcgjohrnyyiwvs.supabase.co';
const API_BASE_URL = `${SUPABASE_PROJECT_URL}/functions/v1`;

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
  nameEn: d.name_en, 
  description: d.description,
  tags: d.tags || [],
  price: parseNumeric(d.price), 
  categoryId: d.category,  // 数据库实际字段名是 category
  stock: d.stock || 0,
  imageUrl: d.image_url || '',
  isAvailable: d.is_available,
  isRecommended: d.is_recommended,
  partnerId: d.partner_id
});

const mapOrderFromDB = (o: any): Order => ({
  id: o.id, 
  tableId: o.room_id,  // 数据库实际字段名是 room_id
  customerId: o.customer_id,
  items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'),
  totalAmount: parseNumeric(o.total_amount), 
  status: o.status as OrderStatus,
  paymentMethod: o.payment_method, 
  paymentProof: o.payment_proof,
  cashReceived: parseNumeric(o.cash_received), 
  cashChange: parseNumeric(o.cash_change),
  isPrinted: o.is_printed,
  partnerId: o.partner_id,
  createdAt: o.created_at, 
  updatedAt: o.updated_at
});

export const api = {
  config: {
    get: async (): Promise<SystemConfig> => {
      if (isDemoMode || !supabase) return { hotelName: '江西云厨', theme: 'light', version: '8.8.0', autoPrintOrder: true, ticketStyle: 'standard', fontFamily: 'Plus Jakarta Sans' };
      const { data } = await supabase.from('system_config').select('*').eq('id', 'global').maybeSingle();
      return data ? {
        hotelName: data.hotel_name,
        version: data.version,
        theme: data.theme,
        autoPrintOrder: data.auto_print_order,
        ticketStyle: data.ticket_style,
        fontFamily: data.font_family
      } : { hotelName: '江西云厨', theme: 'light' } as any;
    },
    update: async (config: SystemConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('system_config').upsert({
        id: 'global',
        hotel_name: config.hotelName,
        theme: config.theme,
        auto_print_order: config.autoPrintOrder,
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
        id: data.id, name: data.name, name_en: data.nameEn,
        price: data.price.toString(), category: data.categoryId,  // 使用实际字段名
        image_url: data.imageUrl, is_available: data.isAvailable,
        partner_id: sessionUser?.role === UserRole.PARTNER ? sessionUser.partnerId : data.partnerId
      });
    },
    update: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').update({
        name: data.name, name_en: data.nameEn, price: data.price.toString(),
        category: data.categoryId, image_url: data.imageUrl, is_available: data.isAvailable  // 使用实际字段名
      }).eq('id', data.id);
      if (sessionUser?.role === UserRole.PARTNER) query.eq('partner_id', sessionUser.partnerId);
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
        id: data.id, room_id: data.tableId, items: data.items,  // 使用实际字段名 room_id
        total_amount: data.totalAmount.toString(), status: data.status,
        payment_method: data.paymentMethod, partner_id: data.partnerId
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
        id: c.id, name: c.name, nameEn: c.name_en, code: c.code,
        level: c.level, displayOrder: c.display_order, isActive: c.is_active,
        parentId: c.parent_id, partnerId: c.partner_id
      }));
    },
    saveAll: async (categories: Category[]) => {
      if (isDemoMode || !supabase) return;
      const payload = categories.map(c => ({
        id: c.id, name: c.name, name_en: c.nameEn, level: c.level,
        display_order: c.displayOrder, is_active: c.isActive,
        parent_id: c.parentId, partner_id: c.partnerId
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
        id: data.id, name: data.name, owner_name: data.ownerName, status: data.status,
        commission_rate: data.commissionRate.toString(), balance: data.balance.toString(),
        authorized_categories: data.authorizedCategories
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
        partnerId: u.partner_id, isActive: u.is_active
      }));
    },
    upsert: async (data: User) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('users').upsert({
        id: data.id, email: data.email, name: data.name, role: data.role,
        partner_id: data.partnerId, is_active: data.isActive, updated_at: new Date().toISOString()
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
        stock: data.stock, min_stock: data.minStock, category: data.category,
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
        id: p.id, name: p.name, nameEn: p.name_en, currency: p.currency,
        currencySymbol: p.currency_symbol, exchangeRate: parseNumeric(p.exchange_rate),
        isActive: p.is_active, paymentType: p.payment_type, sortOrder: p.sort_order,
        description: p.description, descriptionEn: p.description_en, iconType: p.icon_type,
        walletAddress: p.wallet_address, qrUrl: p.qr_url
      }));
    },
    // Fix: Added create method for payments to resolve 'Property create does not exist' errors
    create: async (data: PaymentMethodConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').insert({
        id: data.id, name: data.name, name_en: data.nameEn, currency: data.currency,
        currency_symbol: data.currencySymbol, exchange_rate: data.exchangeRate.toString(),
        is_active: data.isActive, payment_type: data.paymentType, sort_order: data.sortOrder,
        description: data.description, description_en: data.descriptionEn, icon_type: data.iconType,
        wallet_address: data.walletAddress, qr_url: data.qrUrl
      });
    },
    // Fix: Added update method for payments to resolve 'Property update does not exist' errors
    update: async (data: PaymentMethodConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').update({
        name: data.name, name_en: data.nameEn, currency: data.currency,
        currency_symbol: data.currencySymbol, exchange_rate: data.exchangeRate.toString(),
        is_active: data.isActive, payment_type: data.paymentType, sort_order: data.sortOrder,
        description: data.description, description_en: data.descriptionEn, icon_type: data.iconType,
        wallet_address: data.walletAddress, qr_url: data.qrUrl
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
        const response = await fetch(`${API_BASE_URL}/auth/request-registration`, {
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
        const response = await fetch(`${API_BASE_URL}/auth/approve-registration`, {
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
        const response = await fetch(`${API_BASE_URL}/auth/reject-registration`, {
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
        const response = await fetch(`${API_BASE_URL}/auth/registration-requests`, {
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
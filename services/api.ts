
import { supabase, isDemoMode } from './supabaseClient';
import { 
  Partner, Order, Dish, OrderStatus, SystemConfig, UserRole, 
  Category, Ingredient, PaymentMethodConfig, HotelRoom, User, Expense
} from '../types';
import { INITIAL_DISHES, INITIAL_CATEGORIES } from '../constants';

/**
 * 江西云厨 - 生产级数据网关 (Cloud Engine v10.5)
 * 核心逻辑：彻底打通全业务线的物理层持久化。
 */

export const api = {
  config: {
    get: async (): Promise<SystemConfig> => {
      if (isDemoMode || !supabase) return { hotelName: '江西云厨(演示)', theme: 'light', autoPrintOrder: true, ticketStyle: 'standard', fontFamily: 'Plus Jakarta Sans' } as any;
      const { data, error } = await supabase.from('system_config').select('*').eq('id', 'global').maybeSingle();
      if (error || !data) return { hotelName: '江西云厨', theme: 'light', autoPrintOrder: true, ticketStyle: 'standard', fontFamily: 'Plus Jakarta Sans' } as any;
      return {
        hotelName: data.hotel_name,
        version: data.version,
        theme: data.theme || 'light',
        autoPrintOrder: data.auto_print ?? true,
        ticketStyle: data.ticket_style || 'standard',
        fontFamily: data.font_family || 'Plus Jakarta Sans'
      } as any;
    },
    update: async (config: SystemConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('system_config').upsert({
        id: 'global',
        hotel_name: config.hotelName,
        theme: config.theme,
        auto_print: config.autoPrintOrder,
        ticket_style: config.ticketStyle,
        font_family: config.fontFamily,
        updated_at: new Date().toISOString()
      });
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      if (isDemoMode || !supabase) {
        // 使用与 constants.ts 中一致的房间号
        const { ROOM_NUMBERS } = await import('../constants');
        return ROOM_NUMBERS.map(id => ({ id, status: 'ready' }));
      }
      const { data, error } = await supabase.from('rooms').select('*').order('id');
      if (error) throw error;
      return data.map((r: any) => ({ id: r.id, status: r.status }));
    },
    updateStatus: async (id: string, status: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('rooms').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    }
  },

  dishes: {
    getAll: async (sessionUser?: any): Promise<Dish[]> => {
      if (isDemoMode || !supabase) return INITIAL_DISHES;
      let query = supabase.from('menu_dishes').select('*');
      if (sessionUser?.role === UserRole.PARTNER && sessionUser.partnerId) {
        query = query.eq('partner_id', sessionUser.partnerId);
      }
      const { data, error } = await query.order('id');
      if (error) return INITIAL_DISHES;
      return data.map((d: any) => ({
        id: d.id, name: d.name, name_en: d.name_en, description: d.description,
        tags: d.tags || [], price: Number(d.price), category: d.category,
        stock: d.stock, image_url: d.image_url, is_available: d.is_available,
        is_recommended: d.is_recommended, partnerId: d.partner_id
      }));
    },
    create: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const partnerId = sessionUser?.role === UserRole.PARTNER ? sessionUser.partnerId : data.partnerId;
      await supabase.from('menu_dishes').insert({
        id: data.id, name: data.name, name_en: data.name_en, description: data.description,
        tags: data.tags, price: data.price, category: data.category, stock: data.stock,
        image_url: data.image_url, is_available: data.is_available,
        is_recommended: data.is_recommended, partner_id: partnerId
      });
    },
    update: async (data: Dish, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').update({
        name: data.name, name_en: data.name_en, description: data.description,
        tags: data.tags, price: data.price, category: data.category, stock: data.stock,
        image_url: data.image_url, is_available: data.is_available, is_recommended: data.is_recommended
      }).eq('id', data.id);
      if (sessionUser.role !== UserRole.ADMIN) query.eq('partner_id', sessionUser.partnerId);
      await query;
    },
    delete: async (id: string, sessionUser: any) => {
      if (isDemoMode || !supabase) return;
      const query = supabase.from('menu_dishes').delete().eq('id', id);
      if (sessionUser.role !== UserRole.ADMIN) query.eq('partner_id', sessionUser.partnerId);
      await query;
    }
  },

  orders: {
    getAll: async (sessionUser?: any): Promise<Order[]> => {
      if (isDemoMode || !supabase) return [];
      let query = supabase.from('orders').select('*');
      if (sessionUser?.role === UserRole.PARTNER && sessionUser.partnerId) {
        query = query.filter('items', 'cs', JSON.stringify([{ partnerId: sessionUser.partnerId }]));
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return [];
      return data.map((o: any) => ({
        id: o.id, roomId: o.room_id, customerId: o.customer_id, items: o.items,
        totalAmount: Number(o.total_amount), status: o.status as OrderStatus,
        paymentMethod: o.payment_method, paymentProof: o.payment_proof,
        cash_received: Number(o.cash_received || 0), cash_change: Number(o.cash_change || 0),
        createdAt: o.created_at, updatedAt: o.updated_at
      }));
    },
    create: async (data: Order) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('orders').insert({
        id: data.id, room_id: data.roomId, customer_id: data.customerId,
        items: data.items, total_amount: data.totalAmount, status: data.status,
        payment_method: data.paymentMethod, payment_proof: data.paymentProof,
        cash_received: data.cash_received, cash_change: data.cash_change
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
      const { data, error } = await supabase.from('menu_categories').select('*').order('display_order');
      if (error || !data) return INITIAL_CATEGORIES;
      return data.map((c: any) => ({
        id: c.id, name: c.name, name_en: c.name_en, code: c.code, level: c.level,
        display_order: c.display_order, is_active: c.is_active, parent_id: c.parent_id, partnerId: c.partner_id
      }));
    },
    saveAll: async (cats: Category[]) => {
      if (isDemoMode || !supabase) return;
      const payload = cats.map(c => ({
        id: c.id, name: c.name, name_en: c.name_en, code: c.code, level: c.level,
        display_order: c.display_order, is_active: c.is_active, parent_id: c.parent_id, partner_id: c.partnerId
      }));
      await supabase.from('menu_categories').upsert(payload);
    }
  },

  partners: {
    getAll: async (): Promise<Partner[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('partners').select('*').order('name');
      return (data || []).map((p: any) => ({
        id: p.id, name: p.name, ownerName: p.owner_name, status: p.status,
        commissionRate: Number(p.commission_rate), balance: Number(p.balance),
        contact: p.contact, email: p.email, authorizedCategories: p.authorized_categories || [],
        totalSales: Number(p.total_sales || 0), joinedAt: p.joined_at
      } as any));
    },
    getProfile: async (userId: string): Promise<Partner | null> => {
      if (isDemoMode || !supabase) return null;
      const { data: userData } = await supabase.from('users').select('partner_id').eq('id', userId).maybeSingle();
      if (!userData?.partner_id) return null;
      const { data: partnerData } = await supabase.from('partners').select('*').eq('id', userData.partner_id).maybeSingle();
      if (!partnerData) return null;
      return {
        id: partnerData.id, name: partnerData.name, ownerName: partnerData.owner_name,
        status: partnerData.status, commissionRate: Number(partnerData.commission_rate),
        balance: Number(partnerData.balance), contact: partnerData.contact, email: partnerData.email,
        authorizedCategories: partnerData.authorized_categories || [], totalSales: Number(partnerData.total_sales || 0),
        joinedAt: partnerData.joined_at
      } as any;
    },
    create: async (data: Partner) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('partners').insert({
        id: data.id, name: data.name, owner_name: data.ownerName, status: data.status,
        commission_rate: data.commissionRate, balance: data.balance,
        contact: data.contact, email: data.email, authorized_categories: data.authorizedCategories,
        total_sales: data.totalSales
      });
    },
    update: async (data: Partner) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('partners').update({
        name: data.name, owner_name: data.ownerName, status: data.status,
        commission_rate: data.commissionRate, contact: data.contact, email: data.email,
        authorized_categories: data.authorizedCategories
      }).eq('id', data.id);
    },
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('partners').delete().eq('id', id);
    }
  },

  expenses: {
    getAll: async (): Promise<Expense[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      return (data || []).map((e: any) => ({
        id: e.id, amount: Number(e.amount), category: e.category, date: e.date
      }));
    },
    create: async (data: Expense) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('expenses').insert({
        id: data.id, amount: data.amount, category: data.category, date: data.date
      });
    },
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('expenses').delete().eq('id', id);
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from('users').select('*').order('role');
      return (data || []).map((u: any) => ({
        id: u.id, username: u.username, email: u.email, role: u.role as UserRole,
        name: u.name, partnerId: u.partner_id, modulePermissions: u.module_permissions
      }));
    },
    upsert: async (data: User) => {
      if (isDemoMode || !supabase) return;
      // 根管理员硬保护逻辑
      if (data.email === 'athendrakomin@proton.me') {
         data.role = UserRole.ADMIN;
      }
      await supabase.from('users').upsert({
        id: data.id, username: data.username, email: data.email, name: data.name,
        role: data.role, partner_id: data.partnerId, module_permissions: data.modulePermissions,
        updated_at: new Date().toISOString()
      });
    },
    delete: async (id: string, requesterEmail?: string) => {
      if (isDemoMode || !supabase) return;
      const { data: target } = await supabase.from('users').select('email').eq('id', id).single();
      if (target?.email === 'athendrakomin@proton.me') throw new Error("物理资产锁定：无法删除根管理员。");
      await supabase.from('users').delete().eq('id', id);
    }
  },

  payments: {
    getAll: async (): Promise<PaymentMethodConfig[]> => {
      if (isDemoMode || !supabase) return [];
      const { data, error } = await supabase.from('payment_methods').select('*').order('sort_order');
      if (error) return [];
      return data.map((p: any) => ({
        id: p.id, name: p.name, name_en: p.name_en, currency: p.currency,
        currency_symbol: p.currency_symbol, exchange_rate: Number(p.exchange_rate),
        isActive: p.is_active, payment_type: p.payment_type, sort_order: p.sort_order,
        description: p.description, description_en: p.description_en,
        iconType: p.icon_type, wallet_address: p.wallet_address, qr_url: p.qr_url
      }));
    },
    toggle: async (id: string) => {
      if (isDemoMode || !supabase) return;
      const { data } = await supabase.from('payment_methods').select('is_active').eq('id', id).single();
      if (data) await supabase.from('payment_methods').update({ is_active: !data.is_active }).eq('id', id);
    },
    create: async (data: PaymentMethodConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').insert({
        id: data.id, name: data.name, name_en: data.name_en, currency: data.currency,
        currency_symbol: data.currency_symbol, exchange_rate: data.exchange_rate,
        is_active: data.isActive, payment_type: data.payment_type, sort_order: data.sort_order,
        description: data.description, description_en: data.description_en,
        icon_type: data.iconType, wallet_address: data.wallet_address, qr_url: data.qr_url
      });
    },
    update: async (data: PaymentMethodConfig) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').update({
        name: data.name, name_en: data.name_en, currency: data.currency,
        currency_symbol: data.currency_symbol, exchange_rate: data.exchange_rate,
        is_active: data.isActive, payment_type: data.payment_type, sort_order: data.sort_order,
        description: data.description, description_en: data.description_en,
        icon_type: data.iconType, wallet_address: data.wallet_address, qr_url: data.qr_url
      }).eq('id', data.id);
    },
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('payment_methods').delete().eq('id', id);
    }
  },

  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      if (isDemoMode || !supabase) return [];
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) return [];
      return data.map((i: any) => ({
        id: i.id, name: i.name, unit: i.unit, stock: Number(i.stock),
        minStock: Number(i.min_stock), category: i.category, last_restocked: i.last_restocked
      }));
    },
    create: async (data: Ingredient) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('ingredients').insert({
        id: data.id, name: data.name, unit: data.unit, stock: data.stock,
        min_stock: data.minStock, category: data.category, last_restocked: data.last_restocked
      });
    },
    update: async (data: Ingredient) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('ingredients').update({
        name: data.name, unit: data.unit, stock: data.stock, min_stock: data.minStock,
        category: data.category, last_restocked: data.last_restocked
      }).eq('id', data.id);
    },
    delete: async (id: string) => {
      if (isDemoMode || !supabase) return;
      await supabase.from('ingredients').delete().eq('id', id);
    }
  },

  db: {
    getRows: async (table: string) => {
      if (isDemoMode || !supabase) return [];
      const { data } = await supabase.from(table).select('*').limit(100);
      return data || [];
    }
  },

  archive: {
    exportData: async () => {
      const dishes = await api.dishes.getAll({ role: UserRole.ADMIN });
      const categories = await api.categories.getAll();
      const data = { dishes, categories, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jx-cloud-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    },
    importData: async (file: File) => {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.dishes) {
        for (const d of data.dishes) await api.dishes.create(d, { role: UserRole.ADMIN });
      }
      if (data.categories) await api.categories.saveAll(data.categories);
    }
  }
};
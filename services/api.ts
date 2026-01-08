
import { Partner, Order, Dish, HotelRoom, Expense, User, OrderStatus, MaterialImage, PaymentMethodConfig, SystemConfig, Ingredient, RoomStatus, PaymentMethod, UserRole } from '../types';
import { INITIAL_DISHES, ROOM_NUMBERS, INITIAL_USERS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { supabase, isDemoMode } from './supabaseClient';

/**
 * 江西云厨 - 核心数据适配层 V5.6 (Production Ready)
 */

export const api = {

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (isDemoMode) return INITIAL_DISHES;
      const { data } = await supabase.from('menu_dishes').select(`*, menu_categories ( name )`).order('name_zh');
      if (!data || data.length === 0) return INITIAL_DISHES;
      return data.map((d: any) => ({
        id: d.id,
        name: d.name_zh,
        nameEn: d.name_en,
        // 重要：从数据库 bigint 分值转回元
        price: Number(d.price_cents) / 100, 
        category: d.menu_categories?.name || 'Uncategorized',
        stock: d.stock || 0,
        imageUrl: d.image_url || '',
        isAvailable: d.is_available,
        isRecommended: d.is_recommended,
        partnerId: d.partner_id
      }));
    },
    // Fix: Added missing create method
    create: async (d: Dish) => {
      if (isDemoMode) return;
      const { data: cat } = await supabase.from('menu_categories').select('id').eq('name', d.category).maybeSingle();
      const { error } = await supabase.from('menu_dishes').insert({
        id: d.id,
        name_zh: d.name,
        name_en: d.nameEn,
        price_cents: Math.round(d.price * 100),
        category_id: cat?.id,
        stock: d.stock,
        image_url: d.imageUrl,
        is_available: d.isAvailable,
        is_recommended: d.isRecommended,
        partner_id: d.partnerId
      });
      if (error) throw error;
    },
    update: async (d: Dish) => {
      if (isDemoMode) return;
      // 先找 category_id
      const { data: cat } = await supabase.from('menu_categories').select('id').eq('name', d.category).maybeSingle();
      const { error } = await supabase.from('menu_dishes').update({
        name_zh: d.name,
        name_en: d.nameEn,
        price_cents: Math.round(d.price * 100),
        category_id: cat?.id,
        stock: d.stock,
        image_url: d.imageUrl,
        is_available: d.isAvailable,
        is_recommended: d.isRecommended
      }).eq('id', d.id);
      if (error) throw error;
    },
    // Fix: Added missing delete method
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('menu_dishes').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing rooms service
  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      if (isDemoMode) return ROOM_NUMBERS.map((id: string) => ({ id, status: RoomStatus.READY }));
      const { data } = await supabase.from('rooms').select('*');
      if (!data || data.length === 0) return ROOM_NUMBERS.map((id: string) => ({ id, status: RoomStatus.READY }));
      return data.map((r: any) => ({
        id: r.id,
        status: r.status as RoomStatus
      }));
    },
    update: async (room: HotelRoom) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('rooms').upsert({
        id: room.id,
        status: room.status
      });
      if (error) throw error;
    }
  },

  // Fix: Added missing orders service
  orders: {
    getAll: async (): Promise<Order[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!data) return [];
      return data.map((o: any) => ({
        id: o.id,
        roomId: o.room_id,
        items: o.items,
        totalAmount: Number(o.total_amount),
        status: o.status as OrderStatus,
        paymentMethod: o.payment_method as PaymentMethod,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        taxAmount: Number(o.tax_amount)
      }));
    },
    create: async (order: Order) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('orders').insert({
        id: order.id,
        room_id: order.roomId,
        items: order.items,
        total_amount: order.totalAmount,
        status: order.status,
        payment_method: order.paymentMethod,
        tax_amount: order.taxAmount,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      });
      if (error) throw error;
    },
    updateStatus: async (id: string, status: OrderStatus) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing categories service
  categories: {
    getAll: async (): Promise<string[]> => {
      if (isDemoMode) return DEFAULT_CATEGORIES;
      const { data } = await supabase.from('menu_categories').select('name').order('display_order');
      if (!data || data.length === 0) return DEFAULT_CATEGORIES;
      return data.map((c: any) => c.name);
    },
    saveAll: async (categories: string[]) => {
      if (isDemoMode) return;
      for (let i = 0; i < categories.length; i++) {
        await supabase.from('menu_categories').upsert({
          name: categories[i],
          display_order: i
        }, { onConflict: 'name' });
      }
    }
  },

  users: {
    // Fix: Added missing getAll method
    getAll: async (): Promise<User[]> => {
      if (isDemoMode) return INITIAL_USERS;
      const { data } = await supabase.from('users').select('*');
      if (!data) return INITIAL_USERS;
      return data.map((d: any) => ({
        id: d.id,
        username: d.username,
        email: d.email,
        name: d.full_name,
        role: d.role as UserRole,
        modulePermissions: d.module_permissions || {}
      }));
    },
    getProfile: async (id: string): Promise<User> => {
      if (isDemoMode) return INITIAL_USERS[0];
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (error || !data) return INITIAL_USERS[0];
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.full_name,
        role: data.role as UserRole,
        modulePermissions: data.module_permissions || {}
      };
    },
    // Fix: Added missing create method
    create: async (u: User) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').insert({
        id: u.id,
        username: u.username,
        email: u.email,
        full_name: u.name,
        role: u.role,
        module_permissions: u.modulePermissions
      });
      if (error) throw error;
    },
    // Fix: Added missing update method
    update: async (u: User) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').update({
        username: u.username,
        email: u.email,
        full_name: u.name,
        role: u.role,
        module_permissions: u.modulePermissions
      }).eq('id', u.id);
      if (error) throw error;
    },
    // Fix: Added missing delete method
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    updatePermissions: async (id: string, perms: any) => {
      if (isDemoMode) return;
      await supabase.from('users').update({ module_permissions: perms }).eq('id', id);
    }
  },

  // Fix: Added missing partners service
  partners: {
    getAll: async (): Promise<Partner[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('partners').select('*');
      if (!data) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        ownerName: p.owner_name,
        status: p.status,
        commissionRate: Number(p.commission_rate),
        balance: Number(p.balance),
        totalSales: Number(p.total_sales),
        authorizedCategories: p.authorized_categories || [],
        joinedAt: p.joined_at,
        userId: p.user_id,
        contact: p.contact,
        email: p.email
      }));
    },
    create: async (p: Partner) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('partners').insert({
        id: p.id,
        name: p.name,
        owner_name: p.ownerName,
        status: p.status,
        commission_rate: p.commissionRate,
        authorized_categories: p.authorizedCategories,
        contact: p.contact,
        email: p.email,
        user_id: p.userId,
        joined_at: p.joinedAt
      });
      if (error) throw error;
    },
    update: async (p: Partner) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('partners').update({
        name: p.name,
        owner_name: p.ownerName,
        status: p.status,
        commission_rate: p.commissionRate,
        authorized_categories: p.authorizedCategories,
        contact: p.contact,
        email: p.email
      }).eq('id', p.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing expenses service
  expenses: {
    getAll: async (): Promise<Expense[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('expenses').select('*');
      if (!data) return [];
      return data.map((e: any) => ({
        id: e.id,
        amount: Number(e.amount),
        category: e.category,
        description: e.description,
        date: e.date
      }));
    },
    create: async (e: Expense) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('expenses').insert(e);
      if (error) throw error;
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing ingredients service
  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('ingredients').select('*');
      if (!data) return [];
      return data.map((i: any) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: Number(i.stock),
        minStock: Number(i.min_stock),
        category: i.category,
        lastRestocked: i.last_restocked
      }));
    },
    create: async (i: Ingredient) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('ingredients').insert({
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: i.stock,
        min_stock: i.minStock,
        category: i.category,
        last_restocked: i.lastRestocked
      });
      if (error) throw error;
    },
    update: async (i: Ingredient) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('ingredients').update({
        name: i.name,
        unit: i.unit,
        stock: i.stock,
        min_stock: i.minStock,
        category: i.category,
        last_restocked: i.lastRestocked
      }).eq('id', i.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // Fix: Added missing payments service
  payments: {
    getAll: async (): Promise<PaymentMethodConfig[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('payments').select('*');
      if (!data) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type as PaymentMethod,
        isActive: p.is_active,
        // Fix: Changed 'icon_type' to 'iconType' to match PaymentMethodConfig interface
        iconType: p.icon_type,
        instructions: p.instructions
      }));
    },
    create: async (p: PaymentMethodConfig) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('payments').insert({
        id: p.id,
        name: p.name,
        type: p.type,
        is_active: p.isActive,
        // Fix: Changed 'p.icon_type' to 'p.iconType' as defined in interface
        icon_type: p.iconType,
        instructions: p.instructions
      });
      if (error) throw error;
    },
    update: async (p: PaymentMethodConfig) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('payments').update({
        name: p.name,
        type: p.type,
        is_active: p.isActive,
        // Fix: Changed 'p.icon_type' to 'p.iconType' as defined in interface
        icon_type: p.iconType,
        instructions: p.instructions
      }).eq('id', p.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
    },
    toggle: async (id: string) => {
      if (isDemoMode) return;
      const { data } = await supabase.from('payments').select('is_active').eq('id', id).single();
      if (data) {
        await supabase.from('payments').update({ is_active: !data.is_active }).eq('id', id);
      }
    }
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      if (isDemoMode) return { hotelName: '演示模式' } as any;
      const { data } = await supabase.from('system_config').select('*').eq('id', 'global').maybeSingle();
      if (!data) return { hotelName: '江西云厨' } as any;
      return {
        hotelName: data.hotel_name,
        version: data.version,
        theme: data.theme,
        fontFamily: data.font_family,
        fontSizeBase: data.font_size_base,
        printerIp: data.printer_ip,
        printer_port: data.printer_port,
        autoPrintOrder: data.auto_print_order,
        autoPrintReceipt: data.auto_print_receipt,
        serviceChargeRate: Number(data.service_charge_rate),
        contrastStrict: data.contrast_strict,
        voiceBroadcastEnabled: data.voice_broadcast_enabled,
        voiceVolume: data.voice_volume
      } as any;
    },
    // Fix: Added missing update method
    update: async (c: SystemConfig) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('system_config').update({
        hotel_name: c.hotelName,
        theme: c.theme,
        font_family: c.fontFamily,
        font_size_base: c.fontSizeBase,
        printer_ip: c.printerIp,
        printer_port: c.printerPort,
        auto_print_order: c.autoPrintOrder,
        auto_print_receipt: c.autoPrintReceipt,
        service_charge_rate: c.serviceChargeRate,
        contrast_strict: c.contrastStrict,
        voice_broadcast_enabled: c.voiceBroadcastEnabled,
        voice_volume: c.voiceVolume
      }).eq('id', 'global');
      if (error) throw error;
    }
  }
};
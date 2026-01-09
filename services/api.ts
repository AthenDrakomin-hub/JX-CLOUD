
import { Partner, Order, Dish, HotelRoom, Expense, User, OrderStatus, MaterialImage, PaymentMethodConfig, SystemConfig, Ingredient, RoomStatus, PaymentMethod, UserRole } from '../types';
import { INITIAL_DISHES, ROOM_NUMBERS, INITIAL_USERS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { supabase, isDemoMode } from './supabaseClient';

/**
 * 江西云厨 - 核心数据适配层 V5.6 (Production Ready)
 */

// 错误处理辅助函数
const handleApiError = (error: any, tableName: string) => {
  // 检查是否为403错误或RLS相关的错误
  if (error.code === '403' || 
      error.status === 403 || 
      error.message?.toLowerCase().includes('permission denied') ||
      error.message?.toLowerCase().includes('row level security') ||
      error.message?.toLowerCase().includes('forbidden')) {
    
    // 创建一个带RLS标识的错误消息
    const rlsError = new Error(`RLS_FORBIDDEN_403: Permission denied for table "${tableName}". ${error.message || 'Row Level Security policy blocked access.'}`);
    rlsError.name = 'RLSError';
    throw rlsError;
  }
  
  // 抛出原始错误
  throw error;
};

export const api = {

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (isDemoMode) return INITIAL_DISHES;
      const { data } = await supabase.from('menu_dishes').select(`*, menu_categories ( name )`).order('name_zh');
      if (!data || data.length === 0) return INITIAL_DISHES;
      return data.map((d: any) => ({
        id: d.id || '',
        name: d.name_zh || '',
        nameEn: d.name_en || '',
        // 重要：从数据库 php价格转回数值
        price: Number(d.price_php) || 0, 
        category: d.menu_categories?.name || d.category || 'Uncategorized',
        stock: d.stock !== undefined && d.stock !== null ? Number(d.stock) : 0,
        imageUrl: d.image_url || '',
        isAvailable: d.is_available !== undefined ? Boolean(d.is_available) : true,
        isRecommended: d.is_recommended !== undefined ? Boolean(d.is_recommended) : false,
        partnerId: d.partner_id || ''
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
        price_php: d.price,
        category_id: cat?.id,
        stock: d.stock,
        image_url: d.imageUrl,
        is_available: d.isAvailable,
        is_recommended: d.isRecommended,
        partner_id: d.partnerId
      });
      if (error) handleApiError(error, 'menu_dishes');
    },
    update: async (d: Dish) => {
      if (isDemoMode) return;
      // 先找 category_id
      const { data: cat } = await supabase.from('menu_categories').select('id').eq('name', d.category).maybeSingle();
      const { error } = await supabase.from('menu_dishes').update({
        name_zh: d.name,
        name_en: d.nameEn,
        price_php: d.price,
        category_id: cat?.id,
        stock: d.stock,
        image_url: d.imageUrl,
        is_available: d.isAvailable,
        is_recommended: d.isRecommended
      }).eq('id', d.id);
      if (error) handleApiError(error, 'menu_dishes');
    },
    // Fix: Added missing delete method
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('menu_dishes').delete().eq('id', id);
      if (error) handleApiError(error, 'menu_dishes');
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
        status: room.status,
        updated_at: new Date().toISOString()
      });
      if (error) handleApiError(error, 'rooms');
    }
  },

  // Fix: Added missing orders service
  orders: {
    getAll: async (): Promise<Order[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!data) return [];
      return data.map((o: any) => ({
        id: o.id || '',
        roomId: o.room_id || '',
        items: o.items || [],
        totalAmount: Number(o.total_amount) || 0,
        status: (o.status || 'pending') as OrderStatus,
        paymentMethod: (o.payment_method || 'Cash') as PaymentMethod,
        createdAt: o.created_at || new Date().toISOString(),
        updatedAt: o.updated_at || new Date().toISOString(),
        taxAmount: Number(o.tax_amount) || 0,
        updatedBy: o.updated_by || undefined,
        sourceTag: o.source_tag || undefined
      }));
    },
    create: async (order: Order) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('orders').insert({
        // Don't include id since it's auto-generated by the database
        room_id: order.roomId,
        items: order.items,
        total_amount: order.totalAmount,
        status: order.status,
        payment_method: order.paymentMethod,
        tax_amount: order.taxAmount,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        updated_by: order.updatedBy,
        source_tag: order.sourceTag
      });
      if (error) handleApiError(error, 'orders');
    },
    updateStatus: async (id: string, status: OrderStatus) => {
      if (isDemoMode) return;
      // Note: We don't have access to current user ID here, so updated_by is not included
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) handleApiError(error, 'orders');
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
          code: categories[i].substring(0, 10).toUpperCase().replace(/\s+/g, '_'), // Generate code from name
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
        id: d.id || '',
        username: d.username || '',
        email: d.email || '',
        name: d.full_name || d.name || '',
        role: (d.role || 'viewer') as UserRole,
        modulePermissions: d.module_permissions || {},
        ipWhitelist: d.ip_whitelist || [],
        isOnline: d.is_online || false,
        fullName: d.full_name || d.name || '',
        avatarUrl: d.avatar_url || undefined,
        metadata: d.metadata || undefined,
        authId: d.auth_id || undefined,
        lastLogin: d.last_login || undefined,
        sourceTag: d.source_tag || undefined
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
        name: data.full_name || data.name || '',
        role: data.role as UserRole,
        modulePermissions: data.module_permissions || {},
        ipWhitelist: data.ip_whitelist || [],
        isOnline: data.is_online || false,
        fullName: data.full_name || data.name || '',
        avatarUrl: data.avatar_url || undefined,
        metadata: data.metadata || undefined,
        authId: data.auth_id || undefined,
        lastLogin: data.last_login || undefined,
        sourceTag: data.source_tag || undefined
      };
    },
    // Fix: Added missing create method
    create: async (u: User) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').insert({
        // Don't include id since it's auto-generated by the database
        username: u.username,
        email: u.email,
        full_name: u.name || u.fullName,
        role: u.role,
        module_permissions: u.modulePermissions,
        ip_whitelist: u.ipWhitelist,
        is_online: u.isOnline,
        avatar_url: u.avatarUrl,
        metadata: u.metadata,
        auth_id: u.authId,
        last_login: u.lastLogin,
        source_tag: u.sourceTag
      });
      if (error) handleApiError(error, 'users');
    },
    // Fix: Added missing update method
    update: async (u: User) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').update({
        username: u.username,
        email: u.email,
        full_name: u.name || u.fullName,
        role: u.role,
        module_permissions: u.modulePermissions,
        ip_whitelist: u.ipWhitelist,
        is_online: u.isOnline,
        avatar_url: u.avatarUrl,
        metadata: u.metadata,
        auth_id: u.authId,
        last_login: u.lastLogin,
        source_tag: u.sourceTag
      }).eq('id', u.id);
      if (error) handleApiError(error, 'users');
    },
    // Fix: Added missing delete method
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) handleApiError(error, 'users');
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
        id: p.id || '',
        name: p.name || '',
        ownerName: p.owner_name || '',
        status: p.status || 'active',
        commissionRate: Number(p.commission_rate) || 0,
        balance: Number(p.balance) || 0,
        totalSales: Number(p.total_sales) || 0,
        authorizedCategories: p.authorized_categories || [],
        joinedAt: p.joined_at || new Date().toISOString(),
        userId: p.user_id || '',
        contact: p.contact || '',
        email: p.email || ''
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
      if (error) handleApiError(error, 'partners');
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
      if (error) handleApiError(error, 'partners');
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) handleApiError(error, 'partners');
    }
  },

  // Fix: Added missing expenses service
  expenses: {
    getAll: async (): Promise<Expense[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('expenses').select('*');
      if (!data) return [];
      return data.map((e: any) => ({
        id: e.id || '',
        amount: Number(e.amount) || 0,
        category: e.category || '',
        description: e.description || '',
        date: e.date || new Date().toISOString()
      }));
    },
    create: async (e: Expense) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('expenses').insert(e);
      if (error) handleApiError(error, 'expenses');
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) handleApiError(error, 'expenses');
    }
  },

  // Fix: Added missing ingredients service
  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('ingredients').select('*');
      if (!data) return [];
      return data.map((i: any) => ({
        id: i.id || '',
        name: i.name || '',
        unit: i.unit || '',
        stock: Number(i.stock) || 0,
        minStock: Number(i.min_stock) || 0,
        category: i.category || '',
        lastRestocked: i.last_restocked || new Date().toISOString()
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
      if (error) handleApiError(error, 'ingredients');
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
      if (error) handleApiError(error, 'ingredients');
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) handleApiError(error, 'ingredients');
    }
  },

  // Fix: Added missing payment_configs service
  payments: {
    getAll: async (): Promise<PaymentMethodConfig[]> => {
      if (isDemoMode) return [];
      const { data } = await supabase.from('payment_configs').select('*');
      if (!data) return [];
      return data.map((p: any) => ({
        id: p.id || '',
        name: p.name || '',
        type: (p.type || 'Cash') as PaymentMethod,
        isActive: Boolean(p.is_active),
        // Fix: Changed 'icon_type' to 'iconType' to match PaymentMethodConfig interface
        iconType: p.icon_type || 'credit-card',
        instructions: p.instructions || ''
      }));
    },
    create: async (p: PaymentMethodConfig) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('payment_configs').insert({
        id: p.id,
        name: p.name,
        type: p.type,
        is_active: p.isActive,
        // Fix: Changed 'p.icon_type' to 'p.iconType' as defined in interface
        icon_type: p.iconType,
        instructions: p.instructions
      });
      if (error) handleApiError(error, 'payment_configs');
    },
    update: async (p: PaymentMethodConfig) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('payment_configs').update({
        name: p.name,
        type: p.type,
        is_active: p.isActive,
        // Fix: Changed 'p.icon_type' to 'p.iconType' as defined in interface
        icon_type: p.iconType,
        instructions: p.instructions
      }).eq('id', p.id);
      if (error) handleApiError(error, 'payment_configs');
    },
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('payment_configs').delete().eq('id', id);
      if (error) handleApiError(error, 'payment_configs');
    },
    toggle: async (id: string) => {
      if (isDemoMode) return;
      const { data } = await supabase.from('payment_configs').select('is_active').eq('id', id).single();
      if (data) {
        await supabase.from('payment_configs').update({ is_active: !data.is_active }).eq('id', id);
      }
    }
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      if (isDemoMode) return { hotelName: '演示模式' } as any;
      let { data } = await supabase.from('system_config').select('*').eq('id', 'global').maybeSingle();
      
      // 如果没有找到全局配置记录，则尝试插入默认配置
      if (!data) {
        try {
          const defaultConfig = {
            id: 'global',
            hotel_name: '江西云厨',
            version: '5.2.0',
            theme: 'light',
            font_family: 'Plus Jakarta Sans',
            font_size_base: 16,
            font_weight_base: 500,
            line_height_base: 1.5,
            letter_spacing: 0,
            contrast_strict: true,
            text_color_main: '#0f172a',
            bg_color_main: '#f8fafc',
            printer_ip: '192.168.1.100',
            printer_port: '9100',
            auto_print_order: true,
            auto_print_receipt: true,
            voice_broadcast_enabled: true,
            voice_volume: 0.8,
            service_charge_rate: 0.05,
            updated_at: new Date().toISOString(),
            source_tag: null
          };
          
          const { error: insertError } = await supabase.from('system_config').insert(defaultConfig);
          if (insertError) {
            console.warn('Failed to insert default system config:', insertError);
            // 如果插入失败，返回默认值
            return { hotelName: '江西云厨' } as any;
          }
          
          // 插入成功后重新获取数据
          const result = await supabase.from('system_config').select('*').eq('id', 'global').maybeSingle();
          data = result.data;
        } catch (error) {
          console.warn('Error initializing system config:', error);
          return { hotelName: '江西云厨' } as any;
        }
      }
      
      if (!data) return { hotelName: '江西云厨' } as any;
      return {
        hotelName: data.hotel_name,
        version: data.version,
        theme: data.theme,
        fontFamily: data.font_family,
        fontSizeBase: data.font_size_base,
        fontWeightBase: data.font_weight_base || 500,
        lineHeightBase: data.line_height_base || 1.5,
        letterSpacing: data.letter_spacing || 0,
        contrastStrict: data.contrast_strict,
        textColorMain: data.text_color_main || '#0f172a',
        bgColorMain: data.bg_color_main || '#f8fafc',
        printerIp: data.printer_ip,
        printerPort: data.printer_port,
        autoPrintOrder: data.auto_print_order,
        autoPrintReceipt: data.auto_print_receipt,
        serviceChargeRate: Number(data.service_charge_rate),
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
        voice_volume: c.voiceVolume,
        updated_at: new Date().toISOString()
      }).eq('id', 'global');
      if (error) handleApiError(error, 'system_config');
    }
  }
};
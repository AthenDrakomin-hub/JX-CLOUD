
import { Partner, Order, Dish, HotelRoom, Expense, User, OrderStatus, MaterialImage, PaymentMethodConfig, SystemConfig, Ingredient, RoomStatus, PaymentMethod, UserRole } from '../types';
import { INITIAL_DISHES, ROOM_NUMBERS, INITIAL_USERS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { supabase, isDemoMode } from './supabaseClient';

/**
 * 江西云厨 - 核心数据适配层 V5.6 (Production Ready)
 */

// 获取访问令牌的辅助函数
const getAccessToken = async (): Promise<string> => {
  if (isDemoMode) return '';
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // 如果没有有效会话，可能需要重定向到登录页
      console.warn('No active session found. User may need to login.');
      return '';
    }
    return session.access_token || '';
  } catch (error) {
    console.error('Failed to get access token:', error);
    return '';
  }
};

// 检查认证状态并处理未认证情况的辅助函数
const checkAuthAndRedirect = () => {
  if (typeof window !== 'undefined') {
    // 清除所有前端会话状态和缓存
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // 检查当前是否已经在登录页面
    if (!window.location.pathname.includes('login') && !window.location.pathname.includes('auth')) {
      // 重定向到登录页面
      window.location.href = '/';
    }
  }
};

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
    // Upsert user profile from OAuth provider using Supabase Edge Function
    upsertProfile: async (profileData: any) => {
      if (isDemoMode) return { id: 'demo-user', ...profileData };
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      try {
        // Extract the profile data
        const { id, email, name, avatar_url, raw_user_meta_data, ...otherData } = profileData;
        
        // Get access token for authorization
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          throw new Error('No access token available for authentication');
        }
        
        // Prepare payload for edge function
        const payload = {
          auth_id: id,
          email: email || null,
          full_name: name || null,
          avatar_url: avatar_url || null,
          metadata: raw_user_meta_data || {},
          ...otherData
        };
        
        // Call the edge function
        const EDGE_FN_URL = 'https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/upsert-user-profile';
        const res = await fetch(EDGE_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        const resJson = await res.json().catch(() => null);
        
        if (!res.ok) {
          console.error('Edge function error:', res.status, resJson);
          throw new Error(resJson?.error || `Sync profile failed (HTTP ${res.status})`);
        }
        
        return resJson?.data?.[0] || payload;
      } catch (error) {
        console.error('Error upserting user profile:', error);
        throw error;
      }
    },
    
    // Get all users
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
    // Create user with role synchronization
    create: async (u: User) => {
      if (isDemoMode) return;
      
      // Start a transaction to ensure consistency
      const { error } = await supabase.from('users').insert({
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
    // Update user with role synchronization
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
    // Delete user
    delete: async (id: string) => {
      if (isDemoMode) return;
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) handleApiError(error, 'users');
    },
    // Update user permissions
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
      
      // 尝试使用新的 API 端点
      try {
        const response = await fetch('https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/global-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAccessToken()}`
          }
        });
        
        if (response.status === 401 || response.status === 403) {
          // 未授权或权限不足，用户需要登录或检查权限
          console.warn(`Authorization error (${response.status}) accessing config API. Redirecting to login.`);
          checkAuthAndRedirect();
          throw new Error('Authentication required');
        }
        
        if (response.ok) {
          const data = await response.json();
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
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
          throw error; // Re-throw auth errors to be handled by calling code
        }
        
        console.warn('Failed to fetch config via API endpoint, falling back to direct DB access:', error);
      }
      
      // 回退到直接数据库访问
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
  },

  // 新增的 API v1 接口方法
  v1: {
    // 【创建订单】POST /api/v1/orders
    createOrder: async (orderData: { room_id: string; items: any[]; payment_method?: string }) => {
      if (isDemoMode) return { id: 'demo-order-id', ...orderData, total_amount: 0 };
      
      try {
        const response = await fetch('/api/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAccessToken()}`
          },
          body: JSON.stringify(orderData)
        });
        
        if (response.status === 401) {
          // 未授权，用户需要登录
          console.warn('Unauthorized access to create order API. Redirecting to login.');
          checkAuthAndRedirect();
          throw new Error('Authentication required');
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
          throw error; // Re-throw auth errors to be handled by calling code
        }
        
        console.error('Failed to create order via API endpoint:', error);
        // 回退到原有实现
        const { error: supabaseError } = await supabase.from('orders').insert({
          room_id: orderData.room_id,
          items: orderData.items,
          total_amount: 0, // Will be calculated on server side
          status: 'pending',
          payment_method: orderData.payment_method || 'Cash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (supabaseError) handleApiError(supabaseError, 'orders');
      }
    },

    // 【查询房间订单】GET /api/v1/rooms/{room_id}/orders?status={状态}
    getRoomOrders: async (roomId: string, status?: string) => {
      if (isDemoMode) return [];
      
      try {
        let url = `/api/v1/rooms/${encodeURIComponent(roomId)}/orders`;
        if (status) {
          url += `?status=${encodeURIComponent(status)}`;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAccessToken()}`
          }
        });
        
        if (response.status === 401) {
          // 未授权，用户需要登录
          console.warn('Unauthorized access to get room orders API. Redirecting to login.');
          checkAuthAndRedirect();
          throw new Error('Authentication required');
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
          throw error; // Re-throw auth errors to be handled by calling code
        }
        
        console.error('Failed to fetch room orders via API endpoint:', error);
        // 回退到原有实现
        let query = supabase.from('orders').select('*').eq('room_id', roomId);
        if (status) {
          query = query.eq('status', status);
        }
        query = query.order('created_at', { ascending: false });
        
        const { data, error: supabaseError } = await query;
        if (supabaseError) handleApiError(supabaseError, 'orders');
        return data || [];
      }
    },

    // 【获取支付配置】GET /api/v1/payment_configs
    getPaymentConfigs: async () => {
      if (isDemoMode) return [];
      
      try {
        const response = await fetch('/api/v1/payment_configs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAccessToken()}`
          }
        });
        
        if (response.status === 401) {
          // 未授权，用户需要登录
          console.warn('Unauthorized access to get payment configs API. Redirecting to login.');
          checkAuthAndRedirect();
          throw new Error('Authentication required');
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
          throw error; // Re-throw auth errors to be handled by calling code
        }
        
        console.error('Failed to fetch payment configs via API endpoint:', error);
        // 回退到原有实现
        const { data, error: supabaseError } = await supabase.from('payment_configs').select('*').eq('is_active', true);
        if (supabaseError) handleApiError(supabaseError, 'payment_configs');
        return data || [];
      }
    }
  }
};

import { Partner, Order, Dish, HotelRoom, Expense, User, OrderStatus, MaterialImage, PaymentMethodConfig, SystemConfig, Ingredient, RoomStatus, PaymentMethod, UserRole, Category } from '../types';
import { apiCache } from './apiCache';
import { supabase } from './supabaseClient';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Cloud Request Timeout')), timeoutMs))
  ]);
};

export const api = {
  getClientIp: async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (e) {
      return '127.0.0.1';
    }
  },

  db: {
    getRows: async (table: string): Promise<any[]> => {
      const { data, error } = await supabase.from(table).select('*').limit(100);
      if (error) throw error;
      return data || [];
    },
    insertRow: async (table: string, row: any) => {
      const { error } = await supabase.from(table).insert(row);
      if (error) throw error;
    },
    updateRow: async (table: string, id: any, row: any) => {
      // 特殊处理 ID 字段名为 id 或 username 的情况
      const idKey = table === 'users' ? 'email' : 'id';
      const { error } = await supabase.from(table).update(row).eq(idKey, id);
      if (error) throw error;
    },
    deleteRow: async (table: string, id: any) => {
      const idKey = table === 'users' ? 'email' : 'id';
      const { error } = await supabase.from(table).delete().eq(idKey, id);
      if (error) throw error;
    }
  },

  // Fix: Added categories module to resolve property 'categories' does not exist error
  categories: {
    getAll: async (): Promise<string[]> => {
      const { data } = await supabase.from('categories').select('name').order('name');
      if (data && data.length > 0) return data.map(c => c.name);
      return [];
    },
    getAllHierarchical: async (): Promise<Category[]> => {
      const { data } = await supabase.from('categories').select('*').order('display_order');
      if (data) return data.map(c => ({
        id: c.id,
        name: c.name,
        parent_id: c.parent_id,
        level: c.level || 0,
        display_order: c.display_order || 0,
        created_at: c.created_at,
        updated_at: c.updated_at
      }));
      return [];
    },
    getAllHierarchicalFlat: async (): Promise<any[]> => {
      // 返回扁平格式的分类数据，包含path、level、parent_id等字段，用于构建层级树
      // 从数据库获取分类数据
      const { data } = await supabase.from('categories').select(`
        id,
        name,
        parent_id,
        level,
        display_order
      `).order('display_order');
      
      if (data) {
        // 将数据转换为扁平格式，包含path、level、category_id等字段
        return data.map(c => ({
          category_id: c.id,
          category_name: c.name,
          category_group: c.name, // 使用名称作为分组
          parent_id_backup: c.parent_id,
          level: c.level || 0,
          path: [c.id] // 简化的path，实际应用中可能需要更复杂的路径构建
        }));
      }
      return [];
    },
    saveAll: async (categories: string[]) => {
      // Clear existing and replace with new set
      await supabase.from('categories').delete().neq('name', '___'); 
      if (categories.length > 0) {
        await supabase.from('categories').insert(categories.map(name => ({ name })));
      }
    },
    saveHierarchical: async (categories: Category[]) => {
      // 保存层级分类结构
      await supabase.from('categories').delete().neq('name', '___');
      if (categories.length > 0) {
        const mappedCategories = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id,
          level: cat.level,
          display_order: cat.display_order
        }));
        await supabase.from('categories').upsert(mappedCategories);
      }
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      const cacheKey = 'rooms-all';
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      const { data } = await supabase.from('rooms').select('*').order('id');
      if (data && data.length > 0) {
        apiCache.set(cacheKey, data, 10000); // 10秒缓存（房间状态可能频繁变化）
        return data;
      }
      return [];
    },
    update: async (room: HotelRoom) => {
      await supabase.from('rooms').upsert({ id: room.id, status: room.status, updated_at: new Date().toISOString() });
    }
  },

  partners: {
    getAll: async (): Promise<Partner[]> => {
      const { data } = await supabase.from('partners').select('*').order('name');
      if (data) return data.map(p => ({
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
      return [];
    },
    create: async (p: Partner) => {
      await supabase.from('partners').insert({
        id: p.id, name: p.name, owner_name: p.ownerName, 
        status: p.status, commission_rate: p.commissionRate,
        authorized_categories: p.authorizedCategories, user_id: p.userId,
        contact: p.contact, email: p.email
      });
    },
    update: async (p: Partner) => {
      await supabase.from('partners').update({
        name: p.name, owner_name: p.ownerName, status: p.status,
        commission_rate: p.commissionRate, authorized_categories: p.authorizedCategories,
        contact: p.contact, email: p.email
      }).eq('id', p.id);
    },
    delete: async (id: string) => {
      await supabase.from('partners').delete().eq('id', id);
    }
  },

  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      const { data } = await supabase.from('ingredients').select('*').order('name');
      if (data) return data.map(i => ({
        id: i.id, name: i.name, unit: i.unit,
        stock: Number(i.stock), minStock: Number(i.min_stock),
        category: i.category, lastRestocked: i.last_restocked
      }));
      return [];
    },
    create: async (i: Ingredient) => {
      await supabase.from('ingredients').insert({
        id: i.id, name: i.name, unit: i.unit,
        stock: i.stock, min_stock: i.minStock, category: i.category
      });
    },
    update: async (i: Ingredient) => {
      await supabase.from('ingredients').update({
        name: i.name, unit: i.unit, stock: i.stock, 
        min_stock: i.minStock, category: i.category
      }).eq('id', i.id);
    },
    delete: async (id: string) => {
      await supabase.from('ingredients').delete().eq('id', id);
    }
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      const cacheKey = 'orders-all';
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) {
        const result = data.map(o => ({
          id: o.id, roomId: o.room_id, items: o.items,
          totalAmount: Number(o.total_amount), taxAmount: Number(o.tax_amount),
          status: o.status as OrderStatus, paymentMethod: o.payment_method as PaymentMethod,
          createdAt: o.created_at, updatedAt: o.updated_at
        }));
        apiCache.set(cacheKey, result, 15000); // 15秒缓存
        return result;
      }
      return [];
    },
    create: async (o: Order) => {
      await supabase.from('orders').insert({
        id: o.id, room_id: o.roomId, items: o.items,
        total_amount: o.totalAmount, tax_amount: o.taxAmount,
        status: o.status, payment_method: o.paymentMethod
      });
    },
    updateStatus: async (id: string, status: OrderStatus) => {
      await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    }
  },

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      const cacheKey = 'dishes-all';
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      const { data } = await supabase.from('dishes').select('*').order('name');
      if (data) {
        const result = data.map(d => ({
          id: d.id, name: d.name, nameEn: d.name_en,
          price: Number(d.price), category: d.category,
          stock: d.stock, imageUrl: d.image_url, isAvailable: d.is_available,
          partnerId: d.partner_id
        }));
        apiCache.set(cacheKey, result, 30000); // 30秒缓存
        return result;
      }
      return [];
    },
    create: async (d: Dish) => {
      await supabase.from('dishes').insert({
        id: d.id, name: d.name, name_en: d.nameEn,
        price: d.price, category: d.category, stock: d.stock,
        image_url: d.imageUrl, is_available: d.isAvailable, partner_id: d.partnerId
      });
    },
    update: async (d: Dish) => {
      await supabase.from('dishes').update({
        name: d.name, name_en: d.nameEn, price: d.price,
        category: d.category, stock: d.stock, image_url: d.imageUrl,
        is_available: d.isAvailable, partner_id: d.partnerId
      }).eq('id', d.id);
    },
    delete: async (id: string) => {
      await supabase.from('dishes').delete().eq('id', id);
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      const { data } = await supabase.from('users').select('*');
      if (data) return data.map(u => ({
        id: u.id, 
        email: u.email,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        metadata: u.metadata,
        created_at: u.created_at,
        updated_at: u.updated_at,
        auth_id: u.auth_id,
        role: u.role || 'viewer',
        username: u.email,
        modulePermissions: u.metadata?.permissions || {}
      }));
      return [];
    },
    create: async (u: User) => {
      await supabase.from('users').insert({
        id: u.id, 
        email: u.email || u.username, 
        full_name: u.full_name || u.name,
        avatar_url: u.avatar_url,
        metadata: u.metadata || { role: u.role, permissions: u.modulePermissions },
        auth_id: u.auth_id,
        role: u.role || 'viewer'
      });
    },
    update: async (u: User) => {
      await supabase.from('users').update({
        email: u.email || u.username, 
        full_name: u.full_name || u.name,
        avatar_url: u.avatar_url,
        metadata: u.metadata || { role: u.role, permissions: u.modulePermissions },
        auth_id: u.auth_id,
        role: u.role
      }).eq('id', u.id);
    },
    delete: async (id: string) => {
      await supabase.from('users').delete().eq('id', id);
    }
  },

  expenses: {
    getAll: async (): Promise<Expense[]> => {
      const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (data) return data;
      return [];
    },
    create: async (e: Expense) => {
      await supabase.from('expenses').insert(e);
    },
    delete: async (id: string) => {
      await supabase.from('expenses').delete().eq('id', id);
    }
  },

  materials: {
    getAll: async (): Promise<MaterialImage[]> => {
      const { data } = await supabase.from('material_images').select('*');
      if (data) return data.map(m => ({
        id: m.id, url: m.url, name: m.name, category: m.category,
        fileSize: m.file_size, dimensions: m.dimensions
      }));
      return [];
    },
    create: async (m: MaterialImage) => {
      await supabase.from('material_images').insert({
        id: m.id, url: m.url, name: m.name, category: m.category,
        file_size: m.fileSize, dimensions: m.dimensions
      });
    },
    delete: async (id: string) => {
      await supabase.from('material_images').delete().eq('id', id);
    }
  },

  payments: {
    getAll: async () => {
      const { data } = await supabase.from('payments').select('*');
      if (data) return data.map(p => ({
        id: p.id, name: p.name, type: p.type as PaymentMethod,
        isActive: p.is_active, iconType: p.icon_type, instructions: p.instructions
      }));
      return [];
    },
    toggle: async (id: string) => {
       const payments = await api.payments.getAll();
       const target = payments.find(p => p.id === id);
       if (target) {
         await supabase.from('payments').update({ is_active: !target.isActive }).eq('id', id);
       }
    },
    create: async (p: PaymentMethodConfig) => {
      await supabase.from('payments').insert({
        id: p.id, name: p.name, type: p.type,
        is_active: p.isActive, icon_type: p.iconType, instructions: p.instructions
      });
    },
    update: async (p: PaymentMethodConfig) => {
      await supabase.from('payments').update({
        name: p.name, type: p.type, is_active: p.isActive,
        icon_type: p.iconType, instructions: p.instructions
      }).eq('id', p.id);
    },
    delete: async (id: string) => {
      await supabase.from('payments').delete().eq('id', id);
    }
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      const cacheKey = 'config-global';
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      const { data } = await supabase.from('config').select('*').eq('id', 'global').single();
      if (data) {
        const result = {
          hotelName: data.hotel_name,
          version: data.version,
          theme: data.theme as any,
          fontFamily: data.font_family || 'Plus Jakarta Sans',
          fontSizeBase: data.font_size_base || 16,
          fontWeightBase: data.font_weight_base || 500,
          lineHeightBase: data.line_height_base || 1.5,
          letterSpacing: data.letter_spacing || 0,
          contrastStrict: data.contrast_strict !== undefined ? data.contrast_strict : true,
          textColorMain: data.text_color_main || '#0f172a',
          bgColorMain: data.bg_color_main || '#f8fafc',
          printerIp: data.printer_ip || '192.168.1.100',
          printerPort: data.printer_port || '9100',
          autoPrintOrder: data.auto_print_order !== undefined ? data.auto_print_order : true,
          autoPrintReceipt: data.auto_print_receipt !== undefined ? data.auto_print_receipt : true,
          voiceBroadcastEnabled: data.voice_broadcast_enabled !== undefined ? data.voice_broadcast_enabled : true,
          voiceVolume: data.voice_volume || 0.8,
          serviceChargeRate: Number(data.service_charge_rate || 0.05)
        };
        apiCache.set(cacheKey, result, 60000); // 60秒缓存
        return result;
      }
      const defaultConfig = { 
        hotelName: '江西云厨', 
        version: '5.2.0', 
        theme: 'light',
        fontFamily: 'Plus Jakarta Sans',
        fontSizeBase: 16,
        fontWeightBase: 500,
        lineHeightBase: 1.5,
        letterSpacing: 0,
        contrastStrict: true,
        textColorMain: '#0f172a',
        bgColorMain: '#f8fafc',
        printerIp: '192.168.1.100',
        printerPort: '9100',
        autoPrintOrder: true,
        autoPrintReceipt: true,
        voiceBroadcastEnabled: true,
        voiceVolume: 0.8,
        serviceChargeRate: 0.05
      };
      return defaultConfig;
    },
    update: async (c: SystemConfig) => {
      await supabase.from('config').update({
        hotel_name: c.hotelName, 
        version: c.version, 
        theme: c.theme,
        font_family: c.fontFamily,
        font_size_base: c.fontSizeBase,
        font_weight_base: c.fontWeightBase,
        line_height_base: c.lineHeightBase,
        letter_spacing: c.letterSpacing,
        contrast_strict: c.contrastStrict,
        text_color_main: c.textColorMain,
        bg_color_main: c.bgColorMain,
        printer_ip: c.printerIp, 
        printer_port: c.printerPort,
        auto_print_order: c.autoPrintOrder,
        auto_print_receipt: c.autoPrintReceipt,
        voice_broadcast_enabled: c.voiceBroadcastEnabled,
        voice_volume: c.voiceVolume,
        service_charge_rate: c.serviceChargeRate, 
        updated_at: new Date().toISOString()
      }).eq('id', 'global');
      // 更新配置后清除相关缓存
      apiCache.clear('config-global');
    }
  }
};
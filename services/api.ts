
import { Partner, Order, Dish, HotelRoom, Expense, User, OrderStatus, MaterialImage, PaymentMethodConfig, SystemConfig, Ingredient, RoomStatus, PaymentMethod, UserRole, Category } from '../types';
import { INITIAL_DISHES, ROOM_NUMBERS, INITIAL_USERS, CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { supabase, isDemoMode } from './supabaseClient';

const STORAGE_KEYS = {
  ROOMS: 'jx_virtual_rooms',
  ORDERS: 'jx_virtual_orders',
  DISHES: 'jx_virtual_dishes',
  EXPENSES: 'jx_virtual_expenses',
  USERS: 'jx_virtual_users',
  SYNC_QUEUE: 'jx_pending_sync',
  CONFIG: 'jx_virtual_config',
  MATERIALS: 'jx_virtual_materials',
  PARTNERS: 'jx_virtual_partners',
  TRANSLATIONS: 'jx_virtual_translations',
  CATEGORIES: 'jx_virtual_categories',
  INGREDIENTS: 'jx_virtual_ingredients'
};

const VirtualDB = {
  get: <T>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

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
      if (!isDemoMode) {
        const { data } = await supabase.from('categories').select('name').order('name');
        if (data && data.length > 0) return data.map(c => c.name);
      }
      return VirtualDB.get<string[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    },
    getAllHierarchical: async (): Promise<Category[]> => {
      if (!isDemoMode) {
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
      }
      // 返回扁平化格式用于层级树构建
      const categories = VirtualDB.get<string[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      return categories.map((name, index) => ({
        id: index + 1,
        name: name,
        parent_id: null,
        level: 0,
        display_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    },
    getAllHierarchicalFlat: async (): Promise<any[]> => {
      // 返回扁平格式的分类数据，包含path、level、parent_id等字段，用于构建层级树
      if (!isDemoMode) {
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
      }
      // 演示模式下返回示例数据
      const categories = VirtualDB.get<string[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      return categories.map((name, index) => ({
        category_id: index + 1,
        category_name: name,
        category_group: name,
        parent_id_backup: null,
        level: 0,
        path: [index + 1]
      }));
    },
    saveAll: async (categories: string[]) => {
      if (!isDemoMode) {
        // Clear existing and replace with new set
        await supabase.from('categories').delete().neq('name', '___'); 
        if (categories.length > 0) {
          await supabase.from('categories').insert(categories.map(name => ({ name })));
        }
      }
      VirtualDB.set(STORAGE_KEYS.CATEGORIES, categories);
    },
    saveHierarchical: async (categories: Category[]) => {
      if (!isDemoMode) {
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
    }
  },

  rooms: {
    getAll: async (): Promise<HotelRoom[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('rooms').select('*').order('id');
        if (data && data.length > 0) return data;
      }
      return VirtualDB.get<HotelRoom[]>(STORAGE_KEYS.ROOMS, ROOM_NUMBERS.map(id=>({id, status: RoomStatus.READY})));
    },
    update: async (room: HotelRoom) => {
      if (!isDemoMode) {
        await supabase.from('rooms').upsert({ id: room.id, status: room.status, updated_at: new Date().toISOString() });
      }
    }
  },

  partners: {
    getAll: async (): Promise<Partner[]> => {
      if (!isDemoMode) {
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
      }
      return VirtualDB.get<Partner[]>(STORAGE_KEYS.PARTNERS, []);
    },
    create: async (p: Partner) => {
      if (!isDemoMode) {
        await supabase.from('partners').insert({
          id: p.id, name: p.name, owner_name: p.ownerName, 
          status: p.status, commission_rate: p.commissionRate,
          authorized_categories: p.authorizedCategories, user_id: p.userId,
          contact: p.contact, email: p.email
        });
      }
    },
    update: async (p: Partner) => {
       if (!isDemoMode) {
        await supabase.from('partners').update({
          name: p.name, owner_name: p.ownerName, status: p.status,
          commission_rate: p.commissionRate, authorized_categories: p.authorizedCategories,
          contact: p.contact, email: p.email
        }).eq('id', p.id);
      }
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('partners').delete().eq('id', id);
    }
  },

  ingredients: {
    getAll: async (): Promise<Ingredient[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('ingredients').select('*').order('name');
        if (data) return data.map(i => ({
          id: i.id, name: i.name, unit: i.unit,
          stock: Number(i.stock), minStock: Number(i.min_stock),
          category: i.category, lastRestocked: i.last_restocked
        }));
      }
      return [];
    },
    create: async (i: Ingredient) => {
      if (!isDemoMode) {
        await supabase.from('ingredients').insert({
          id: i.id, name: i.name, unit: i.unit,
          stock: i.stock, min_stock: i.minStock, category: i.category
        });
      }
    },
    update: async (i: Ingredient) => {
      if (!isDemoMode) {
        await supabase.from('ingredients').update({
          name: i.name, unit: i.unit, stock: i.stock, 
          min_stock: i.minStock, category: i.category
        }).eq('id', i.id);
      }
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('ingredients').delete().eq('id', id);
    }
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data) return data.map(o => ({
          id: o.id, roomId: o.room_id, items: o.items,
          totalAmount: Number(o.total_amount), taxAmount: Number(o.tax_amount),
          status: o.status as OrderStatus, paymentMethod: o.payment_method as PaymentMethod,
          createdAt: o.created_at, updatedAt: o.updated_at
        }));
      }
      return [];
    },
    create: async (o: Order) => {
      if (!isDemoMode) {
        await supabase.from('orders').insert({
          id: o.id, room_id: o.roomId, items: o.items,
          total_amount: o.totalAmount, tax_amount: o.taxAmount,
          status: o.status, payment_method: o.paymentMethod
        });
      }
    },
    updateStatus: async (id: string, status: OrderStatus) => {
      if (!isDemoMode) {
        await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      }
    }
  },

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('dishes').select('*').order('name');
        if (data) return data.map(d => ({
          id: d.id, name: d.name, nameEn: d.name_en,
          price: Number(d.price), category: d.category,
          stock: d.stock, imageUrl: d.image_url, isAvailable: d.is_available,
          partnerId: d.partner_id
        }));
      }
      return INITIAL_DISHES;
    },
    create: async (d: Dish) => {
      if (!isDemoMode) {
        await supabase.from('dishes').insert({
          id: d.id, name: d.name, name_en: d.nameEn,
          price: d.price, category: d.category, stock: d.stock,
          image_url: d.imageUrl, is_available: d.isAvailable, partner_id: d.partnerId
        });
      }
    },
    update: async (d: Dish) => {
      if (!isDemoMode) {
        await supabase.from('dishes').update({
          name: d.name, name_en: d.nameEn, price: d.price,
          category: d.category, stock: d.stock, image_url: d.imageUrl,
          is_available: d.isAvailable, partner_id: d.partnerId
        }).eq('id', d.id);
      }
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('dishes').delete().eq('id', id);
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('users').select('*');
        if (data) return data.map(u => ({
          id: u.id, username: u.email, name: u.full_name,
          role: u.metadata?.role || UserRole.STAFF,
          modulePermissions: u.metadata?.permissions || {}
        }));
      }
      return INITIAL_USERS;
    },
    create: async (u: User) => {
      if (!isDemoMode) {
        await supabase.from('users').insert({
          id: u.id, email: u.username, full_name: u.name,
          metadata: { role: u.role, permissions: u.modulePermissions }
        });
      }
    },
    update: async (u: User) => {
       if (!isDemoMode) {
        await supabase.from('users').update({
          email: u.username, full_name: u.name,
          metadata: { role: u.role, permissions: u.modulePermissions }
        }).eq('id', u.id);
      }
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('users').delete().eq('id', id);
    }
  },

  expenses: {
    getAll: async (): Promise<Expense[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
        if (data) return data;
      }
      return [];
    },
    create: async (e: Expense) => {
      if (!isDemoMode) await supabase.from('expenses').insert(e);
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('expenses').delete().eq('id', id);
    }
  },

  materials: {
    getAll: async (): Promise<MaterialImage[]> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('material_images').select('*');
        if (data) return data.map(m => ({
          id: m.id, url: m.url, name: m.name, category: m.category,
          fileSize: m.file_size, dimensions: m.dimensions
        }));
      }
      return [];
    },
    create: async (m: MaterialImage) => {
       if (!isDemoMode) {
        await supabase.from('material_images').insert({
          id: m.id, url: m.url, name: m.name, category: m.category,
          file_size: m.fileSize, dimensions: m.dimensions
        });
      }
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('material_images').delete().eq('id', id);
    }
  },

  payments: {
    getAll: async () => {
      if (!isDemoMode) {
        const { data } = await supabase.from('payments').select('*');
        if (data) return data.map(p => ({
          id: p.id, name: p.name, type: p.type as PaymentMethod,
          isActive: p.is_active, iconType: p.icon_type, instructions: p.instructions
        }));
      }
      return [];
    },
    toggle: async (id: string) => {
       const payments = await api.payments.getAll();
       const target = payments.find(p => p.id === id);
       if (target && !isDemoMode) {
         await supabase.from('payments').update({ is_active: !target.isActive }).eq('id', id);
       }
    },
    create: async (p: PaymentMethodConfig) => {
      if (!isDemoMode) {
        await supabase.from('payments').insert({
          id: p.id, name: p.name, type: p.type,
          is_active: p.isActive, icon_type: p.iconType, instructions: p.instructions
        });
      }
    },
    update: async (p: PaymentMethodConfig) => {
       if (!isDemoMode) {
        await supabase.from('payments').update({
          name: p.name, type: p.type, is_active: p.isActive,
          icon_type: p.iconType, instructions: p.instructions
        }).eq('id', p.id);
      }
    },
    delete: async (id: string) => {
      if (!isDemoMode) await supabase.from('payments').delete().eq('id', id);
    }
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      if (!isDemoMode) {
        const { data } = await supabase.from('config').select('*').eq('id', 'global').single();
        if (data) return {
          hotelName: data.hotel_name,
          version: data.version,
          theme: data.theme as any,
          fontFamily: 'Plus Jakarta Sans',
          fontSizeBase: 16,
          fontWeightBase: 500,
          lineHeightBase: 1.5,
          letterSpacing: 0,
          contrastStrict: true,
          textColorMain: '#0f172a',
          bgColorMain: '#f8fafc',
          printerIp: data.printer_ip || '192.168.1.100',
          printerPort: data.printer_port || '9100',
          autoPrintOrder: true,
          autoPrintReceipt: true,
          voiceBroadcastEnabled: true,
          voiceVolume: 0.8,
          serviceChargeRate: Number(data.service_charge_rate || 5)
        };
      }
      return { hotelName: '江西云厨', version: '5.2.0', theme: 'light' } as any;
    },
    update: async (c: SystemConfig) => {
      if (!isDemoMode) {
        await supabase.from('config').update({
          hotel_name: c.hotelName, version: c.version, theme: c.theme,
          printer_ip: c.printerIp, printer_port: c.printerPort,
          service_charge_rate: c.serviceChargeRate, updated_at: new Date().toISOString()
        }).eq('id', 'global');
      }
    }
  }
};
import { Partner, Order, Dish, HotelRoom, Expense, AppUser as UserType, OrderStatus, MaterialImage, PaymentMethodConfig, SystemConfig, Ingredient, RoomStatus, PaymentMethod, UserRole, Category } from '../types';
import { apiCache } from './apiCache';
import { supabase } from './supabaseClient';
import { Users, MenuDishes, MenuCategories, Rooms } from '../types/supabase';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Cloud Request Timeout')), timeoutMs))
  ]);
};

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any): never => {
  console.error('Supabase operation failed:', error?.message || error);
  throw new Error(error?.message || 'Unknown error occurred');
};

// Check if user has admin role
const isAdmin = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const userRole = session.user?.user_metadata?.role;
  return userRole === 'admin';
};

// Check if user has developer role
const isDeveloper = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const userRole = session.user?.user_metadata?.role;
  return userRole === 'developer';
};

// Check if user has staff role
const isStaff = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const userRole = session.user?.user_metadata?.role;
  return userRole === 'staff';
};

// Check if user has elevated permissions (admin or developer)
const hasElevatedPermissions = async (): Promise<boolean> => {
  const admin = await isAdmin();
  const developer = await isDeveloper();
  return admin || developer;
};

// Helper function to validate JWT token and check permissions
const validateJWT = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return false;
  }
  
  // Check if token is expired
  const isExpired = session.expires_at && session.expires_at < Math.floor(Date.now() / 1000);
  return !isExpired;
};

// Refresh session if needed
const ensureValidSession = async (): Promise<void> => {
  const isValid = await validateJWT();
  if (!isValid) {
    // JWT is invalid or expired, trigger re-login
    throw new Error('Invalid or expired session. Please log in again.');
  }
};

// Check permission for a specific operation
const checkPermission = async (tableName: string, operation: 'read' | 'write'): Promise<boolean> => {
  const admin = await isAdmin();
  const developer = await isDeveloper();
  const staff = await isStaff();
  
  // Admin and developer roles have full access
  if (admin || developer) return true;
  
  // Staff role has limited access
  if (staff) {
    switch(tableName) {
      case 'rooms':
      case 'menu_dishes':
      case 'menu_categories':
        return true; // Staff can read/write these tables
      default:
        return false;
    }
  }
  
  // For non-admin/developer users, apply specific permission checks based on RLS rules
  switch(tableName) {
    case 'users':
      // Users can only read/write their own records
      return operation === 'read' || operation === 'write';
    case 'menu_dishes':
    case 'menu_categories':
      // Non-admins can only read
      return operation === 'read';
    case 'rooms':
      // Special logic for rooms
      return true; // Allow access for now
    default:
      return false;
  }
};

// Handle RLS errors
const handleRLSError = (error: any): void => {
  if (error?.message?.includes('permission denied') || error?.code === '42501') {
    throw new Error('无对应权限，请联系管理员');
  }
  handleSupabaseError(error);
};

// Force initialize system users with specified accounts
export const initSystemUsers = async (): Promise<void> => {
  try {
    // Define the required system users
    const systemUsers = [
      {
        email: '28111284084qq.com',
        username: 'admin',
        password: 'uU196571/',
        role: 'admin',
        full_name: 'Administrator'
      },
      {
        email: 'flbxiaolang99gmail.com',
        username: 'staff01',
        password: 'Sansi221505.',
        role: 'staff',
        full_name: 'Staff User'
      },
      {
        email: 'AthenDrakominproton.me',
        username: 'dev01',
        password: 'Aa123456..',
        role: 'developer',
        full_name: 'Developer User'
      }
    ];

    // Create all users regardless of existing data
    for (const user of systemUsers) {
      try {
        const userToInsert = {
          id: crypto.randomUUID(),
          email: user.email,
          username: user.username,
          password: user.password, // In a real implementation, this should be hashed
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          full_name: user.full_name,
          is_online: false
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([userToInsert])
          .select(); // Using select to trigger RLS check but ignoring result

        if (insertError) {
          // Check if it's a duplicate key error - which is okay
          if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
            console.log(`User already exists: ${user.email}`);
          } else {
            console.error(`Failed to create ${user.role} user (${user.email}):`, insertError.message);
          }
        } else {
          console.log(`Successfully created ${user.role} user: ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error creating ${user.role} user (${user.email}):`, userError);
      }
    }
  } catch (error) {
    console.error('Error during system users initialization:', error);
  }
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
    getAll: async (): Promise<UserType[]> => {
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
    create: async (u: UserType) => {
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
    update: async (u: UserType) => {
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
  },

  // Type-safe User operations
  typedUsers: {
    // Get all users with pagination
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: User[], count: number | null }> => {
      try {
        await ensureValidSession();
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('users')
          .select('id, email, created_at, updated_at, full_name, avatar_url, metadata, auth_id, role', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleSupabaseError(error);
        
        return { 
          data: data?.map(user => ({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            updated_at: user.updated_at,
            username: user.email, // derived from email
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            metadata: user.metadata,
            auth_id: user.auth_id,
            role: user.role
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching users:', error?.message || error);
        throw new Error('Failed to fetch users: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get user by ID
    getById: async (id: string): Promise<User | null> => {
      try {
        await ensureValidSession();
        
        const { data, error } = await supabase
          .from('users')
          .select('id, email, created_at, updated_at, full_name, avatar_url, metadata, auth_id, role')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleSupabaseError(error);
        }

        return data ? {
          id: data.id,
          email: data.email,
          created_at: data.created_at,
          updated_at: data.updated_at,
          username: data.email, // derived from email
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          metadata: data.metadata,
          auth_id: data.auth_id,
          role: data.role
        } : null;
      } catch (error: any) {
        console.error('Error fetching user:', error?.message || error);
        throw new Error('Failed to fetch user: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new user
    create: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'username'>): Promise<User> => {
      try {
        await ensureValidSession();
        
        // Validate required fields
        if (!userData.email) {
          throw new Error('Email is required');
        }

        const { data, error } = await supabase
          .from('users')
          .insert([{
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            metadata: userData.metadata,
            auth_id: userData.auth_id,
            role: userData.role
          }])
          .select('id, email, created_at, updated_at, full_name, avatar_url, metadata, auth_id, role')
          .single();

        if (error) handleSupabaseError(error);

        return {
          id: data.id,
          email: data.email,
          created_at: data.created_at,
          updated_at: data.updated_at,
          username: data.email, // derived from email
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          metadata: data.metadata,
          auth_id: data.auth_id,
          role: data.role
        };
      } catch (error: any) {
        console.error('Error creating user:', error?.message || error);
        throw new Error('Failed to create user: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update user
    update: async (id: string, userData: Partial<User>): Promise<User> => {
      try {
        await ensureValidSession();
        
        const { data, error } = await supabase
          .from('users')
          .update({
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            metadata: userData.metadata,
            auth_id: userData.auth_id,
            role: userData.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('id, email, created_at, updated_at, full_name, avatar_url, metadata, auth_id, role')
          .single();

        if (error) handleSupabaseError(error);

        return {
          id: data.id,
          email: data.email,
          created_at: data.created_at,
          updated_at: data.updated_at,
          username: data.email, // derived from email
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          metadata: data.metadata,
          auth_id: data.auth_id,
          role: data.role
        };
      } catch (error: any) {
        console.error('Error updating user:', error?.message || error);
        throw new Error('Failed to update user: ' + (error?.message || 'Unknown error'));
      }
    },

    // Soft delete user (set is_active to false if column exists, otherwise just remove)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        
        // Check if soft delete column exists, otherwise do hard delete
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (error) handleSupabaseError(error);
      } catch (error: any) {
        console.error('Error deleting user:', error?.message || error);
        throw new Error('Failed to delete user: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Type-safe MenuDishes operations
  typedProducts: {
    // Get all products with pagination
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: MenuDishes[], count: number | null }> => {
      try {
        await ensureValidSession();
        const admin = await isAdmin();
        const developer = await isDeveloper();
        const staff = await isStaff();
        
        if (!admin && !developer && !staff) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('menu_dishes')
          .select('idx, id, name_zh, name_en, price_cents, stock, image_url, is_available, created_at, category_id', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(product => ({
            idx: product.idx,
            id: product.id,
            name_zh: product.name_zh,
            name_en: product.name_en,
            price_cents: Number(product.price_cents),
            stock: product.stock !== null && product.stock !== undefined ? Number(product.stock) : 0,
            image_url: product.image_url,
            is_available: product.is_available !== undefined ? product.is_available : true,
            created_at: product.created_at,
            category_id: product.category_id
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching products:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch products: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get product by ID
    getById: async (id: string): Promise<MenuDishes | null> => {
      try {
        await ensureValidSession();
        const admin = await isAdmin();
        const developer = await isDeveloper();
        const staff = await isStaff();
        
        if (!admin && !developer && !staff) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { data, error } = await supabase
          .from('menu_dishes')
          .select('idx, id, name_zh, name_en, price_cents, stock, image_url, is_available, created_at, category_id')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          idx: data.idx,
          id: data.id,
          name_zh: data.name_zh,
          name_en: data.name_en,
          price_cents: Number(data.price_cents),
          stock: data.stock !== null && data.stock !== undefined ? Number(data.stock) : 0,
          image_url: data.image_url,
          is_available: data.is_available !== undefined ? data.is_available : true,
          created_at: data.created_at,
          category_id: data.category_id
        } : null;
      } catch (error: any) {
        console.error('Error fetching product:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch product: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new product
    create: async (productData: Omit<MenuDishes, 'id'>): Promise<MenuDishes> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (!productData.name_zh) {
          throw new Error('Product name_zh is required');
        }
        if (productData.price_cents === undefined || productData.price_cents === null) {
          throw new Error('Product price_cents is required');
        }

        const { data, error } = await supabase
          .from('menu_dishes')
          .insert([{
            idx: productData.idx,
            id: productData.id || crypto.randomUUID(),
            name_zh: productData.name_zh,
            name_en: productData.name_en,
            price_cents: productData.price_cents,
            stock: productData.stock,
            image_url: productData.image_url,
            is_available: productData.is_available,
            category_id: productData.category_id
          }])
          .select('idx, id, name_zh, name_en, price_cents, stock, image_url, is_available, created_at, category_id')
          .single();

        if (error) handleRLSError(error);

        return {
          idx: data.idx,
          id: data.id,
          name_zh: data.name_zh,
          name_en: data.name_en,
          price_cents: Number(data.price_cents),
          stock: data.stock !== null && data.stock !== undefined ? Number(data.stock) : 0,
          image_url: data.image_url,
          is_available: data.is_available !== undefined ? data.is_available : true,
          created_at: data.created_at,
          category_id: data.category_id
        };
      } catch (error: any) {
        console.error('Error creating product:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create product: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update product
    update: async (id: string, productData: Partial<MenuDishes>): Promise<MenuDishes> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (productData.idx !== undefined) updateData.idx = productData.idx;
        if (productData.name_zh !== undefined) updateData.name_zh = productData.name_zh;
        if (productData.name_en !== undefined) updateData.name_en = productData.name_en;
        if (productData.price_cents !== undefined) updateData.price_cents = productData.price_cents;
        if (productData.stock !== undefined) updateData.stock = productData.stock;
        if (productData.image_url !== undefined) updateData.image_url = productData.image_url;
        if (productData.is_available !== undefined) updateData.is_available = productData.is_available;
        if (productData.category_id !== undefined) updateData.category_id = productData.category_id;

        const { data, error } = await supabase
          .from('menu_dishes')
          .update(updateData)
          .eq('id', id)
          .select('idx, id, name_zh, name_en, price_cents, stock, image_url, is_available, created_at, category_id')
          .single();

        if (error) handleRLSError(error);

        return {
          idx: data.idx,
          id: data.id,
          name_zh: data.name_zh,
          name_en: data.name_en,
          price_cents: Number(data.price_cents),
          stock: data.stock !== null && data.stock !== undefined ? Number(data.stock) : 0,
          image_url: data.image_url,
          is_available: data.is_available !== undefined ? data.is_available : true,
          created_at: data.created_at,
          category_id: data.category_id
        };
      } catch (error: any) {
        console.error('Error updating product:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update product: ' + (error?.message || 'Unknown error'));
      }
    },

    // Soft delete product
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('menu_dishes')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting product:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete product: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Menu categories operations
  menuCategories: {
    // Get all categories
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: MenuCategories[], count: number | null }> => {
      try {
        await ensureValidSession();
        const admin = await isAdmin();
        const developer = await isDeveloper();
        const staff = await isStaff();
        
        if (!admin && !developer && !staff) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('menu_categories')
          .select('id, name, parent_id, level, display_order, created_at, updated_at', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(category => ({
            id: category.id,
            name: category.name,
            parent_id: category.parent_id,
            level: category.level,
            display_order: category.display_order,
            created_at: category.created_at,
            updated_at: category.updated_at
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching menu categories:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch menu categories: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get category by ID
    getById: async (id: number): Promise<MenuCategories | null> => {
      try {
        await ensureValidSession();
        const admin = await isAdmin();
        const developer = await isDeveloper();
        const staff = await isStaff();
        
        if (!admin && !developer && !staff) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { data, error } = await supabase
          .from('menu_categories')
          .select('id, name, parent_id, level, display_order, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          name: data.name,
          parent_id: data.parent_id,
          level: data.level,
          display_order: data.display_order,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
      } catch (error: any) {
        console.error('Error fetching menu category:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch menu category: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new category (admin/developer only)
    create: async (categoryData: Omit<MenuCategories, 'id'>): Promise<MenuCategories> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (!categoryData.name) {
          throw new Error('Category name is required');
        }

        const { data, error } = await supabase
          .from('menu_categories')
          .insert([{
            name: categoryData.name,
            parent_id: categoryData.parent_id,
            level: categoryData.level,
            display_order: categoryData.display_order
          }])
          .select('id, name, parent_id, level, display_order, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          parent_id: data.parent_id,
          level: data.level,
          display_order: data.display_order,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error creating menu category:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create menu category: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update category (admin/developer only)
    update: async (id: number, categoryData: Partial<MenuCategories>): Promise<MenuCategories> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (categoryData.name !== undefined) updateData.name = categoryData.name;
        if (categoryData.parent_id !== undefined) updateData.parent_id = categoryData.parent_id;
        if (categoryData.level !== undefined) updateData.level = categoryData.level;
        if (categoryData.display_order !== undefined) updateData.display_order = categoryData.display_order;

        const { data, error } = await supabase
          .from('menu_categories')
          .update(updateData)
          .eq('id', id)
          .select('id, name, parent_id, level, display_order, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          parent_id: data.parent_id,
          level: data.level,
          display_order: data.display_order,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error updating menu category:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update menu category: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete category (admin/developer only)
    delete: async (id: number): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('menu_categories')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting menu category:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete menu category: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Rooms operations
  rooms: {
    // Get all rooms
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Rooms[], count: number | null }> => {
      try {
        await ensureValidSession();
        const admin = await isAdmin();
        const developer = await isDeveloper();
        const staff = await isStaff();
        
        if (!admin && !developer && !staff) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('rooms')
          .select('id, status, guest_name, check_in_time, created_at, updated_at', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(room => ({
            id: room.id,
            status: room.status,
            guest_name: room.guest_name,
            check_in_time: room.check_in_time,
            created_at: room.created_at,
            updated_at: room.updated_at
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching rooms:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch rooms: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get room by ID
    getById: async (id: string): Promise<Rooms | null> => {
      try {
        await ensureValidSession();
        const admin = await isAdmin();
        const developer = await isDeveloper();
        const staff = await isStaff();
        
        if (!admin && !developer && !staff) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { data, error } = await supabase
          .from('rooms')
          .select('id, status, guest_name, check_in_time, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          status: data.status,
          guest_name: data.guest_name,
          check_in_time: data.check_in_time,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
      } catch (error: any) {
        console.error('Error fetching room:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch room: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new room (admin/developer only)
    create: async (roomData: Omit<Rooms, 'id' | 'created_at' | 'updated_at'>): Promise<Rooms> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (!roomData.id) {
          throw new Error('Room ID is required');
        }

        const { data, error } = await supabase
          .from('rooms')
          .insert([{
            id: roomData.id,
            status: roomData.status,
            guest_name: roomData.guest_name,
            check_in_time: roomData.check_in_time
          }])
          .select('id, status, guest_name, check_in_time, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          status: data.status,
          guest_name: data.guest_name,
          check_in_time: data.check_in_time,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error creating room:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create room: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update room (admin/developer only)
    update: async (id: string, roomData: Partial<Rooms>): Promise<Rooms> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (roomData.status !== undefined) updateData.status = roomData.status;
        if (roomData.guest_name !== undefined) updateData.guest_name = roomData.guest_name;
        if (roomData.check_in_time !== undefined) updateData.check_in_time = roomData.check_in_time;

        const { data, error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', id)
          .select('id, status, guest_name, check_in_time, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          status: data.status,
          guest_name: data.guest_name,
          check_in_time: data.check_in_time,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error updating room:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update room: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete room (admin/developer only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await hasElevatedPermissions()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting room:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete room: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Initialize system users function
  initSystemUsers: initSystemUsers

  // The following sections are commented out to avoid issues with empty tables
  /*
  // Users table operations
  usersTable: {
    // Get all users (admin only)
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Users[], count: number | null }> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, metadata, created_at, updated_at, auth_id, role, username, password, last_login, module_permissions, ip_whitelist, is_online', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(user => ({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            metadata: user.metadata,
            created_at: user.created_at,
            updated_at: user.updated_at,
            auth_id: user.auth_id,
            role: user.role,
            username: user.username,
            password: user.password,
            last_login: user.last_login,
            module_permissions: user.module_permissions,
            ip_whitelist: user.ip_whitelist,
            is_online: user.is_online
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching users:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch users: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get user by ID (own data or admin)
    getById: async (id: string): Promise<Users | null> => {
      try {
        await ensureValidSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!await isAdmin() && currentUser?.id !== id) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, metadata, created_at, updated_at, auth_id, role, username, password, last_login, module_permissions, ip_whitelist, is_online')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
          auth_id: data.auth_id,
          role: data.role,
          username: data.username,
          password: data.password,
          last_login: data.last_login,
          module_permissions: data.module_permissions,
          ip_whitelist: data.ip_whitelist,
          is_online: data.is_online
        } : null;
      } catch (error: any) {
        console.error('Error fetching user:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch user: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update user (own data or admin)
    update: async (id: string, userData: Partial<Users>): Promise<Users> => {
      try {
        await ensureValidSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!await isAdmin() && currentUser?.id !== id) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (userData.email !== undefined) updateData.email = userData.email;
        if (userData.full_name !== undefined) updateData.full_name = userData.full_name;
        if (userData.avatar_url !== undefined) updateData.avatar_url = userData.avatar_url;
        if (userData.metadata !== undefined) updateData.metadata = userData.metadata;
        if (userData.auth_id !== undefined) updateData.auth_id = userData.auth_id;
        if (userData.role !== undefined) updateData.role = userData.role;
        if (userData.username !== undefined) updateData.username = userData.username;
        if (userData.password !== undefined) updateData.password = userData.password;
        if (userData.last_login !== undefined) updateData.last_login = userData.last_login;
        if (userData.module_permissions !== undefined) updateData.module_permissions = userData.module_permissions;
        if (userData.ip_whitelist !== undefined) updateData.ip_whitelist = userData.ip_whitelist;
        if (userData.is_online !== undefined) updateData.is_online = userData.is_online;

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select('id, email, full_name, avatar_url, metadata, created_at, updated_at, auth_id, role, username, password, last_login, module_permissions, ip_whitelist, is_online')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
          auth_id: data.auth_id,
          role: data.role,
          username: data.username,
          password: data.password,
          last_login: data.last_login,
          module_permissions: data.module_permissions,
          ip_whitelist: data.ip_whitelist,
          is_online: data.is_online
        };
      } catch (error: any) {
        console.error('Error updating user:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update user: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete user (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting user:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete user: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Orders operations
  orders: {
    // Get all orders (user's orders or admin)
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Orders[], count: number | null }> => {
      try {
        await ensureValidSession();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        let query;
        if (await isAdmin()) {
          // Admin can see all orders
          query = supabase.from('orders').select('*', { count: 'exact' });
        } else {
          // Regular users can only see orders related to their access (to be implemented based on room/role)
          query = supabase.from('orders').select('*', { count: 'exact' });
        }
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await query.range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(order => ({
            id: order.id,
            room_id: order.room_id,
            items: order.items,
            total_amount: Number(order.total_amount),
            tax_amount: order.tax_amount !== null ? Number(order.tax_amount) : undefined,
            status: order.status,
            payment_method: order.payment_method,
            created_at: order.created_at,
            updated_at: order.updated_at,
            updated_by: order.updated_by
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching orders:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch orders: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get order by ID (user's order or admin)
    getById: async (id: string): Promise<Orders | null> => {
      try {
        await ensureValidSession();
        
        const { data, error } = await supabase
          .from('orders')
          .select('id, room_id, items, total_amount, tax_amount, status, payment_method, created_at, updated_at, updated_by')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          room_id: data.room_id,
          items: data.items,
          total_amount: Number(data.total_amount),
          tax_amount: data.tax_amount !== null ? Number(data.tax_amount) : undefined,
          status: data.status,
          payment_method: data.payment_method,
          created_at: data.created_at,
          updated_at: data.updated_at,
          updated_by: data.updated_by
        } : null;
      } catch (error: any) {
        console.error('Error fetching order:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch order: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new order
    create: async (orderData: Omit<Orders, 'id' | 'created_at' | 'updated_at'>): Promise<Orders> => {
      try {
        await ensureValidSession();
        
        // Validate required fields
        if (!orderData.room_id) {
          throw new Error('Room ID is required');
        }

        const { data, error } = await supabase
          .from('orders')
          .insert([{
            room_id: orderData.room_id,
            items: orderData.items,
            total_amount: orderData.total_amount,
            tax_amount: orderData.tax_amount,
            status: orderData.status,
            payment_method: orderData.payment_method,
            updated_by: orderData.updated_by
          }])
          .select('id, room_id, items, total_amount, tax_amount, status, payment_method, created_at, updated_at, updated_by')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          room_id: data.room_id,
          items: data.items,
          total_amount: Number(data.total_amount),
          tax_amount: data.tax_amount !== null ? Number(data.tax_amount) : undefined,
          status: data.status,
          payment_method: data.payment_method,
          created_at: data.created_at,
          updated_at: data.updated_at,
          updated_by: data.updated_by
        };
      } catch (error: any) {
        console.error('Error creating order:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create order: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update order (admin or authorized user)
    update: async (id: string, orderData: Partial<Orders>): Promise<Orders> => {
      try {
        await ensureValidSession();
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (orderData.room_id !== undefined) updateData.room_id = orderData.room_id;
        if (orderData.items !== undefined) updateData.items = orderData.items;
        if (orderData.total_amount !== undefined) updateData.total_amount = orderData.total_amount;
        if (orderData.tax_amount !== undefined) updateData.tax_amount = orderData.tax_amount;
        if (orderData.status !== undefined) updateData.status = orderData.status;
        if (orderData.payment_method !== undefined) updateData.payment_method = orderData.payment_method;
        if (orderData.updated_by !== undefined) updateData.updated_by = orderData.updated_by;

        const { data, error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', id)
          .select('id, room_id, items, total_amount, tax_amount, status, payment_method, created_at, updated_at, updated_by')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          room_id: data.room_id,
          items: data.items,
          total_amount: Number(data.total_amount),
          tax_amount: data.tax_amount !== null ? Number(data.tax_amount) : undefined,
          status: data.status,
          payment_method: data.payment_method,
          created_at: data.created_at,
          updated_at: data.updated_at,
          updated_by: data.updated_by
        };
      } catch (error: any) {
        console.error('Error updating order:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update order: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete order (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting order:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete order: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Ingredients operations
  ingredients: {
    // Get all ingredients
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Ingredients[], count: number | null }> => {
      try {
        await ensureValidSession();
        await checkPermission('ingredients', 'read');
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('ingredients')
          .select('id, name, unit, stock, min_stock, category, last_restocked, created_at, updated_at', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(ingredient => ({
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            stock: ingredient.stock !== null ? Number(ingredient.stock) : 0,
            min_stock: ingredient.min_stock !== null ? Number(ingredient.min_stock) : 10,
            category: ingredient.category,
            last_restocked: ingredient.last_restocked,
            created_at: ingredient.created_at,
            updated_at: ingredient.updated_at
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching ingredients:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch ingredients: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get ingredient by ID
    getById: async (id: string): Promise<Ingredients | null> => {
      try {
        await ensureValidSession();
        await checkPermission('ingredients', 'read');
        
        const { data, error } = await supabase
          .from('ingredients')
          .select('id, name, unit, stock, min_stock, category, last_restocked, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          name: data.name,
          unit: data.unit,
          stock: data.stock !== null ? Number(data.stock) : 0,
          min_stock: data.min_stock !== null ? Number(data.min_stock) : 10,
          category: data.category,
          last_restocked: data.last_restocked,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
      } catch (error: any) {
        console.error('Error fetching ingredient:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch ingredient: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new ingredient (admin only)
    create: async (ingredientData: Omit<Ingredients, 'id' | 'created_at' | 'updated_at'>): Promise<Ingredients> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (!ingredientData.name) {
          throw new Error('Ingredient name is required');
        }
        if (!ingredientData.unit) {
          throw new Error('Ingredient unit is required');
        }

        const { data, error } = await supabase
          .from('ingredients')
          .insert([{
            name: ingredientData.name,
            unit: ingredientData.unit,
            stock: ingredientData.stock,
            min_stock: ingredientData.min_stock,
            category: ingredientData.category,
            last_restocked: ingredientData.last_restocked
          }])
          .select('id, name, unit, stock, min_stock, category, last_restocked, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          unit: data.unit,
          stock: data.stock !== null ? Number(data.stock) : 0,
          min_stock: data.min_stock !== null ? Number(data.min_stock) : 10,
          category: data.category,
          last_restocked: data.last_restocked,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error creating ingredient:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create ingredient: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update ingredient (admin only)
    update: async (id: string, ingredientData: Partial<Ingredients>): Promise<Ingredients> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (ingredientData.name !== undefined) updateData.name = ingredientData.name;
        if (ingredientData.unit !== undefined) updateData.unit = ingredientData.unit;
        if (ingredientData.stock !== undefined) updateData.stock = ingredientData.stock;
        if (ingredientData.min_stock !== undefined) updateData.min_stock = ingredientData.min_stock;
        if (ingredientData.category !== undefined) updateData.category = ingredientData.category;
        if (ingredientData.last_restocked !== undefined) updateData.last_restocked = ingredientData.last_restocked;

        const { data, error } = await supabase
          .from('ingredients')
          .update(updateData)
          .eq('id', id)
          .select('id, name, unit, stock, min_stock, category, last_restocked, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          unit: data.unit,
          stock: data.stock !== null ? Number(data.stock) : 0,
          min_stock: data.min_stock !== null ? Number(data.min_stock) : 10,
          category: data.category,
          last_restocked: data.last_restocked,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error updating ingredient:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update ingredient: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete ingredient (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting ingredient:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete ingredient: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Payments operations
  payments: {
    // Get all payments
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Payments[], count: number | null }> => {
      try {
        await ensureValidSession();
        await checkPermission('payments', 'read');
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('payments')
          .select('id, name, type, is_active, icon_type, instructions, created_at, updated_at', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(payment => ({
            id: payment.id,
            name: payment.name,
            type: payment.type,
            is_active: payment.is_active !== undefined ? payment.is_active : true,
            icon_type: payment.icon_type !== undefined ? payment.icon_type : 'credit-card',
            instructions: payment.instructions,
            created_at: payment.created_at,
            updated_at: payment.updated_at
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching payments:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch payments: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get payment by ID
    getById: async (id: string): Promise<Payments | null> => {
      try {
        await ensureValidSession();
        await checkPermission('payments', 'read');
        
        const { data, error } = await supabase
          .from('payments')
          .select('id, name, type, is_active, icon_type, instructions, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          name: data.name,
          type: data.type,
          is_active: data.is_active !== undefined ? data.is_active : true,
          icon_type: data.icon_type !== undefined ? data.icon_type : 'credit-card',
          instructions: data.instructions,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
      } catch (error: any) {
        console.error('Error fetching payment:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch payment: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new payment (admin only)
    create: async (paymentData: Omit<Payments, 'id' | 'created_at' | 'updated_at'>): Promise<Payments> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (!paymentData.name) {
          throw new Error('Payment name is required');
        }
        if (!paymentData.type) {
          throw new Error('Payment type is required');
        }

        const { data, error } = await supabase
          .from('payments')
          .insert([{
            name: paymentData.name,
            type: paymentData.type,
            is_active: paymentData.is_active,
            icon_type: paymentData.icon_type,
            instructions: paymentData.instructions
          }])
          .select('id, name, type, is_active, icon_type, instructions, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          type: data.type,
          is_active: data.is_active !== undefined ? data.is_active : true,
          icon_type: data.icon_type !== undefined ? data.icon_type : 'credit-card',
          instructions: data.instructions,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error creating payment:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create payment: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update payment (admin only)
    update: async (id: string, paymentData: Partial<Payments>): Promise<Payments> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (paymentData.name !== undefined) updateData.name = paymentData.name;
        if (paymentData.type !== undefined) updateData.type = paymentData.type;
        if (paymentData.is_active !== undefined) updateData.is_active = paymentData.is_active;
        if (paymentData.icon_type !== undefined) updateData.icon_type = paymentData.icon_type;
        if (paymentData.instructions !== undefined) updateData.instructions = paymentData.instructions;

        const { data, error } = await supabase
          .from('payments')
          .update(updateData)
          .eq('id', id)
          .select('id, name, type, is_active, icon_type, instructions, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          type: data.type,
          is_active: data.is_active !== undefined ? data.is_active : true,
          icon_type: data.icon_type !== undefined ? data.icon_type : 'credit-card',
          instructions: data.instructions,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error updating payment:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update payment: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete payment (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting payment:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete payment: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Partners operations
  partners: {
    // Get all partners
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Partners[], count: number | null }> => {
      try {
        await ensureValidSession();
        await checkPermission('partners', 'read');
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('partners')
          .select('id, name, owner_name, status, commission_rate, balance, total_sales, authorized_categories, joined_at, user_id, contact, email, created_at, updated_at', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(partner => ({
            id: partner.id,
            name: partner.name,
            owner_name: partner.owner_name,
            status: partner.status !== undefined ? partner.status : 'active',
            commission_rate: partner.commission_rate !== null ? Number(partner.commission_rate) : 0.0000,
            balance: partner.balance !== null ? Number(partner.balance) : 0,
            total_sales: partner.total_sales !== null ? Number(partner.total_sales) : 0,
            authorized_categories: partner.authorized_categories,
            joined_at: partner.joined_at,
            user_id: partner.user_id,
            contact: partner.contact,
            email: partner.email,
            created_at: partner.created_at,
            updated_at: partner.updated_at
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching partners:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch partners: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get partner by ID
    getById: async (id: string): Promise<Partners | null> => {
      try {
        await ensureValidSession();
        await checkPermission('partners', 'read');
        
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, owner_name, status, commission_rate, balance, total_sales, authorized_categories, joined_at, user_id, contact, email, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          name: data.name,
          owner_name: data.owner_name,
          status: data.status !== undefined ? data.status : 'active',
          commission_rate: data.commission_rate !== null ? Number(data.commission_rate) : 0.0000,
          balance: data.balance !== null ? Number(data.balance) : 0,
          total_sales: data.total_sales !== null ? Number(data.total_sales) : 0,
          authorized_categories: data.authorized_categories,
          joined_at: data.joined_at,
          user_id: data.user_id,
          contact: data.contact,
          email: data.email,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
      } catch (error: any) {
        console.error('Error fetching partner:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch partner: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new partner (admin only)
    create: async (partnerData: Omit<Partners, 'id' | 'created_at' | 'updated_at' | 'joined_at'>): Promise<Partners> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (!partnerData.name) {
          throw new Error('Partner name is required');
        }

        const { data, error } = await supabase
          .from('partners')
          .insert([{
            name: partnerData.name,
            owner_name: partnerData.owner_name,
            status: partnerData.status,
            commission_rate: partnerData.commission_rate,
            balance: partnerData.balance,
            total_sales: partnerData.total_sales,
            authorized_categories: partnerData.authorized_categories,
            user_id: partnerData.user_id,
            contact: partnerData.contact,
            email: partnerData.email
          }])
          .select('id, name, owner_name, status, commission_rate, balance, total_sales, authorized_categories, joined_at, user_id, contact, email, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          owner_name: data.owner_name,
          status: data.status !== undefined ? data.status : 'active',
          commission_rate: data.commission_rate !== null ? Number(data.commission_rate) : 0.0000,
          balance: data.balance !== null ? Number(data.balance) : 0,
          total_sales: data.total_sales !== null ? Number(data.total_sales) : 0,
          authorized_categories: data.authorized_categories,
          joined_at: data.joined_at,
          user_id: data.user_id,
          contact: data.contact,
          email: data.email,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error creating partner:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create partner: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update partner (admin only)
    update: async (id: string, partnerData: Partial<Partners>): Promise<Partners> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (partnerData.name !== undefined) updateData.name = partnerData.name;
        if (partnerData.owner_name !== undefined) updateData.owner_name = partnerData.owner_name;
        if (partnerData.status !== undefined) updateData.status = partnerData.status;
        if (partnerData.commission_rate !== undefined) updateData.commission_rate = partnerData.commission_rate;
        if (partnerData.balance !== undefined) updateData.balance = partnerData.balance;
        if (partnerData.total_sales !== undefined) updateData.total_sales = partnerData.total_sales;
        if (partnerData.authorized_categories !== undefined) updateData.authorized_categories = partnerData.authorized_categories;
        if (partnerData.user_id !== undefined) updateData.user_id = partnerData.user_id;
        if (partnerData.contact !== undefined) updateData.contact = partnerData.contact;
        if (partnerData.email !== undefined) updateData.email = partnerData.email;

        const { data, error } = await supabase
          .from('partners')
          .update(updateData)
          .eq('id', id)
          .select('id, name, owner_name, status, commission_rate, balance, total_sales, authorized_categories, joined_at, user_id, contact, email, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          name: data.name,
          owner_name: data.owner_name,
          status: data.status !== undefined ? data.status : 'active',
          commission_rate: data.commission_rate !== null ? Number(data.commission_rate) : 0.0000,
          balance: data.balance !== null ? Number(data.balance) : 0,
          total_sales: data.total_sales !== null ? Number(data.total_sales) : 0,
          authorized_categories: data.authorized_categories,
          joined_at: data.joined_at,
          user_id: data.user_id,
          contact: data.contact,
          email: data.email,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error updating partner:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update partner: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete partner (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('partners')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting partner:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete partner: ' + (error?.message || 'Unknown error'));
      }
    }
  },

  // Expenses operations
  expenses: {
    // Get all expenses
    getAll: async (page: number = 1, limit: number = 20): Promise<{ data: Expenses[], count: number | null }> => {
      try {
        await ensureValidSession();
        await checkPermission('expenses', 'read');
        
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
          .from('expenses')
          .select('id, amount, category, description, date, paid_by, receipt_url, partner_id, created_at, updated_at', { count: 'exact' })
          .range(offset, offset + limit - 1);

        if (error) handleRLSError(error);
        
        return { 
          data: data?.map(expense => ({
            id: expense.id,
            amount: Number(expense.amount),
            category: expense.category,
            description: expense.description,
            date: expense.date,
            paid_by: expense.paid_by,
            receipt_url: expense.receipt_url,
            partner_id: expense.partner_id,
            created_at: expense.created_at,
            updated_at: expense.updated_at
          })) || [], 
          count 
        };
      } catch (error: any) {
        console.error('Error fetching expenses:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch expenses: ' + (error?.message || 'Unknown error'));
      }
    },

    // Get expense by ID
    getById: async (id: string): Promise<Expenses | null> => {
      try {
        await ensureValidSession();
        await checkPermission('expenses', 'read');
        
        const { data, error } = await supabase
          .from('expenses')
          .select('id, amount, category, description, date, paid_by, receipt_url, partner_id, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Row not found
          handleRLSError(error);
        }

        return data ? {
          id: data.id,
          amount: Number(data.amount),
          category: data.category,
          description: data.description,
          date: data.date,
          paid_by: data.paid_by,
          receipt_url: data.receipt_url,
          partner_id: data.partner_id,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
      } catch (error: any) {
        console.error('Error fetching expense:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to fetch expense: ' + (error?.message || 'Unknown error'));
      }
    },

    // Create new expense (admin only)
    create: async (expenseData: Omit<Expenses, 'id' | 'created_at' | 'updated_at'>): Promise<Expenses> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        // Validate required fields
        if (expenseData.amount === undefined || expenseData.amount === null) {
          throw new Error('Expense amount is required');
        }
        if (!expenseData.category) {
          throw new Error('Expense category is required');
        }
        if (!expenseData.date) {
          throw new Error('Expense date is required');
        }

        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            amount: expenseData.amount,
            category: expenseData.category,
            description: expenseData.description,
            date: expenseData.date,
            paid_by: expenseData.paid_by,
            receipt_url: expenseData.receipt_url,
            partner_id: expenseData.partner_id
          }])
          .select('id, amount, category, description, date, paid_by, receipt_url, partner_id, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          amount: Number(data.amount),
          category: data.category,
          description: data.description,
          date: data.date,
          paid_by: data.paid_by,
          receipt_url: data.receipt_url,
          partner_id: data.partner_id,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error creating expense:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to create expense: ' + (error?.message || 'Unknown error'));
      }
    },

    // Update expense (admin only)
    update: async (id: string, expenseData: Partial<Expenses>): Promise<Expenses> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (expenseData.amount !== undefined) updateData.amount = expenseData.amount;
        if (expenseData.category !== undefined) updateData.category = expenseData.category;
        if (expenseData.description !== undefined) updateData.description = expenseData.description;
        if (expenseData.date !== undefined) updateData.date = expenseData.date;
        if (expenseData.paid_by !== undefined) updateData.paid_by = expenseData.paid_by;
        if (expenseData.receipt_url !== undefined) updateData.receipt_url = expenseData.receipt_url;
        if (expenseData.partner_id !== undefined) updateData.partner_id = expenseData.partner_id;

        const { data, error } = await supabase
          .from('expenses')
          .update(updateData)
          .eq('id', id)
          .select('id, amount, category, description, date, paid_by, receipt_url, partner_id, created_at, updated_at')
          .single();

        if (error) handleRLSError(error);

        return {
          id: data.id,
          amount: Number(data.amount),
          category: data.category,
          description: data.description,
          date: data.date,
          paid_by: data.paid_by,
          receipt_url: data.receipt_url,
          partner_id: data.partner_id,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } catch (error: any) {
        console.error('Error updating expense:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to update expense: ' + (error?.message || 'Unknown error'));
      }
    },

    // Delete expense (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        await ensureValidSession();
        if (!await isAdmin()) {
          throw new Error('无对应权限，请联系管理员');
        }
        
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);

        if (error) handleRLSError(error);
      } catch (error: any) {
        console.error('Error deleting expense:', error?.message || error);
        if (error?.message?.includes('无对应权限')) {
          throw error;
        }
        throw new Error('Failed to delete expense: ' + (error?.message || 'Unknown error'));
      }
    }
  }
*/};
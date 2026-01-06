// Supabase数据库表结构对应的TypeScript类型定义

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  MAINTAINER = 'maintainer'
}

export type AppModule =
  | 'dashboard' | 'rooms' | 'orders' | 'menu' | 'finance'
  | 'partners' | 'users' | 'settings' | 'database'
  | 'images' | 'inventory' | 'payments' | 'supply_chain';

export interface CRUDPermissions {
  enabled: boolean;
  c: boolean; r: boolean; u: boolean; d: boolean;
}

// 支付方式枚举
export enum PaymentMethodType {
  GCASH = 'GCash',
  MAYA = 'Maya',
  CASH = 'Cash',
  ALIPAY = 'Alipay',
  WECHAT = 'Wechat',
  CARD = 'Card'
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 房间状态枚举
export enum RoomStatus {
  READY = 'ready',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning'
}

// 支付配置表类型
export interface PaymentConfig {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name: string;         // TEXT NOT NULL
  type: string;         // TEXT NOT NULL - 'GCash', 'Maya', 'Cash', 'Alipay', 'Wechat'
  isActive: boolean;    // BOOLEAN DEFAULT TRUE
  iconType: string;     // TEXT DEFAULT 'credit-card'
  instructions?: string; // TEXT
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 分类表类型
export interface Category {
  id: number;           // BIGSERIAL PRIMARY KEY
  name: string;         // TEXT UNIQUE NOT NULL
  parentId: number | null; // BIGINT REFERENCES categories(id)
  level: number;        // INTEGER DEFAULT 0
  displayOrder: number; // INTEGER DEFAULT 0
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 食材/物料库存表类型
export interface Ingredient {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name: string;         // TEXT NOT NULL
  unit: string;         // TEXT NOT NULL
  stock: number;        // DECIMAL(12,2) DEFAULT 0
  minStock: number;     // DECIMAL(12,2) DEFAULT 10
  category: string;     // TEXT
  lastRestocked: string; // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 系统全局配置表类型
export interface SystemConfig {
  id: string;           // TEXT PRIMARY KEY DEFAULT 'global'
  hotelName: string;    // TEXT DEFAULT '江西云厨'
  version: string;      // TEXT DEFAULT '5.2.0'
  theme: 'light' | 'dark' | 'custom'; // TEXT DEFAULT 'light'
  fontFamily: string;   // TEXT DEFAULT 'Plus Jakarta Sans'
  fontSizeBase: number; // INTEGER DEFAULT 16
  fontWeightBase: number; // INTEGER DEFAULT 500
  lineHeightBase: number; // DECIMAL(3,2) DEFAULT 1.5
  letterSpacing: number; // DECIMAL(4,2) DEFAULT 0
  contrastStrict: boolean; // BOOLEAN DEFAULT TRUE
  textColorMain: string; // TEXT DEFAULT '#0f172a'
  bgColorMain: string;  // TEXT DEFAULT '#f8fafc'
  printerIp: string;    // TEXT DEFAULT '192.168.1.100'
  printerPort: string;  // TEXT DEFAULT '9100'
  autoPrintOrder: boolean; // BOOLEAN DEFAULT TRUE
  autoPrintReceipt: boolean; // BOOLEAN DEFAULT TRUE
  voiceBroadcastEnabled: boolean; // BOOLEAN DEFAULT TRUE
  voiceVolume: number;  // DECIMAL(3,2) DEFAULT 0.8
  serviceChargeRate: number; // DECIMAL(4,3) DEFAULT 0.05
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 酒店房间表类型
export interface Room {
  idx: number;          // 序号/索引
  id: string;           // TEXT PRIMARY KEY - 房号，如 '8201', 'VIP-666'
  status: RoomStatus;   // TEXT DEFAULT 'ready' - 'ready', 'occupied', 'maintenance', 'cleaning'
  guestName?: string;   // TEXT
  checkInTime?: string; // TIMESTAMP WITH TIME ZONE
  createdAt?: string;   // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt?: string;   // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 订单项类型
export interface OrderItem {
  dishId: string;       // 菜品ID
  name: string;         // 菜品名称
  quantity: number;     // 数量
  price: number;        // 价格
  partnerId?: string;   // 合作伙伴ID
}

// 订单表类型
export interface Order {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  roomId: string;       // TEXT NOT NULL REFERENCES rooms(id)
  items: OrderItem[];   // JSONB NOT NULL - [{dish_id, name, quantity, price}]
  totalAmount: number;  // DECIMAL(10,2) NOT NULL
  taxAmount: number;    // DECIMAL(10,2) DEFAULT 0
  status: OrderStatus;  // TEXT DEFAULT 'pending' - 'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'
  paymentMethod: string; // TEXT DEFAULT 'Cash' - 'Cash', 'Alipay', 'Wechat', 'Card'
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedBy?: string;   // UUID REFERENCES users(id)
}

// 菜品表类型
export interface Dish {
  idx: number;          // 序号/索引
  id: string;           // TEXT PRIMARY KEY - 菜品ID，如 'A1', 'A2'
  name: string;         // 对应数据库 name_zh - 中文名称
  nameEn?: string;      // 对应数据库 name_en - 英文名称
  price: number;        // DECIMAL(8,2) - 价格
  category: string | null; // TEXT - 分类
  stock: number;        // INTEGER - 库存
  imageUrl?: string;    // 对应数据库 image_url - 图片链接
  isAvailable: boolean; // 对应数据库 is_available - 是否可用
  createdAt?: string;   // 对应数据库 created_at - 创建时间
  updatedAt?: string;   // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  partnerId?: string;   // UUID REFERENCES users(id) - 关联合作伙伴
}

// 用户表类型
export interface User {
  id: string;           // UUID NOT NULL DEFAULT gen_random_uuid()
  email: string;        // TEXT NOT NULL
  fullName?: string | null; // TEXT NULL
  avatarUrl?: string | null; // TEXT NULL
  metadata?: Record<string, unknown> | null; // JSONB NULL DEFAULT '{}'::JSONB
  createdAt: string;    // TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  authId?: string | null; // UUID NULL
  role?: UserRole | string | null; // TEXT NULL DEFAULT 'viewer'::TEXT
  username: string;     // 用于登录，可能与email相同
  password?: string;
  lastLogin?: string;
  modulePermissions?: Partial<Record<AppModule, CRUDPermissions>>;
  ipWhitelist?: string[];
  isOnline?: boolean;
}

// 用于从前端创建用户的有效负载
export interface UserCreatePayload {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  authId?: string; // 可选的指向 auth.users 的链接
  role?: UserRole | string;
  username: string;
}

// 部分更新有效负载 (PATCH)
export type UserUpdatePayload = Partial<
  Pick<User, 'fullName' | 'avatarUrl' | 'metadata' | 'role' | 'authId' | 'username'>
>;

// 支出费用表类型
export interface Expense {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  amount: number;       // DECIMAL(10,2) NOT NULL
  category: string;     // TEXT NOT NULL
  description?: string; // TEXT
  date: string;         // DATE NOT NULL
  paidBy?: string;      // TEXT
  receiptUrl?: string;  // TEXT
  partnerId?: string;   // UUID REFERENCES users(id)
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 材料图片库表类型
export interface MaterialImage {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  url: string;          // TEXT NOT NULL
  name: string;         // TEXT NOT NULL
  category: string;     // TEXT
  fileSize?: number;    // INTEGER - 文件大小（字节）
  dimensions?: string;  // TEXT - 尺寸，如 "1920x1080"
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 合作伙伴/商户表类型
export interface Partner {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name: string;         // TEXT NOT NULL
  ownerName?: string;   // TEXT
  status: 'active' | 'inactive' | 'suspended'; // TEXT DEFAULT 'active'
  commissionRate: number; // DECIMAL(5,4) DEFAULT 0.0000 - 佣金率
  balance: number;      // DECIMAL(12,2) DEFAULT 0 - 余额
  totalSales: number;   // DECIMAL(12,2) DEFAULT 0 - 总销售额
  authorizedCategories: string[]; // TEXT[] - 授权品类
  joinedAt: string;     // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  userId: string;       // UUID REFERENCES users(id)
  contact: string;      // TEXT
  email: string;        // TEXT
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 支付方式配置表类型
export interface Payment {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name: string;         // TEXT NOT NULL
  type: string;         // TEXT NOT NULL - 'Cash', 'Alipay', 'Wechat', 'Card', etc.
  isActive: boolean;    // BOOLEAN DEFAULT TRUE
  iconType: string;     // TEXT DEFAULT 'credit-card'
  instructions?: string; // TEXT
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updatedAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 审计日志表类型
export interface AuditLog {
  id: string;           // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  userId?: string;      // UUID REFERENCES users(id)
  action: 'INSERT' | 'UPDATE' | 'DELETE'; // TEXT NOT NULL
  tableName: string;    // TEXT NOT NULL
  recordId?: string;    // TEXT
  oldValues?: Record<string, unknown>; // JSONB
  newValues?: Record<string, unknown>; // JSONB
  ipAddress?: string;   // TEXT
  userAgent?: string;   // TEXT
  createdAt: string;    // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

// 分页响应包装器
export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  perPage?: number;
}
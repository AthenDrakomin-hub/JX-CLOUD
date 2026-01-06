
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

export interface User {
  id: string; // uuid，由数据库生成
  email: string;
  full_name?: string | null; // 映射 DB full_name
  avatar_url?: string | null; // 映射 DB avatar_url
  metadata?: Record<string, unknown> | null; // 映射 DB metadata
  created_at: string; // ISO 日期时间，映射 DB created_at
  updated_at: string; // ISO 日期时间，映射 DB updated_at
  auth_id?: string | null; // 映射 DB auth_id，关联的 auth.user id（如果使用）
  role?: UserRole | string | null; // 映射 DB role，默认为 'viewer'
  username: string; // 用于登录，可能与email相同
  password?: string; 
  lastLogin?: string;
  modulePermissions?: Partial<Record<AppModule, CRUDPermissions>>;
  ipWhitelist?: string[]; 
  isOnline?: boolean;         
}

// 用于从前端创建用户的有效负载（注意：建议使用 Supabase Auth 进行注册）
export interface UserCreatePayload {
  email: string;
  full_name?: string;
  avatar_url?: string;
  metadata?: Record<string, unknown>;
  auth_id?: string; // 可选的指向 auth.users 的链接
  role?: UserRole | string;
  username: string;
}

// 部分更新有效负载 (PATCH)
export type UserUpdatePayload = Partial<
  Pick<User, 'full_name' | 'avatar_url' | 'metadata' | 'role' | 'auth_id' | 'username'>
>;

// 分页响应包装器
export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  per_page?: number;
}

export interface SystemConfig {
  hotelName: string; // DB hotel_name
  version: string;
  theme: 'light' | 'dark' | 'custom';
  fontFamily: string;
  fontSizeBase: number;
  fontWeightBase: number;
  lineHeightBase: number;
  letterSpacing: number;
  contrastStrict: boolean;
  textColorMain: string;
  bgColorMain: string;
  printerIp: string;
  printerPort: string;
  autoPrintOrder: boolean;
  autoPrintReceipt: boolean;
  voiceBroadcastEnabled: boolean;
  voiceVolume: number;
  serviceChargeRate: number; // 对齐 DB
}

export interface OrderItem {
  dishId: string;
  name: string;
  quantity: number;
  price: number;
  partnerId?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  GCASH = 'GCash',
  MAYA = 'Maya',
  CASH = 'Cash'
}

export enum RoomStatus {
  READY = 'ready',
  ORDERING = 'ordering'
}

export interface Order {
  id: string;
  roomId: string; // DB room_id
  items: OrderItem[];
  totalAmount: number; // DB total_amount
  status: OrderStatus;
  paymentMethod: PaymentMethod; // DB payment_method
  createdAt: string;
  updatedAt: string;
  taxAmount: number; // DB tax_amount
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  name: string;
  nameEn?: string; // DB name_en
  price: number;
  category: string; // 保留原有字段
  category_id?: number; // 新增层级分类ID
  stock: number;
  imageUrl: string; // DB image_url
  isAvailable?: boolean; // DB is_available
  description?: string;
  isRecommended?: boolean;
  partnerId?: string; // DB partner_id
}

export interface HotelRoom {
  id: string;
  status?: RoomStatus;
}

export interface MaterialImage {
  id: string;
  url: string;
  name: string;
  category: string;
  fileSize?: string; // 对齐 DB
  dimensions?: string; // 对齐 DB
}

export interface Partner {
  id: string;
  name: string;
  ownerName: string;
  status: 'active' | 'suspended';
  commissionRate: number;
  balance: number;
  totalSales: number;
  authorizedCategories: string[];
  joinedAt: string;
  userId: string;
  contact: string;
  email: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number; // DB min_stock
  category: string;
  lastRestocked: string; // DB last_restocked
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  isActive: boolean; // DB is_active
  iconType: string; // DB icon_type
  instructions?: string;
}
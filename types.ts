// types.ts
// 自动生成 — 基于与数据库对齐的 schema.ts
// 注意：请根据项目需要将 unknown 替换为更精确的类型

export type Json = any;

// 保留原有的接口类型以保证向后兼容性
export enum UserRole {
  ADMIN = 'admin',      
  STAFF = 'staff',
  PARTNER = 'partner', 
  MAINTAINER = 'maintainer',
  USER = 'user'
}

export enum RoomStatus {
  READY = 'ready',
  ORDERING = 'ordering'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface HotelRoom {
  id: string;
  status: RoomStatus | string;
  updatedAt?: string;
}

export type AppModule = 
  | 'dashboard' | 'rooms' | 'orders' | 'supply_chain' | 'financial_hub' 
  | 'images' | 'users' | 'settings' | 'menu' | 'finance' | 'partners' | 'inventory' | 'payments'
  | 'merchant_portal';

export interface CRUDPermissions {
  enabled: boolean; 
  c: boolean; r: boolean; u: boolean; d: boolean; 
}

/**
 * 契约对齐：User 对象的 partner_id 必须映射物理 partner_id
 */
export interface User {
  id: string;
  username?: string;
  email?: string; // DB allows nullable
  name: string;
  role: UserRole;
  partner_id?: string; // 对应数据库字段 partner_id
  module_permissions?: any; // 对应数据库字段 module_permissions
  auth_type?: string; // 对应数据库字段 auth_type
  email_verified?: boolean; // 对应数据库字段 email_verified
  is_active?: boolean; // 对应数据库字段 is_active
  is_passkey_bound?: boolean; // 对应数据库字段 is_passkey_bound
  allowed_ips?: string[]; // 对应数据库字段 allowed_ips (text[])
  display_name?: string; // 对应数据库字段 display_name
  last_login?: string; // 对应数据库字段 last_login
  created_at?: string; // 对应数据库字段 created_at
  updated_at?: string; // 对应数据库字段 updated_at
  
  // Frontend compatibility aliases (camelCase)
  partnerId?: string;
  modulePermissions?: any;
  authType?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  isPasskeyBound?: boolean;
  allowedIps?: string[];
  displayName?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  dishId: string;
  name: string;
  quantity: number;
  price: number;
  partner_id?: string;
}

/**
 * 契约对齐：Order 对象的 room_id 必须映射物理 room_id
 */
export interface Order {
  id: string;
  room_id: string; // 映射数据库字段 room_id
  items: OrderItem[];
  total_amount: number; // 映射数据库字段 total_amount
  status: OrderStatus;
  payment_method?: string; // 映射数据库字段 payment_method
  payment_proof?: string; // 映射数据库字段 payment_proof
  cash_received?: number; // 映射数据库字段 cash_received
  cash_change?: number; // 映射数据库字段 cash_change
  partner_id?: string; // 映射数据库字段 partner_id
  created_at: string; // 映射数据库字段 created_at
  updated_at: string; // 映射数据库字段 updated_at
  // 数据库中没有 customer_id 或 is_printed 字段
  
  // Frontend compatibility aliases (camelCase)
  roomId?: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentProof?: string;
  cashReceived?: number;
  cashChange?: number;
  partnerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 契约对齐：Dish 对象的 category 必须映射物理 category
 */
export interface Dish {
  id: string;
  name: string;
  name_en?: string; // 映射数据库字段 name_en
  price: number; // 映射数据库字段 price
  category?: string; // 映射数据库字段 category (不是 category_id)
  stock: number; // 映射数据库字段 stock
  image_url?: string; // 映射数据库字段 image_url
  is_available: boolean; // 映射数据库字段 is_available
  is_recommended: boolean; // 映射数据库字段 is_recommended
  partner_id?: string; // 映射数据库字段 partner_id
  created_at?: string; // 映射数据库字段 created_at
  // 数据库中没有 description 或 tags 字段
  
  // Frontend compatibility aliases (camelCase)
  nameEn?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isRecommended?: boolean;
  partnerId?: string;
  createdAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  owner_name: string; // 映射 owner_name
  contact?: string;
  email?: string;
  status: 'active' | 'suspended';
  commission_rate: number; // 映射 commission_rate
  balance: number;
  authorized_categories: string[]; // 映射 authorized_categories
  total_sales?: number;
  joined_at?: string;
  
  // Frontend compatibility aliases (camelCase)
  ownerName?: string;
  commissionRate?: number;
  authorizedCategories?: string[];
  totalSales?: number;
  joinedAt?: string;
}

export interface Category {
  id: string; 
  name: string;
  name_en: string; // 映射 name_en
  code: string;
  level: number;
  display_order: number; // 映射 display_order
  is_active: boolean; // 映射 is_active
  parent_id?: string | null; // 映射 parent_id
  partner_id?: string;
  
  // Frontend compatibility aliases (camelCase)
  nameEn?: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
  partnerId?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  name_en?: string; // 映射数据库字段 name_en
  currency: string; // 映射数据库字段 currency
  currency_symbol: string; // 映射数据库字段 currency_symbol
  exchange_rate: number; // 映射数据库字段 exchange_rate
  is_active: boolean; // 映射数据库字段 is_active
  payment_type: string; // 映射数据库字段 payment_type
  sort_order: number; // 映射数据库字段 sort_order
  wallet_address?: string; // 映射数据库字段 wallet_address
  qr_url?: string; // 映射数据库字段 qr_url
  created_at: string; // 映射数据库字段 created_at
  // 数据库中没有 description, description_en, icon_type, updated_at 字段
  
  // Frontend compatibility aliases (camelCase)
  nameEn?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  isActive?: boolean;
  paymentType?: string;
  sortOrder?: number;
  walletAddress?: string;
  qrUrl?: string;
  createdAt?: string;
}

export interface SystemConfig {
  hotel_name: string;
  version: string;
  theme: 'light' | 'dark';
  auto_print_order: boolean;
  ticket_style: 'standard' | 'minimal' | 'elegant';
  font_family: string;
  
  // Frontend compatibility aliases (camelCase)
  hotelName?: string;
  autoPrintOrder?: boolean;
  ticketStyle?: string;
  fontFamily?: string;
}

// Added missing types to fix compilation errors
export type Language = 'zh' | 'en' | 'fil';

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  min_stock: number;
  category: string;
  last_restocked?: string;
  
  // Frontend compatibility aliases (camelCase)
  minStock?: number;
  lastRestocked?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

// ... rest of the file remains the same as original types.ts ...
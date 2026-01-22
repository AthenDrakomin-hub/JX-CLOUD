
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
 * 契约对齐：User 对象的 partnerId 必须映射物理 partner_id
 */
export interface User {
  id: string;
  username?: string;
  email: string; 
  name: string;
  role: UserRole;
  partnerId?: string; // 对应 partner_id
  modulePermissions?: Partial<Record<AppModule, CRUDPermissions>>;
  authType?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  isPasskeyBound?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * 契约对齐：Order 对象的 tableId 必须映射物理 table_id
 */
export interface Order {
  id: string;
  tableId: string; // 映射 table_id
  roomId: string; // 映射 room_id
  customerId?: string;
  items: OrderItem[];
  totalAmount: number; // 应用层统一使用 number
  status: OrderStatus;
  paymentMethod: string;
  paymentProof?: string; 
  cashReceived?: number;
  cashChange?: number;
  isPrinted?: boolean;
  partnerId?: string; // 物理隔离键
  createdAt: string;
  updatedAt: string;
}

/**
 * 契约对齐：Dish 对象的 categoryId 必须映射物理 category_id
 */
export interface Dish {
  id: string;
  name: string;
  nameEn: string; // 映射 name_en
  description?: string;
  tags?: string[];
  price: number; // 应用层统一使用 number
  categoryId: string; // 映射 category_id
  stock: number;
  imageUrl: string; // 映射 image_url
  isAvailable: boolean; // 映射 is_available
  isRecommended?: boolean; // 映射 is_recommended
  partnerId?: string;
  createdAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  ownerName: string; // 映射 owner_name
  contact?: string;
  email?: string;
  status: 'active' | 'suspended';
  commissionRate: number; // 映射 commission_rate
  balance: number;
  authorizedCategories: string[]; // 映射 authorized_categories
  totalSales?: number;
  joinedAt?: string;
}

export interface Category {
  id: string; 
  name: string;
  nameEn: string; // 映射 name_en
  code: string;
  level: number;
  displayOrder: number; // 映射 display_order
  isActive: boolean; // 映射 is_active
  parentId?: string | null; // 映射 parent_id
  partnerId?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  nameEn: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  isActive: boolean;
  paymentType: string;
  sortOrder: number;
  description: string;
  descriptionEn: string;
  iconType: string;
  walletAddress?: string;
  qrUrl?: string;
}

export interface SystemConfig {
  hotelName: string;
  version: string;
  theme: 'light' | 'dark';
  autoPrintOrder: boolean;
  ticketStyle: 'standard' | 'minimal' | 'elegant';
  fontFamily: string;
}

// Added missing types to fix compilation errors
export type Language = 'zh' | 'en' | 'fil';

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  category: string;
  lastRestocked?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}
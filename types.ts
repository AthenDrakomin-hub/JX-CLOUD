
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
  status: RoomStatus | string; // 与src/types/index.ts保持一致
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
  email: string; // 与src/types/index.ts保持一致
  name: string; // 与src/types/index.ts保持一致
  role: UserRole; // 与src/types/index.ts保持一致
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
 * 契约对齐：Order 对象的 roomId 必须映射物理 room_id
 */
export interface Order {
  id: string;
  roomId: string; // 映射 room_id
  tableId: string; // 映射 table_id，与src/types/index.ts保持一致
  customerId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentProof?: string; 
  cashReceived?: number;
  cashChange?: number;
  isPrinted?: boolean; // 添加isPrinted属性
  partnerId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 契约对齐：Dish 对象的 categoryId 必须映射物理 category_id
 */
export interface Dish {
  id: string;
  name: string;
  nameEn: string; // 与src/types/index.ts保持一致
  description?: string;
  tags?: string[];
  price: number;
  categoryId: string; // 与src/types/index.ts保持一致
  stock: number;
  imageUrl: string; // 与src/types/index.ts保持一致
  isAvailable: boolean;
  isRecommended?: boolean;
  partnerId?: string;
  createdAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  ownerName: string; // 与src/types/index.ts保持一致
  contact?: string;
  email?: string;
  status: 'active' | 'suspended'; // 与src/types/index.ts保持一致
  commissionRate: number;
  balance: number;
  authorizedCategories: string[]; // 与src/types/index.ts保持一致
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
  nameEn: string; // 与src/types/index.ts保持一致
  currency: string; // 与src/types/index.ts保持一致
  currencySymbol: string; // 与src/types/index.ts保持一致
  exchangeRate: number;
  isActive: boolean;
  paymentType: string; // 与src/types/index.ts保持一致
  sortOrder: number;
  description: string; // 与src/types/index.ts保持一致
  descriptionEn: string; // 与src/types/index.ts保持一致
  iconType: string; // 与src/types/index.ts保持一致
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
  description: string; // 与src/types/index.ts保持一致
  amount: number;
  category: string; // 与src/types/index.ts保持一致
  date: string;
}



export interface MenuCategory {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
  level: number; // 默认值1
  displayOrder: number; // 默认值0
  isActive: boolean; // 默认值true
  parentId?: string | null;
  createdAt?: string;
}

export interface Room {
  id: string;
  status?: string; // 默认值'ready'
  updatedAt?: string;
}
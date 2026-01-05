
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
  id: string;
  email?: string; // 对齐 DB
  username: string;
  password?: string; 
  role: UserRole;
  name: string; // 映射 DB full_name
  lastLogin?: string;
  modulePermissions?: Partial<Record<AppModule, CRUDPermissions>>;
  ipWhitelist?: string[]; 
  isOnline?: boolean;         
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
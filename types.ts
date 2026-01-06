
export enum UserRole {
  ADMIN = 'admin',      
  STAFF = 'staff',
  MAINTAINER = 'maintainer' 
}

export type AppModule = 
  | 'dashboard' | 'rooms' | 'orders' | 'menu' | 'finance' 
  | 'partners' | 'users' | 'settings' | 'database' 
  | 'images' | 'inventory' | 'payments' | 'supply_chain' | 'financial_hub';

export interface CRUDPermissions {
  enabled: boolean; 
  c: boolean; r: boolean; u: boolean; d: boolean; 
}

export interface User {
  id: string;
  email: string; // 生产环境必须字段，对齐 Supabase Auth
  username: string;
  password?: string; 
  role: UserRole;
  name: string; 
  lastLogin?: string;
  modulePermissions?: Partial<Record<AppModule, CRUDPermissions>>;
  ipWhitelist?: string[]; 
  isOnline?: boolean;         
}

export interface SystemConfig {
  hotelName: string;
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
  serviceChargeRate: number;
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
  roomId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  taxAmount: number;
}

export interface Dish {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  isAvailable?: boolean;
  description?: string;
  isRecommended?: boolean;
  partnerId?: string;
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
  fileSize?: string;
  dimensions?: string;
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
  minStock: number;
  category: string;
  lastRestocked: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  isActive: boolean;
  iconType: string;
  instructions?: string;
}
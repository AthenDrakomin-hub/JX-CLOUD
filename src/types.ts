
export enum UserRole {
  ADMIN = 'admin',      
  STAFF = 'staff',
  PARTNER = 'partner', 
  MAINTAINER = 'maintainer' 
}

export enum RoomStatus {
  READY = 'ready',
  ORDERING = 'ordering'
}

export interface HotelRoom {
  id: string;
  status: RoomStatus | string;
}

export type AppModule = 
  | 'dashboard' | 'rooms' | 'orders' | 'supply_chain' | 'financial_hub' 
  | 'images' | 'users' | 'settings' | 'menu' | 'finance' | 'partners' | 'inventory' | 'payments'
  | 'merchant_portal';

export interface CRUDPermissions {
  enabled: boolean; 
  c: boolean; r: boolean; u: boolean; d: boolean; 
}

export interface User {
  id: string;
  email: string; 
  username: string;
  password?: string; 
  role: UserRole;
  name: string; 
  modulePermissions?: Partial<Record<AppModule, CRUDPermissions>>;
  isOnline?: boolean;         
  ipWhitelist?: string[];
  isEnvLocked?: boolean;
  partnerId?: string;
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

export interface Order {
  id: string;
  roomId: string;
  customerId?: string; // 新增：客户 ID
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentProof?: string; 
  cash_received?: number;
  cash_change?: number;
  createdAt: string;
  updatedAt: string;
  taxAmount?: number;
}

export enum PaymentMethod {
  CASH_PHP = 'cash_php',
  GCASH = 'gcash',
  PAYPAL = 'paypal',
  ALIPAY = 'alipay',
  WECHAT_PAY = 'wechat_pay',
  USDT_TRC20 = 'usdt_trc20'
}

export interface Dish {
  id: string;
  name: string;
  name_en: string;
  description?: string;
  tags?: string[];
  price: number;
  category: string; 
  stock: number;
  image_url: string;
  is_available: boolean;
  is_recommended?: boolean;
  partnerId?: string;
}

export interface Partner {
  id: string;
  name: string;
  ownerName: string;
  status: 'active' | 'suspended';
  commissionRate: number;
  balance: number;
  contact: string;
  email: string;
  authorizedCategories: string[]; 
  totalSales: number;
  joinedAt: string;
  userId?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

export interface Category {
  id: string; 
  name: string;
  name_en: string;
  code: string;
  level: number;
  display_order: number;
  is_active: boolean;
  parent_id?: string | null;
  // Added missing property partnerId
  partnerId?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  category?: string;
  last_restocked?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  name_en: string;
  currency: string;
  currency_symbol: string;
  exchange_rate: number;
  isActive: boolean;
  payment_type: string;
  sort_order: number;
  description: string;
  description_en: string;
  iconType: string;
  wallet_address?: string;
  qr_url?: string;
}

export interface MaterialImage {
  id: string;
  url: string;
  name: string;
  category: string;
  createdAt: string;
}

// Added missing SystemConfig interface for global application state
export interface SystemConfig {
  hotelName: string;
  version: string;
  theme: 'light' | 'dark';
  autoPrintOrder: boolean;
  ticketStyle: 'standard' | 'minimal' | 'elegant';
  ticketHeader: string;
  ticketFooter: string;
  showTicketQR: boolean;
  fontFamily: string;
}

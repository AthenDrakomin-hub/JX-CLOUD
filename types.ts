
export enum UserRole {
  ADMIN = 'admin',      // 系统管理员 (唯一)
  MANAGER = 'manager',  // 总经理
  STAFF = 'staff'       // 员工
}

export enum RoomStatus {
  READY = 'ready',
  ORDERING = 'ordering'
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
  GRABPAY = 'GrabPay',
  CARD = 'Credit/Debit Card',
  SIGN_BILL = 'Room Charge',
  CASH = 'Cash'
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  isActive: boolean;
  instructions?: string;
  iconType: 'smartphone' | 'wallet' | 'banknote' | 'credit-card';
}

export type PermissionKey = 
  | 'manage_menu'      
  | 'view_finance'     
  | 'process_orders'   
  | 'manage_staff'     
  | 'system_config'    
  | 'material_assets'; 

export interface User {
  id: string;
  username: string;
  password?: string; 
  role: UserRole;
  name: string;
  lastLogin?: string;
  permissions: PermissionKey[];
  isLocked?: boolean;
  ipWhitelist?: string[];
  twoFactorEnabled?: boolean; 
  mfaSecret?: string;         
  isOnline?: boolean;         // 新增：在线状态追踪
}

export interface Dish {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  isRecommended?: boolean;
  isAvailable?: boolean;
  calories?: number;
  allergens?: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  category: string;
  lastRestocked?: string;
}

export interface MaterialImage {
  id: string;
  url: string;
  name: string;
  category: string;
  fileSize?: string;
  dimensions?: string;
  mimeType?: string;
}

export interface HotelRoom {
  id: string;
  status?: RoomStatus;
  activeSessionId?: string;
}

export interface OrderItem {
  dishId: string;
  name: string;
  quantity: number;
  price: number;
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
  estimatedTime?: number;
  taxAmount: number;
  serviceCharge?: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface SecurityLog {
  id: string;
  userId: string;
  action: string;
  details?: string;
  timestamp: string;
  ip: string;
  location?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

export interface SystemConfig {
  hotelName: string;
  version: string;
  serviceChargeRate: number; 
  exchangeRateCNY: number;   
  exchangeRateUSDT: number;  
  webhookUrl?: string;        // 新增：Webhook 推送地址
  isWebhookEnabled?: boolean; // 新增：是否启用推送
}

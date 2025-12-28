
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
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

// 细化权限类型
export type PermissionKey = 
  | 'manage_menu'      // 菜单管理
  | 'view_finance'     // 财务查看
  | 'process_orders'   // 订单处理
  | 'manage_staff'     // 人员管理
  | 'system_config'    // 系统配置
  | 'material_assets'; // 素材资产

export interface User {
  id: string;
  username: string;
  password?: string; // 生产环境仅用于模拟修改逻辑
  role: UserRole;
  name: string;
  lastLogin?: string;
  permissions: PermissionKey[];
  isLocked?: boolean;
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
  pointsEarned: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  taxAmount: number;
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
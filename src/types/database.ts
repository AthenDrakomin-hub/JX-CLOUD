// 数据库表接口定义 - 用于前端类型安全
// 注意：这些是纯类型定义，不包含任何数据库实现细节

export interface SystemConfigTable {
  id: string;
  hotelName: string;
  theme: string;
  autoPrintOrder: boolean;
  ticketStyle: string;
  fontFamily: string;
}

export interface MenuDishTable {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  tags?: string[];
  price: number;
  category: string;
  stock?: number;
  imageUrl?: string;
  isAvailable: boolean;
  isRecommended: boolean;
  partnerId?: string;
}

export interface OrderTable {
  id: string;
  roomNumber: string;
  items: any[]; // JSON array
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: string;
  partnerId?: string;
}

export interface MenuCategoryTable {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  level: number;
  displayOrder: number;
  isActive: boolean;
  parentId?: string;
  partnerId?: string;
}

export interface PartnerTable {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UsersTable {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  role: string;
  name: string;
  modulePermissions?: any; // JSON object
  isOnline?: boolean;
  ipWhitelist?: string[];
  isEnvLocked?: boolean;
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodTable {
  id: string;
  name: string;
  code: string;
  isEnabled: boolean;
  config?: any; // JSON object
  displayOrder: number;
  partnerId?: string;
}

export interface IngredientTable {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  cost: number;
  supplier?: string;
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseTable {
  id: string;
  type: string;
  amount: number;
  description?: string;
  date: Date;
  category: string;
  partnerId?: string;
  createdAt: Date;
}

export interface RoomTable {
  id: string;
  roomNumber: string;
  status: string;
  currentOrderId?: string;
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
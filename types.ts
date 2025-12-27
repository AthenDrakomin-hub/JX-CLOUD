
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

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  lastLogin?: string;
  permissions?: string[];
}

export interface Dish {
  id: string;
  name: string;
  nameEn?: string;
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
  paymentMethod: PaymentMethod;
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
  timestamp: string;
  ip: string;
  location?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

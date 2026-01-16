
import { pgTable, text, numeric, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// 角色枚举
export const roleEnum = pgEnum('user_role', ['admin', 'staff', 'partner', 'user']);

// 1. Better-auth 核心表
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  role: text('role').default('user'), 
  partnerId: text('partner_id'), 
  modulePermissions: jsonb('module_permissions'), // 存储模块级 CRUD 权限
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id),
});

// 2. 酒店业务表
export const systemConfig = pgTable('system_config', {
  id: text('id').primaryKey().default('global'),
  hotelName: text('hotel_name').default('江西云厨酒店'),
  version: text('version').default('8.8.0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  currency: text('currency').default('PHP'),
  currencySymbol: text('currency_symbol').default('₱'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  isActive: boolean('is_active').default(true),
  paymentType: text('payment_type'), 
  sortOrder: integer('sort_order').default(0),
  description: text('description'), 
  descriptionEn: text('description_en'), 
  iconType: text('icon_type'), 
  walletAddress: text('wallet_address'),
  qrUrl: text('qr_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const menuCategories = pgTable('menu_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  code: text('code'),
  level: integer('level').default(1),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  parentId: text('parent_id'),
  partnerId: text('partner_id'), // 物理隔离核心：分类所属合伙人
  createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  status: text('status').default('ready'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const menuDishes = pgTable('menu_dishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  description: text('description'),
  tags: text('tags').array(),
  price: numeric('price').notNull(),
  category: text('category'),
  stock: integer('stock').default(99),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  isRecommended: boolean('is_recommended').default(false),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull(),
  customerId: text('customer_id'), 
  items: jsonb('items').default('[]'),
  totalAmount: numeric('total_amount').default('0'),
  status: text('status').default('pending'),
  paymentMethod: text('payment_method'),
  paymentProof: text('payment_proof'),
  cashReceived: numeric('cash_received'),
  cashChange: numeric('cash_change'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerName: text('owner_name'),
  status: text('status').default('active'),
  commissionRate: numeric('commission_rate').default('0.15'),
  balance: numeric('balance').default('0'),
  authorized_categories: text('authorized_categories').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ingredients = pgTable('ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit'),
  stock: numeric('stock').default('0'),
  minStock: numeric('min_stock').default('10'),
  category: text('category'),
  lastRestocked: timestamp('last_restocked').defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  amount: numeric('amount').notNull().default('0'),
  category: text('category'),
  description: text('description'),
  date: timestamp('date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

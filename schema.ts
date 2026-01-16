
import { pgTable, text, numeric, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// 角色枚举
export const roleEnum = pgEnum('user_role', ['admin', 'staff', 'partner', 'user']);

// 1. Better-auth 核心表 (与 Better Auth 标准字段对齐)
// Internal tables for Better Auth (遵循 Better Auth 标准字段)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false), // Better Auth 标准字段名
  image: text('image'),
  role: text('role').default('user'), 
  partnerId: text('partner_id'), 
  modulePermissions: jsonb('module_permissions'), // 存储模块级 CRUD 权限
  createdAt: timestamp('created_at').notNull().defaultNow(), // Better Auth 标准字段名
  updatedAt: timestamp('updated_at').notNull().defaultNow(), // Better Auth 标准字段名
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id), // Better Auth 标准字段名
  expiresAt: timestamp('expires_at').notNull(), // Better Auth 标准字段名
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'), // Better Auth 标准字段名
  userAgent: text('user_agent'), // Better Auth 标准字段名
  createdAt: timestamp('created_at').notNull().defaultNow(), // Better Auth 标准字段名
  updatedAt: timestamp('updated_at').notNull().defaultNow(), // Better Auth 标准字段名
});

// 2. 业务用户表 (用于应用特定逻辑)
// 与 api.ts 中使用的 'users' 表对应
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(), // 业务所需字段
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').default('user'), 
  partnerId: text('partner_id'), 
  modulePermissions: jsonb('module_permissions'), // 存储模块级 CRUD 权限
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
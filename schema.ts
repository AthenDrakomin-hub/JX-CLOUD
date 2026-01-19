
import { pgTable, text, numeric, timestamp, integer, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

/**
 * 1. 认证表 (Physical Audit Table)
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'),
  partnerId: text('partner_id'), // 物理隔离核心字段
  modulePermissions: jsonb('module_permissions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 2. 业务用户表 (Business Registry)
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'), 
  partnerId: text('partner_id'), 
  modulePermissions: jsonb('module_permissions'), 
  authType: text('auth_type').default('credentials'),
  emailVerified: boolean('email_verified').default(false),
  isActive: boolean('is_active').default(true),
  isPasskeyBound: boolean('is_passkey_bound').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 3. 核心业务表 (Core Operations)
 */
export const menuDishes = pgTable('menu_dishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'), // 镜像对齐 name_en
  description: text('description'),
  tags: text('tags').array(),
  price: numeric('price').notNull(), // DB存 numeric(10,2)
  categoryId: text('category_id'), // 镜像对齐 category_id
  stock: integer('stock').default(99),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  isRecommended: boolean('is_recommended').default(false),
  partnerId: text('partner_id'), // RLS 物理锚点
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  tableId: text('table_id').notNull(), // 镜像对齐 table_id
  customerId: text('customer_id'),
  items: jsonb('items').default('[]'),
  totalAmount: numeric('total_amount').default('0'), // 镜像对齐 total_amount
  status: text('status').default('pending'),
  paymentMethod: text('payment_method'),
  paymentProof: text('payment_proof'),
  cashReceived: numeric('cash_received'),
  cashChange: numeric('cash_change'),
  isPrinted: boolean('is_printed').default(false),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerName: text('owner_name'),
  contact: text('contact'),
  email: text('email'),
  status: text('status').default('active'),
  commissionRate: numeric('commission_rate').default('0.15'),
  balance: numeric('balance').default('0'),
  authorizedCategories: text('authorized_categories').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  id: text('id').primaryKey().default('global'),
  hotelName: text('hotel_name').default('江西云厨酒店'),
  version: text('version').default('8.8.0'),
  theme: text('theme').default('light'),
  autoPrintOrder: boolean('auto_print_order').default(true),
  ticketStyle: text('ticket_style').default('standard'),
  fontFamily: text('font_family').default('Plus Jakarta Sans'),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  partnerId: text('partner_id'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  currency: text('currency').default('PHP'),
  currencySymbol: text('currency_symbol').default('₱'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  isActive: boolean('is_active').default(true),
  paymentType: text('payment_type').default('digital'),
  sortOrder: integer('sort_order').default(0),
  description: text('description'),
  descriptionEn: text('description_en'),
  iconType: text('icon_type'),
  walletAddress: text('wallet_address'),
  qrUrl: text('qr_url'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

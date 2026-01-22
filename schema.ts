
import { pgTable, text, numeric, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

/**
 * 1. 认证核心表 (Better-Auth Required)
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'),
  partnerId: text('partner_id'), 
  modulePermissions: jsonb('module_permissions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const passkey = pgTable('passkeys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').notNull().default(0),
  deviceType: text('device_type').notNull(),
  transports: jsonb('transports'),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * 2. 业务用户与配置 (Business Logic)
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email'), // nullable in actual DB
  name: text('name'),
  role: text('role').default('staff'), 
  partnerId: text('partner_id'), 
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  allowedIps: text('allowed_ips').array().default('{}'),
  authType: text('auth_type').default('id-only'),
  isActive: boolean('is_active').default(true),
  displayName: text('display_name'),
  lastLogin: timestamp('last_login'),
  modulePermissions: jsonb('module_permissions'), 
  emailVerified: boolean('email_verified').default(false),
  isPasskeyBound: boolean('is_passkey_bound').default(false),
});

export const menuDishes = pgTable('menu_dishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'), 
  price: numeric('price').notNull(), 
  category: text('category'), // Maps to category (not category_id)
  stock: integer('stock').default(99),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  isRecommended: boolean('is_recommended').default(false),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey().defaultFunc(() => `'ORD-' || floor(random()*1000000)`),
  roomId: text('room_id').notNull(),
  items: jsonb('items').default('[]'),
  totalAmount: numeric('total_amount').default('0'),
  status: text('status').default('pending'),
  paymentMethod: text('payment_method').notNull(),
  paymentProof: text('payment_proof'),
  cashReceived: numeric('cash_received'),
  cashChange: numeric('cash_change'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  partnerId: text('partner_id'),
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
  walletAddress: text('wallet_address'),
  qrUrl: text('qr_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  id: text('id').primaryKey().default('global'),
  hotelName: text('hotel_name').default('江西云厨酒店'),
  version: text('version').default('8.8.0'),
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
  createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  status: text('status').default('ready'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ingredients = pgTable('ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit'),
  stock: numeric('stock').default('0'),
  minStock: numeric('min_stock').default('10'),
  category: text('category'),
  lastRestocked: timestamp('last_restocked').defaultNow(),
  partnerId: text('partner_id'),
});

export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerName: text('owner_name'),
  status: text('status').default('active'),
  commissionRate: numeric('commission_rate').default('0.15'),
  balance: numeric('balance').default('0'),
  contact: text('contact'),
  email: text('email'),
  authorizedCategories: text('authorized_categories').array(),
  totalSales: numeric('total_sales').default('0'),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  amount: numeric('amount').notNull().default('0'),
  category: text('category'),
  description: text('description'),
  date: timestamp('date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  partnerId: text('partner_id'),
});

export const translations = pgTable('translations', {
  id: text('id').defaultRandom(),
  key: text('key').notNull(),
  language: text('language').notNull(),
  value: text('value').notNull(),
  namespace: text('namespace').default('common'),
  context: jsonb('context'),
  version: integer('version').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
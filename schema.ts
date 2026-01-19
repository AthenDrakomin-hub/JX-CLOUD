
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

export const passkey = pgTable('passkey', {
  id: text('id').primaryKey(),
  name: text('name'),
  publicKey: text('public_key').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  counter: integer('counter').notNull().default(0),
  deviceType: text('device_type').notNull(),
  backedUp: boolean('backed_up').notNull().default(false),
  transports: text('transports'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * 2. 业务用户与配置 (Business Logic)
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

export const menuDishes = pgTable('menu_dishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'), 
  description: text('description'),
  tags: text('tags').array(),
  price: numeric('price').notNull(), 
  categoryId: text('category_id'), 
  stock: integer('stock').default(99),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  isRecommended: boolean('is_recommended').default(false),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  tableId: text('table_id').notNull(),
  customerId: text('customer_id'),
  items: jsonb('items').default('[]'),
  totalAmount: numeric('total_amount').default('0'),
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

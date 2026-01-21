import { pgTable, text, numeric, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

/**
 * 认证核心表 (与数据库列名严格对齐)
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),            
// DB has unique on email
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'),
  partnerId: text('partner_id'),                      
// matches DB partner_id
  modulePermissions: jsonb('module_permissions'),
  createdAt: timestamp('createdAt').notNull().defaultNow(), 
// DB uses createdAt (camelCase)
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt'),                  
// DB may allow nullable; kept nullable to match DB
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), 
// DB uses userId (camelCase)
});
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),            
// DB uses camelCase column accountId
  providerId: text('providerId').notNull(),          
// DB uses providerId
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});
export const passkeys = pgTable('passkeys', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  credentialId: text('credentialId').notNull().unique(),
  publicKey: text('publicKey').notNull(),
  counter: integer('counter').notNull().default(0),
  deviceType: text('deviceType').notNull(),
  transports: jsonb('transports'),
  lastUsedAt: timestamp('lastUsedAt'),
  expiresAt: timestamp('expiresAt'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});
/**
 * 业务用户与配置（与 public.users 表对齐）
 */

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email'),                              
// DB allows nullable; keep nullable to match DB
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'),
  partnerId: text('partner_id'),
  modulePermissions: jsonb('module_permissions'),
  authType: text('auth_type').default('credentials'),
  emailVerified: boolean('email_verified').default(false),
  isActive: boolean('is_active').default(true),
  isPasskeyBound: boolean('is_passkey_bound').default(false),
  allowedIps: text('allowed_ips').array(),           
// DB has cidr[]; map to text[] in frontend
  displayName: text('display_name'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
/**
 * menu_dishes (与数据库列严格对齐)
 */

export const menuDishes = pgTable('menu_dishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  price: numeric('price').notNull(),
  category: text('category'),                        
// DB column is `category` (not category_id)
  stock: integer('stock').default(99),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  isRecommended: boolean('is_recommended').default(false),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow(),
  
// DB does not have description/tags by default — omitted to match DB
});
/**
 * orders (与数据库列严格对齐)
 */

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull(),                 
// DB uses room_id
  items: jsonb('items').default('[]'),
  totalAmount: numeric('total_amount').default('0'),
  status: text('status').default('pending'),
  paymentMethod: text('payment_method'),
  paymentProof: text('payment_proof'),
  cashReceived: numeric('cash_received'),
  cashChange: numeric('cash_change'),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
// DB does not have customer_id or is_printed by default — omitted to match DB
});
/**
 * payment_methods (对齐 DB)
 */

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
  
// DB does not have description/description_en/icon_type/updated_at by default — omitted
});
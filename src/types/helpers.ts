// types/helpers.ts
// 类型转换助手函数

import { 
  User, Partner, Dish, Order, Category, PaymentMethodConfig, 
  SystemConfig, Ingredient 
} from '../types';

// 创建同时具有snake_case和camelCase属性的对象
export function createUser(data: Partial<User>): User {
  return {
    // snake_case properties (required by DB)
    id: data.id || '',
    username: data.username,
    email: data.email,
    name: data.name || '',
    role: data.role || 'staff',
    partner_id: data.partner_id || data.partnerId,
    module_permissions: data.module_permissions || data.modulePermissions,
    auth_type: data.auth_type || data.authType,
    email_verified: data.email_verified || data.emailVerified,
    is_active: data.is_active || data.isActive,
    is_passkey_bound: data.is_passkey_bound || data.isPasskeyBound,
    allowed_ips: data.allowed_ips || data.allowedIps,
    display_name: data.display_name || data.displayName,
    last_login: data.last_login || data.lastLogin,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
    
    // camelCase properties (for frontend compatibility)
    partnerId: data.partner_id || data.partnerId,
    modulePermissions: data.module_permissions || data.modulePermissions,
    authType: data.auth_type || data.authType,
    emailVerified: data.email_verified || data.emailVerified,
    isActive: data.is_active || data.isActive,
    isPasskeyBound: data.is_passkey_bound || data.isPasskeyBound,
    allowedIps: data.allowed_ips || data.allowedIps,
    displayName: data.display_name || data.displayName,
    lastLogin: data.last_login || data.lastLogin,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  } as User;
}

export function createPartner(data: Partial<Partner>): Partner {
  return {
    // snake_case properties
    id: data.id || '',
    name: data.name || '',
    owner_name: data.owner_name || data.ownerName || '',
    contact: data.contact,
    email: data.email,
    status: data.status || 'active',
    commission_rate: data.commission_rate !== undefined ? data.commission_rate : (data.commissionRate || 0),
    balance: data.balance || 0,
    authorized_categories: data.authorized_categories || data.authorizedCategories || [],
    total_sales: data.total_sales || data.totalSales,
    joined_at: data.joined_at || data.joinedAt,
    
    // camelCase properties
    ownerName: data.owner_name || data.ownerName || '',
    commissionRate: data.commission_rate !== undefined ? data.commission_rate : (data.commissionRate || 0),
    authorizedCategories: data.authorized_categories || data.authorizedCategories || [],
    totalSales: data.total_sales || data.totalSales,
    joinedAt: data.joined_at || data.joinedAt,
  } as Partner;
}

export function createDish(data: Partial<Dish>): Dish {
  return {
    // snake_case properties
    id: data.id || '',
    name: data.name || '',
    name_en: data.name_en || data.nameEn,
    price: data.price || 0,
    category: data.category,
    stock: data.stock || 0,
    image_url: data.image_url || data.imageUrl,
    is_available: data.is_available !== undefined ? data.is_available : (data.isAvailable !== undefined ? data.isAvailable : true),
    is_recommended: data.is_recommended !== undefined ? data.is_recommended : (data.isRecommended !== undefined ? data.isRecommended : false),
    partner_id: data.partner_id || data.partnerId,
    created_at: data.created_at || data.createdAt,
    
    // camelCase properties
    nameEn: data.name_en || data.nameEn,
    imageUrl: data.image_url || data.imageUrl,
    isAvailable: data.is_available !== undefined ? data.is_available : (data.isAvailable !== undefined ? data.isAvailable : true),
    isRecommended: data.is_recommended !== undefined ? data.is_recommended : (data.isRecommended !== undefined ? data.isRecommended : false),
    partnerId: data.partner_id || data.partnerId,
    createdAt: data.created_at || data.createdAt,
  } as Dish;
}

export function createOrder(data: Partial<Order>): Order {
  return {
    // snake_case properties
    id: data.id || '',
    room_id: data.room_id || data.roomId || '',
    items: data.items || [],
    total_amount: data.total_amount !== undefined ? data.total_amount : (data.totalAmount || 0),
    status: data.status || 'pending',
    payment_method: data.payment_method || data.paymentMethod,
    payment_proof: data.payment_proof || data.paymentProof,
    cash_received: data.cash_received !== undefined ? data.cash_received : data.cashReceived,
    cash_change: data.cash_change !== undefined ? data.cash_change : data.cashChange,
    partner_id: data.partner_id || data.partnerId,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
    
    // camelCase properties
    roomId: data.room_id || data.roomId || '',
    totalAmount: data.total_amount !== undefined ? data.total_amount : (data.totalAmount || 0),
    paymentMethod: data.payment_method || data.paymentMethod,
    paymentProof: data.payment_proof || data.paymentProof,
    cashReceived: data.cash_received !== undefined ? data.cash_received : data.cashReceived,
    cashChange: data.cash_change !== undefined ? data.cash_change : data.cashChange,
    partnerId: data.partner_id || data.partnerId,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  } as Order;
}

export function createCategory(data: Partial<Category>): Category {
  return {
    // snake_case properties
    id: data.id || '',
    name: data.name || '',
    name_en: data.name_en || data.nameEn || '',
    code: data.code || '',
    level: data.level || 1,
    display_order: data.display_order !== undefined ? data.display_order : (data.displayOrder || 0),
    is_active: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
    parent_id: data.parent_id || data.parentId,
    partner_id: data.partner_id || data.partnerId,
    
    // camelCase properties
    nameEn: data.name_en || data.nameEn || '',
    displayOrder: data.display_order !== undefined ? data.display_order : (data.displayOrder || 0),
    isActive: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
    parentId: data.parent_id || data.parentId,
    partnerId: data.partner_id || data.partnerId,
  } as Category;
}

export function createPaymentMethod(data: Partial<PaymentMethodConfig>): PaymentMethodConfig {
  return {
    // snake_case properties
    id: data.id || '',
    name: data.name || '',
    name_en: data.name_en || data.nameEn,
    currency: data.currency || 'PHP',
    currency_symbol: data.currency_symbol || data.currencySymbol || '₱',
    exchange_rate: data.exchange_rate !== undefined ? data.exchange_rate : (data.exchangeRate || 1.0),
    is_active: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
    payment_type: data.payment_type || data.paymentType || 'digital',
    sort_order: data.sort_order !== undefined ? data.sort_order : (data.sortOrder || 0),
    wallet_address: data.wallet_address || data.walletAddress,
    qr_url: data.qr_url || data.qrUrl,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    
    // camelCase properties
    nameEn: data.name_en || data.nameEn,
    currencySymbol: data.currency_symbol || data.currencySymbol || '₱',
    exchangeRate: data.exchange_rate !== undefined ? data.exchange_rate : (data.exchangeRate || 1.0),
    isActive: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true),
    paymentType: data.payment_type || data.paymentType || 'digital',
    sortOrder: data.sort_order !== undefined ? data.sort_order : (data.sortOrder || 0),
    walletAddress: data.wallet_address || data.walletAddress,
    qrUrl: data.qr_url || data.qrUrl,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  } as PaymentMethodConfig;
}

export function createSystemConfig(data: Partial<SystemConfig>): SystemConfig {
  return {
    // snake_case properties
    hotel_name: data.hotel_name || data.hotelName || '江西云厨',
    version: data.version || '1.0.0',
    theme: data.theme || 'light',
    auto_print_order: data.auto_print_order !== undefined ? data.auto_print_order : (data.autoPrintOrder !== undefined ? data.autoPrintOrder : false),
    ticket_style: data.ticket_style || data.ticketStyle || 'standard',
    font_family: data.font_family || data.fontFamily || 'Arial',
    
    // camelCase properties
    hotelName: data.hotel_name || data.hotelName || '江西云厨',
    autoPrintOrder: data.auto_print_order !== undefined ? data.auto_print_order : (data.autoPrintOrder !== undefined ? data.autoPrintOrder : false),
    ticketStyle: data.ticket_style || data.ticketStyle || 'standard',
    fontFamily: data.font_family || data.fontFamily || 'Arial',
  } as SystemConfig;
}

export function createIngredient(data: Partial<Ingredient>): Ingredient {
  return {
    // snake_case properties
    id: data.id || '',
    name: data.name || '',
    unit: data.unit || '',
    stock: data.stock || 0,
    min_stock: data.min_stock !== undefined ? data.min_stock : (data.minStock || 0),
    category: data.category || '',
    last_restocked: data.last_restocked || data.lastRestocked,
    
    // camelCase properties
    minStock: data.min_stock !== undefined ? data.min_stock : (data.minStock || 0),
    lastRestocked: data.last_restocked || data.lastRestocked,
  } as Ingredient;
}
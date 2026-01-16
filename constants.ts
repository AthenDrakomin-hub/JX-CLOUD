
import { RoomStatus, Dish, User, UserRole, CRUDPermissions, AppModule, Partner, Category, PaymentMethodConfig } from './types';
import { dishesData } from './api/init-dishes';

export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
  'VIP-666', 'VIP-888', 'VIP-000'
];

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { 
    id: 'cash_php', name: '现金支付', name_en: 'Cash Payment', currency: 'PHP', currency_symbol: '₱', 
    exchange_rate: 1.0, isActive: true, payment_type: 'cash', sort_order: 1, 
    description: '到店现金支付 (比索)，支持自动找零感应', description_en: 'Cash payment in PHP', iconType: 'banknote' 
  },
  { 
    id: 'gcash', name: 'GCash', name_en: 'GCash', currency: 'PHP', currency_symbol: '₱', 
    exchange_rate: 1.0, isActive: true, payment_type: 'digital', sort_order: 2, 
    description: '菲律宾本地钱包支付，需上传凭证', description_en: 'Pay via GCash, upload screenshot', 
    iconType: 'wallet', qr_url: 'https://placehold.co/400x400/blue/white?text=GCash+QR', wallet_address: '0912-345-6789'
  },
  { 
    id: 'paypal', name: 'PayPal', name_en: 'PayPal', currency: 'USD', currency_symbol: '$', 
    exchange_rate: 0.018, isActive: true, payment_type: 'digital', sort_order: 3, 
    description: '国际 PayPal 转账', description_en: 'PayPal International Transfer', 
    iconType: 'credit-card', wallet_address: 'payment@jxcloud.com'
  },
  { 
    id: 'alipay', name: '支付宝', name_en: 'Alipay', currency: 'CNY', currency_symbol: '¥', 
    exchange_rate: 0.12, isActive: true, payment_type: 'digital', sort_order: 4, 
    description: '中国支付宝扫码支付', description_en: 'Scan to pay via Alipay', 
    iconType: 'smartphone', qr_url: 'https://placehold.co/400x400/blue/white?text=Alipay+QR'
  },
  { 
    id: 'wechat_pay', name: '微信支付', name_en: 'WeChat Pay', currency: 'CNY', currency_symbol: '¥', 
    exchange_rate: 0.12, isActive: true, payment_type: 'digital', sort_order: 5, 
    description: '中国微信扫码支付', description_en: 'Scan to pay via WeChat', 
    iconType: 'smartphone', qr_url: 'https://placehold.co/400x400/green/white?text=WeChat+QR'
  },
  { 
    id: 'usdt_trc20', name: 'USDT (TRC20)', name_en: 'USDT-TRC20', currency: 'USDT', currency_symbol: '₮', 
    exchange_rate: 0.017, isActive: true, payment_type: 'digital', sort_order: 6, 
    description: '加密货币转账，需输入 TxID 或上传截图', description_en: 'Crypto transfer via TRC20', 
    iconType: 'coins', wallet_address: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  }
];

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'p-001',
    name: '锦江海鲜档口',
    ownerName: '张大勇',
    status: 'active',
    commissionRate: 0.15,
    balance: 0,
    contact: '0917-888-9999',
    email: 'seafood@jx.com',
    authorizedCategories: ['004'],
    totalSales: 0,
    joinedAt: new Date().toISOString()
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: '001', name: '主食套餐类', name_en: 'Main Course Sets', parent_id: null, level: 1, display_order: 1, is_active: true, code: 'MAIN_COURSE' },
  { id: '101', name: '扒饭系列', name_en: 'Grill Series', parent_id: '001', level: 2, display_order: 1, is_active: true, code: 'GRILL' },
  { id: '002', name: '中式精品', name_en: 'Chinese Special', parent_id: null, level: 1, display_order: 2, is_active: true, code: 'CHINESE' },
  { id: '004', name: '海鲜水产', name_en: 'Seafood', parent_id: null, level: 1, display_order: 4, is_active: true, code: 'SEAFOOD' },
  { id: '006', name: '高端洋酒', name_en: 'Premium Spirits', parent_id: null, level: 1, display_order: 6, is_active: true, code: 'SPIRITS' },
  { id: '601', name: '马爹利系列', name_en: 'Martell Series', parent_id: '006', level: 2, display_order: 1, is_active: true, code: 'MARTELL' },
  { id: '602', name: '轩尼诗系列', name_en: 'Hennessy Series', parent_id: '006', level: 2, display_order: 2, is_active: true, code: 'HENNESSY' },
  { id: '603', name: '麦卡伦系列', name_en: 'Macallan Series', parent_id: '006', level: 2, display_order: 3, is_active: true, code: 'MACALLAN' },
  { id: '009', name: '软饮料', name_en: 'Beverages', parent_id: null, level: 1, display_order: 9, is_active: true, code: 'BEVERAGES' },
  { id: '901', name: '罐装汽水', name_en: 'Sodas', parent_id: '009', level: 2, display_order: 1, is_active: true, code: 'SODA' }
];

export const INITIAL_DISHES: Dish[] = dishesData;

export const INITIAL_USERS: User[] = [
  { id: 'admin-root', username: 'AthenDrakomin', email: 'athendrakomin@proton.me', role: UserRole.ADMIN, name: '系统总监', isOnline: false, isEnvLocked: true }
];

export const COLORS = { primary: '#2563eb', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b' };

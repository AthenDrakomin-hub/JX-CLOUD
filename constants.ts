
import { RoomStatus, Dish, User, UserRole, CRUDPermissions, AppModule, Partner, Category, PaymentMethodConfig } from './types';
import { dishesData } from './api/init-dishes';

export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
  'VIP-666', 'VIP-888', 'VIP-000'
];

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { 
    // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
    id: 'cash_php', name: '现金支付', nameEn: 'Cash Payment', currency: 'PHP', currencySymbol: '₱', 
    exchangeRate: 1.0, isActive: true, paymentType: 'cash', sortOrder: 1, 
    description: '到店现金支付 (比索)，支持自动找零感应', descriptionEn: 'Cash payment in PHP', iconType: 'banknote' 
  },
  { 
    // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
    id: 'gcash', name: 'GCash', nameEn: 'GCash', currency: 'PHP', currencySymbol: '₱', 
    exchangeRate: 1.0, isActive: true, paymentType: 'digital', sortOrder: 2, 
    description: '菲律宾本地钱包支付，需上传凭证', descriptionEn: 'Pay via GCash, upload screenshot', 
    iconType: 'wallet', qrUrl: 'https://placehold.co/400x400/blue/white?text=GCash+QR', walletAddress: '0912-345-6789'
  },
  { 
    // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
    id: 'paypal', name: 'PayPal', nameEn: 'PayPal', currency: 'USD', currencySymbol: '$', 
    exchangeRate: 0.018, isActive: true, paymentType: 'digital', sortOrder: 3, 
    description: '国际 PayPal 转账', descriptionEn: 'PayPal International Transfer', 
    iconType: 'credit-card', walletAddress: 'payment@jxcloud.com'
  },
  { 
    // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
    id: 'alipay', name: '支付宝', nameEn: 'Alipay', currency: 'CNY', currencySymbol: '¥', 
    exchangeRate: 0.12, isActive: true, paymentType: 'digital', sortOrder: 4, 
    description: '中国支付宝扫码支付', descriptionEn: 'Scan to pay via Alipay', 
    iconType: 'smartphone', qrUrl: 'https://placehold.co/400x400/blue/white?text=Alipay+QR'
  },
  { 
    // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
    id: 'wechat_pay', name: '微信支付', nameEn: 'WeChat Pay', currency: 'CNY', currencySymbol: '¥', 
    exchangeRate: 0.12, isActive: true, paymentType: 'digital', sortOrder: 5, 
    description: '中国微信扫码支付', descriptionEn: 'Scan to pay via WeChat', 
    iconType: 'smartphone', qrUrl: 'https://placehold.co/400x400/green/white?text=WeChat+QR'
  },
  { 
    // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
    id: 'usdt_trc20', name: 'USDT (TRC20)', nameEn: 'USDT-TRC20', currency: 'USDT', currencySymbol: '₮', 
    exchangeRate: 0.017, isActive: true, paymentType: 'digital', sortOrder: 6, 
    description: '加密货币转账，需输入 TxID 或上传截图', descriptionEn: 'Crypto transfer via TRC20', 
    iconType: 'coins', walletAddress: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
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
  // Fix: Updated snake_case properties to camelCase to match Category interface
  { id: '001', name: '主食套餐类', nameEn: 'Main Course Sets', parentId: null, level: 1, displayOrder: 1, isActive: true, code: 'MAIN_COURSE' },
  { id: '101', name: '扒饭系列', nameEn: 'Grill Series', parentId: '001', level: 2, displayOrder: 1, isActive: true, code: 'GRILL' },
  { id: '002', name: '中式精品', nameEn: 'Chinese Special', parentId: null, level: 1, displayOrder: 2, isActive: true, code: 'CHINESE' },
  { id: '004', name: '海鲜水产', nameEn: 'Seafood', parentId: null, level: 1, displayOrder: 4, isActive: true, code: 'SEAFOOD' },
  { id: '006', name: '高端洋酒', nameEn: 'Premium Spirits', parentId: null, level: 1, displayOrder: 6, isActive: true, code: 'SPIRITS' },
  { id: '601', name: '马爹利系列', nameEn: 'Martell Series', parentId: '006', level: 2, displayOrder: 1, isActive: true, code: 'MARTELL' },
  { id: '602', name: '轩尼诗系列', nameEn: 'Hennessy Series', parentId: '006', level: 2, displayOrder: 2, isActive: true, code: 'HENNESSY' },
  { id: '603', name: '麦卡伦系列', nameEn: 'Macallan Series', parentId: '006', level: 2, displayOrder: 3, isActive: true, code: 'MACALLAN' },
  { id: '009', name: '软饮料', nameEn: 'Beverages', parentId: null, level: 1, displayOrder: 9, isActive: true, code: 'BEVERAGES' },
  { id: '901', name: '罐装汽水', nameEn: 'Sodas', parentId: '009', level: 2, displayOrder: 1, isActive: true, code: 'SODA' }
];

export const INITIAL_DISHES: Dish[] = dishesData;

// Fix: Removed 'isOnline' and 'isEnvLocked' property from the initial user object as they are not defined in the 'User' interface.
export const INITIAL_USERS: User[] = [
  { id: 'admin-root', email: 'athendrakomin@proton.me', role: UserRole.ADMIN, name: '系统总监' }
];

export const COLORS = { primary: '#2563eb', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b' };

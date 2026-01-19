
import { RoomStatus, Dish, User, UserRole, CRUDPermissions, AppModule, Partner, Category, PaymentMethodConfig } from '../types';

/**
 * 江西云厨 - 核心资产档案 (Dishes Registry v10.5)
 * 包含：扒饭系列、中式精品、高端洋酒、海鲜水产及软饮
 */
const dishesData: Dish[] = [
  // --- 101: 扒饭系列 ---
  // Fix: Changed 'category' to 'categoryId' and 'name_en' to 'nameEn' in all dish objects to match Dish interface
  { id: 'D101', name: '黑椒猪扒饭', nameEn: 'Black Pepper Pork Chop Rice', categoryId: '101', price: 150, stock: 50, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800', isRecommended: true, description: '选用上等里脊肉，搭配特调黑椒汁。', tags: ['热卖', '招牌'] },
  { id: 'D102', name: '香烤牛扒饭', nameEn: 'Grilled Steak Rice', categoryId: '101', price: 280, stock: 30, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', description: '严选谷饲牛肉，高温碳烤锁住肉汁。', tags: ['精品'] },
  { id: 'D103', name: '泰式鸡腿饭', nameEn: 'Thai Chicken Leg Rice', categoryId: '101', price: 180, stock: 45, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?q=80&w=800', description: '泰式秘制腌料，酸辣适中。', tags: ['异域'] },
  { id: 'D105', name: '日式咖喱饭', nameEn: 'Japanese Curry Rice', categoryId: '101', price: 190, stock: 60, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1582576163090-6c91a6ed3d21?q=80&w=800', description: '日式温润咖喱，土豆胡萝卜入口即化。' },

  // --- 002: 中式精品 (映射至 002 或具体子类) ---
  { id: 'D201', name: '红烧肉套餐', nameEn: 'Braised Pork Set', categoryId: '002', price: 220, stock: 20, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=800', isRecommended: true, description: '经典本帮风味，软糯不油腻。', tags: ['中式'] },
  { id: 'D202', name: '麻婆豆腐饭', nameEn: 'Mapo Tofu Rice', categoryId: '002', price: 120, stock: 100, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=800', description: '麻辣鲜香，传统川味。' },
  { id: 'D203', name: '宫保鸡丁饭', nameEn: 'Kung Pao Chicken Rice', categoryId: '002', price: 160, stock: 80, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=800', description: '精选鸡腿肉，搭配香脆花生米。' },

  // --- 602: 轩尼诗系列 ---
  { id: 'W601', name: '轩尼诗 VSOP (700ml)', nameEn: 'Hennessy VSOP', categoryId: '602', price: 4200, stock: 12, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800', description: '干邑界的标杆，果香浓郁，余味悠长。', tags: ['名酒', '商务'] },
  { id: 'W602', name: '轩尼诗 XO', nameEn: 'Hennessy XO', categoryId: '602', price: 9800, stock: 5, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1569701881643-46385d30d2f3?q=80&w=800', description: '顶级干邑，口感深邃复杂。', tags: ['顶奢'] },

  // --- 601: 马爹利系列 ---
  { id: 'W611', name: '马爹利名仕', nameEn: 'Martell Noblige', categoryId: '601', price: 3800, stock: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1594411132791-7667c453f663?q=80&w=800', description: '口感圆润顺滑，带优雅芬芳。' },
  { id: 'W612', name: '马爹利蓝带', nameEn: 'Martell Cordon Bleu', categoryId: '601', price: 8500, stock: 4, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527281405159-35d5b5aa7c1d?q=80&w=800', tags: ['经典'] },

  // --- 603: 麦卡伦系列 ---
  { id: 'W631', name: '麦卡伦 12年 (雪莉桶)', nameEn: 'Macallan 12Y Sherry Oak', categoryId: '603', price: 6500, stock: 8, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1527281405159-35d5b5aa7c1d?q=80&w=800', description: '带有浓郁的蜜饯与干果香气。' },

  // --- 901: 罐装汽水 ---
  { id: 'B901', name: '可口可乐 (330ml)', nameEn: 'Coca Cola', categoryId: '901', price: 35, stock: 500, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800', tags: ['气泡'] },
  { id: 'B902', name: '雪碧 (330ml)', nameEn: 'Sprite', categoryId: '901', price: 35, stock: 500, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1625772290748-390939a20011?q=80&w=800' },
  { id: 'B903', name: '王老吉', nameEn: 'Wong Lo Kat', categoryId: '901', price: 45, stock: 200, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=800', description: '正宗凉茶，清热去火。' },

  // --- 004: 海鲜水产 ---
  { id: 'S401', name: '清蒸大龙虾', nameEn: 'Steamed Lobster', categoryId: '004', price: 1200, stock: 15, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1559700018-9d14fd5a99ce?q=80&w=800', isRecommended: true, description: '鲜活龙虾，原汁原味。' },
  { id: 'S402', name: '香辣大闸蟹', nameEn: 'Spicy Hairy Crab', categoryId: '004', price: 800, stock: 20, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1590759021051-0202d46947a7?q=80&w=800' }
];

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
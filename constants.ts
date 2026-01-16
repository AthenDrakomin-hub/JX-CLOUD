
import { RoomStatus, Dish, User, UserRole, CRUDPermissions, AppModule, Partner, Category, PaymentMethodConfig } from './types';

/**
 * 江西云厨 - 核心资产档案 (Dishes Registry v10.5)
 * 包含：扒饭系列、中式精品、高端洋酒、海鲜水产及软饮
 */
export const dishesData: Dish[] = [
  // --- 101: 扒饭系列 ---
  { id: 'D101', name: '黑椒猪扒饭', name_en: 'Black Pepper Pork Chop Rice', category: '101', price: 150, stock: 50, is_available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800', is_recommended: true, description: '选用上等里脊肉，搭配特调黑椒汁。', tags: ['热卖', '招牌'] },
  { id: 'D102', name: '香烤牛扒饭', name_en: 'Grilled Steak Rice', category: '101', price: 280, stock: 30, is_available: true, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', description: '严选谷饲牛肉，高温碳烤锁住肉汁。', tags: ['精品'] },
  { id: 'D103', name: '泰式鸡腿饭', name_en: 'Thai Chicken Leg Rice', category: '101', price: 180, stock: 45, is_available: true, image_url: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?q=80&w=800', description: '泰式秘制腌料，酸辣适中。', tags: ['异域'] },
  { id: 'D105', name: '日式咖喱饭', name_en: 'Japanese Curry Rice', category: '101', price: 190, stock: 60, is_available: true, image_url: 'https://images.unsplash.com/photo-1582576163090-6c91a6ed3d21?q=80&w=800', description: '日式温润咖喱，土豆胡萝卜入口即化。' },

  // --- 002: 中式精品 (映射至 002 或具体子类) ---
  { id: 'D201', name: '红烧肉套餐', name_en: 'Braised Pork Set', category: '002', price: 220, stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=800', is_recommended: true, description: '经典本帮风味，软糯不油腻。', tags: ['中式'] },
  { id: 'D202', name: '麻婆豆腐饭', name_en: 'Mapo Tofu Rice', category: '002', price: 120, stock: 100, is_available: true, image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=800', description: '麻辣鲜香，传统川味。' },
  { id: 'D203', name: '宫保鸡丁饭', name_en: 'Kung Pao Chicken Rice', category: '002', price: 160, stock: 80, is_available: true, image_url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=800', description: '精选鸡腿肉，搭配香脆花生米。' },

  // --- 602: 轩尼诗系列 ---
  { id: 'W601', name: '轩尼诗 VSOP (700ml)', name_en: 'Hennessy VSOP', category: '602', price: 4200, stock: 12, is_available: true, image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800', description: '干邑界的标杆，果香浓郁，余味悠长。', tags: ['名酒', '商务'] },
  { id: 'W602', name: '轩尼诗 XO', name_en: 'Hennessy XO', category: '602', price: 9800, stock: 5, is_available: true, image_url: 'https://images.unsplash.com/photo-1569701881643-46385d30d2f3?q=80&w=800', description: '顶级干邑，口感深邃复杂。', tags: ['顶奢'] },

  // --- 601: 马爹利系列 ---
  { id: 'W611', name: '马爹利名仕', name_en: 'Martell Noblige', category: '601', price: 3800, stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1594411132791-7667c453f663?q=80&w=800', description: '口感圆润顺滑，带优雅芬芳。' },
  { id: 'W612', name: '马爹利蓝带', name_en: 'Martell Cordon Bleu', category: '601', price: 8500, stock: 4, is_available: true, image_url: 'https://images.unsplash.com/photo-1527281405159-35d5b5aa7c1d?q=80&w=800', tags: ['经典'] },

  // --- 603: 麦卡伦系列 ---
  { id: 'W631', name: '麦卡伦 12年 (雪莉桶)', name_en: 'Macallan 12Y Sherry Oak', category: '603', price: 6500, stock: 8, is_available: true, image_url: 'https://images.unsplash.com/photo-1527281405159-35d5b5aa7c1d?q=80&w=800', description: '带有浓郁的蜜饯与干果香气。' },

  // --- 901: 罐装汽水 ---
  { id: 'B901', name: '可口可乐 (330ml)', name_en: 'Coca Cola', category: '901', price: 35, stock: 500, is_available: true, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800', tags: ['气泡'] },
  { id: 'B902', name: '雪碧 (330ml)', name_en: 'Sprite', category: '901', price: 35, stock: 500, is_available: true, image_url: 'https://images.unsplash.com/photo-1625772290748-390939a20011?q=80&w=800' },
  { id: 'B903', name: '王老吉', name_en: 'Wong Lo Kat', category: '901', price: 45, stock: 200, is_available: true, image_url: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=800', description: '正宗凉茶，清热去火。' },

  // --- 004: 海鲜水产 ---
  { id: 'S401', name: '清蒸大龙虾', name_en: 'Steamed Lobster', category: '004', price: 1200, stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1559700018-9d14fd5a99ce?q=80&w=800', is_recommended: true, description: '鲜活龙虾，原汁原味。' },
  { id: 'S402', name: '香辣大闸蟹', name_en: 'Spicy Hairy Crab', category: '004', price: 800, stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1590759021051-0202d46947a7?q=80&w=800' }
];

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
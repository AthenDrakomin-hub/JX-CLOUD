
import { Dish } from '../types';

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

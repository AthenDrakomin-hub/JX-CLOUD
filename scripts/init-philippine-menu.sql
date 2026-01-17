-- 插入菲律宾特色菜品数据
-- 用于扫码点餐功能验证

-- 先确保分类存在
INSERT INTO menu_categories (id, name, name_en, code, level, display_order, is_active, created_at)
VALUES 
  ('cat-main-dish', '主食', 'Main Dishes', 'MAIN', 1, 1, true, NOW()),
  ('cat-drinks', '饮品', 'Drinks', 'DRINKS', 1, 2, true, NOW()),
  ('cat-dessert', '甜品', 'Desserts', 'DESSERT', 1, 3, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入菲律宾经典菜品
INSERT INTO menu_dishes (id, name, name_en, description, price, category_id, stock, is_available, is_recommended, created_at)
VALUES 
  ('dish-adobo', '阿斗波鸡肉', 'Chicken Adobo', '菲律宾国菜，用醋、酱油、大蒜和月桂叶慢炖的嫩滑鸡肉', 180, 'cat-main-dish', 50, true, true, NOW()),
  ('dish-sinigang', '酸汤猪肉', 'Sinigang na Baboy', '酸爽开胃的传统汤品，以罗望子调味，配蔬菜和猪肉', 220, 'cat-main-dish', 30, true, true, NOW()),
  ('dish-halo-halo', '混混冰', 'Halo-Halo', '菲律宾经典刨冰甜品，混合红豆、椰果、冰淇淋和炼乳', 120, 'cat-dessert', 100, true, false, NOW()),
  ('dish-coke', '可口可乐', 'Coca-Cola', '经典碳酸饮料', 65, 'cat-drinks', 200, true, false, NOW()),
  ('dish-milktea', '珍珠奶茶', 'Milk Tea with Pearl', '香浓奶茶配Q弹珍珠', 95, 'cat-drinks', 80, true, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入一些测试餐桌数据
INSERT INTO rooms (id, status, updated_at)
VALUES 
  ('table-01', 'ready', NOW()),
  ('table-02', 'ready', NOW()),
  ('table-03', 'ready', NOW()),
  ('table-04', 'ordering', NOW()),
  ('table-05', 'ready', NOW())
ON CONFLICT (id) DO NOTHING;

-- 验证数据插入
SELECT 'Categories:' as section;
SELECT id, name, name_en FROM menu_categories WHERE is_active = true;

SELECT 'Dishes:' as section;
SELECT d.id, d.name, d.name_en, d.price, c.name as category 
FROM menu_dishes d 
JOIN menu_categories c ON d.category_id = c.id 
WHERE d.is_available = true;

SELECT 'Tables:' as section;
SELECT id, status FROM rooms LIMIT 5;
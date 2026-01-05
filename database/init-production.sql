-- 江西云厨终端系统 - 生产环境数据库初始化脚本

-- 创建初始系统配置（如果不存在）
INSERT INTO system_config (id, hotel_name, version, theme, printer_ip, printer_port, service_charge_rate) 
VALUES ('global', '江西云厨', '5.2.0', 'light', '192.168.1.100', '9100', 0.05)
ON CONFLICT (id) DO UPDATE SET
  hotel_name = EXCLUDED.hotel_name,
  version = EXCLUDED.version,
  theme = EXCLUDED.theme,
  printer_ip = EXCLUDED.printer_ip,
  printer_port = EXCLUDED.printer_port,
  service_charge_rate = EXCLUDED.service_charge_rate;

-- 设置默认支付方式（如果不存在）
INSERT INTO payments (name, type, is_active, icon_type, instructions) 
VALUES 
  ('现金', 'Cash', true, 'credit-card', '接受现金支付'),
  ('支付宝', 'Alipay', true, 'credit-card', '扫描二维码支付'),
  ('微信支付', 'Wechat', true, 'credit-card', '扫描二维码支付')
ON CONFLICT (name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  icon_type = EXCLUDED.icon_type,
  instructions = EXCLUDED.instructions;

-- 创建默认品类（如果不存在）
INSERT INTO categories (name, display_order) 
VALUES 
  ('招牌菜品', 1),
  ('汤品', 2),
  ('主食', 3),
  ('饮品', 4),
  ('特色菜', 5)
ON CONFLICT (name) DO NOTHING;

-- 为现有房间设置初始状态（如果不存在）
INSERT INTO rooms (id, status, created_at)
SELECT id, 'ready', NOW()
FROM (
  SELECT unnest(ARRAY[
    '8201', '8202', '8203', '8204', '8205', '8206', '8207', '8208',
    '8209', '8210', '8211', '8212', '8213', '8214', '8215', '8216',
    '8217', '8218', '8219', '8220', '8221', '8222', '8223', '8224',
    '8225', '8226', '8227', '8228', '8229', '8230', '8231', '8232',
    '8301', '8302', '8303', '8304', '8305', '8306', '8307', '8308',
    '8309', '8310', '8311', '8312', '8313', '8314', '8315', '8316',
    '8317', '8318', '8319', '8320', '8321', '8322', '8323', '8324',
    '8325', '8326', '8327', '8328', '8329', '8330', '8331', '8332',
    'VIP-666', 'VIP-888', 'VIP-000'
  ]) as id
) room_ids
ON CONFLICT (id) DO NOTHING;

-- 提示：初始管理员用户应通过 Supabase 仪表板创建，而不是在此脚本中硬编码
-- 管理员用户示例（请在 Supabase 仪表板中创建）：
-- {
--   "email": "admin@hotel.com",
--   "password": "SecurePassword123!",
--   "user_metadata": {
--     "full_name": "系统管理员",
--     "role": "admin"
--   }
-- }
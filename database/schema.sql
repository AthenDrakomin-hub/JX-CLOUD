-- 江西云厨终端系统 - 数据库表结构定义 (V5.2 生产闭环版)

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 支付网关配置表
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'GCash', 'Maya', 'Cash', 'Alipay', 'Wechat'
  is_active BOOLEAN DEFAULT TRUE,
  icon_type TEXT DEFAULT 'credit-card',
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 品类架构表
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  parent_id BIGINT REFERENCES categories(id),
  level INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 食材/物料库存表
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock DECIMAL(12,2) DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 10,
  category TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 系统全局配置表
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  hotel_name TEXT DEFAULT '江西云厨',
  version TEXT DEFAULT '5.2.0',
  theme TEXT DEFAULT 'light',
  font_family TEXT DEFAULT 'Plus Jakarta Sans',
  font_size_base INTEGER DEFAULT 16,
  font_weight_base INTEGER DEFAULT 500,
  line_height_base DECIMAL(3,2) DEFAULT 1.5,
  letter_spacing DECIMAL(4,2) DEFAULT 0,
  contrast_strict BOOLEAN DEFAULT TRUE,
  text_color_main TEXT DEFAULT '#0f172a',
  bg_color_main TEXT DEFAULT '#f8fafc',
  printer_ip TEXT DEFAULT '192.168.1.100',
  printer_port TEXT DEFAULT '9100',
  auto_print_order BOOLEAN DEFAULT TRUE,
  auto_print_receipt BOOLEAN DEFAULT TRUE,
  voice_broadcast_enabled BOOLEAN DEFAULT TRUE,
  voice_volume DECIMAL(3,2) DEFAULT 0.8,
  service_charge_rate DECIMAL(4,3) DEFAULT 0.05,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 酒店房间表
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY, -- 房号，如 '8201', 'VIP-666'
  status TEXT DEFAULT 'ready', -- 'ready', 'occupied', 'maintenance', 'cleaning'
  guest_name TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  items JSONB NOT NULL, -- [{dish_id, name, quantity, price}]
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'
  payment_method TEXT DEFAULT 'Cash', -- 'Cash', 'Alipay', 'Wechat', 'Card'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- 7. 菜品表
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  price DECIMAL(8,2) NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT -1, -- -1 表示无限库存
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  partner_id UUID REFERENCES users(id), -- 关联合作伙伴
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 用户表 (根据您的要求更新)
CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NULL,
  avatar_url TEXT NULL,
  metadata JSONB NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  auth_id UUID NULL,
  role TEXT NULL DEFAULT 'viewer'::TEXT,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- 为用户表创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users USING btree (auth_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users USING btree (id) TABLESPACE pg_default;

-- 9. 支出费用表
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  paid_by TEXT,
  receipt_url TEXT,
  partner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 材料图片库表
CREATE TABLE IF NOT EXISTS material_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  file_size INTEGER, -- 文件大小（字节）
  dimensions TEXT, -- 尺寸，如 "1920x1080"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 合作伙伴/商户表
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  commission_rate DECIMAL(5,4) DEFAULT 0.0000, -- 佣金率
  balance DECIMAL(12,2) DEFAULT 0, -- 余额
  total_sales DECIMAL(12,2) DEFAULT 0, -- 总销售额
  authorized_categories TEXT[], -- 授权品类
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  contact TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 支付方式配置表
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Cash', 'Alipay', 'Wechat', 'Card', etc.
  is_active BOOLEAN DEFAULT TRUE,
  icon_type TEXT DEFAULT 'credit-card',
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新updated_at的表添加触发器
DROP TRIGGER IF EXISTS set_updated_at_on_payment_configs ON payment_configs;
CREATE TRIGGER set_updated_at_on_payment_configs
    BEFORE UPDATE ON payment_configs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_ingredients ON ingredients;
CREATE TRIGGER set_updated_at_on_ingredients
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_rooms ON rooms;
CREATE TRIGGER set_updated_at_on_rooms
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_orders ON orders;
CREATE TRIGGER set_updated_at_on_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_dishes ON dishes;
CREATE TRIGGER set_updated_at_on_dishes
    BEFORE UPDATE ON dishes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_expenses ON expenses;
CREATE TRIGGER set_updated_at_on_expenses
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_material_images ON material_images;
CREATE TRIGGER set_updated_at_on_material_images
    BEFORE UPDATE ON material_images
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_partners ON partners;
CREATE TRIGGER set_updated_at_on_partners
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_payments ON payments;
CREATE TRIGGER set_updated_at_on_payments
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_users ON users;
CREATE TRIGGER set_updated_at_on_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_system_config ON system_config;
CREATE TRIGGER set_updated_at_on_system_config
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- 为用户表添加触发器，确保更新时间自动更新
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
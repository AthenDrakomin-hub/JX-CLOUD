
# JX CLOUD (江西云厨) - 生产环境数据库架构 (V3.2)

请在 Supabase SQL Editor 中运行以下脚本以完成初始化。

```sql
-- ==========================================
-- 1. 扩展与基础设置
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. 系统配置表 (Config)
-- ==========================================
CREATE TABLE config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  hotel_name TEXT NOT NULL DEFAULT '江西云厨',
  version TEXT DEFAULT '3.2.0-STABLE',
  service_charge_rate DECIMAL(5,2) DEFAULT 5,
  exchange_rate_cny DECIMAL(10,4) DEFAULT 7.8,
  exchange_rate_usdt DECIMAL(10,4) DEFAULT 56.5,
  webhook_url TEXT,
  is_webhook_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. 用户与安全中心 (Users & Auth)
-- ==========================================
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin',
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  permissions JSONB DEFAULT '[]',
  ip_whitelist TEXT[] DEFAULT '{}',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. 房间与桌位 (Rooms)
-- ==========================================
CREATE TABLE rooms (
  id TEXT PRIMARY KEY, -- 房间号如 8201
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'ordering')),
  active_session_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. 菜单与视觉资产 (Menu & Assets)
-- ==========================================
CREATE TABLE dishes (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT FALSE,
  calories INTEGER,
  allergens TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_images (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  file_size TEXT,
  dimensions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. 原料与库存管理 (Inventory)
-- ==========================================
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 0,
  category TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. 订单与支付 (Orders & Payments)
-- ==========================================
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || upper(substr(md5(random()::text), 1, 8))),
  room_id TEXT REFERENCES rooms(id),
  items JSONB NOT NULL, -- 存储 [{dishId, name, quantity, price}]
  total_amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  service_charge INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivering', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  icon_type TEXT,
  instructions TEXT
);

-- ==========================================
-- 8. 财务收支 (Finance)
-- ==========================================
CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE
);

-- ==========================================
-- 9. 安全审计日志 (Audit Logs)
-- ==========================================
CREATE TABLE security_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip TEXT,
  risk_level TEXT DEFAULT 'Low',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 10. 性能优化索引 (Indexing)
-- ==========================================
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_dishes_available ON dishes (is_available) WHERE is_available = TRUE;
CREATE INDEX idx_ingredients_low_stock ON ingredients (stock) WHERE stock <= min_stock;
CREATE INDEX idx_security_logs_timestamp ON security_logs (timestamp DESC);

-- ==========================================
-- 11. 行级安全策略 (RLS)
-- ==========================================

-- 启用 RLS
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 策略：访客权限 (Public)
CREATE POLICY "Public: View Menu" ON dishes FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public: View Room Status" ON rooms FOR SELECT USING (TRUE);
CREATE POLICY "Public: Create Orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public: View Active Payments" ON payments FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public: View Config" ON config FOR SELECT USING (TRUE);

-- 策略：员工权限 (Staff/Manager/Admin)
-- 注意：生产环境应通过 auth.uid() 校验。此处为逻辑演示。
CREATE POLICY "Staff: Manage Orders" ON orders FOR ALL USING (TRUE);
CREATE POLICY "Manager: Full Inventory Access" ON ingredients FOR ALL USING (TRUE);
CREATE POLICY "Admin: Total Control" ON users FOR ALL USING (TRUE);
CREATE POLICY "Admin: Config Control" ON config FOR ALL USING (TRUE);
CREATE POLICY "System: Log Recording" ON security_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin: View Logs" ON security_logs FOR SELECT USING (TRUE);

-- ==========================================
-- 12. 初始数据植入
-- ==========================================

-- 初始管理员 (admin / admin)
INSERT INTO users (username, password, name, role, permissions, two_factor_enabled)
VALUES ('admin', 'admin', 'ROOT·系统主理人', 'admin', '["manage_menu", "view_finance", "process_orders", "manage_staff", "system_config", "material_assets"]', FALSE)
ON CONFLICT (username) DO NOTHING;

-- 初始配置
INSERT INTO config (id, hotel_name) VALUES ('global', '江西云厨·旗舰店') ON CONFLICT (id) DO NOTHING;

-- 初始支付方式
INSERT INTO payments (id, name, type, icon_type, instructions) VALUES 
('p1', 'GCash', 'GCash', 'smartphone', '请扫描柜台二维码并向服务员出示成功界面。'),
('p2', '现金支付', 'Cash', 'banknote', '请在房内等待，服务员送餐时将收取现金。'),
('p3', 'USDT 结算', 'GrabPay', 'wallet', '汇率实时计算，请联系前台获取临时充值地址。')
ON CONFLICT (id) DO NOTHING;

-- 自动生成 64 个房间 (8201-8232, 8301-8332)
DO $$
BEGIN
    FOR i IN 1..32 LOOP
        INSERT INTO rooms (id, status) VALUES (CAST(8200 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
        INSERT INTO rooms (id, status) VALUES (CAST(8300 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
```
---
**江西云厨系统研发部 &copy; 2025**

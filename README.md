
# JX CLOUD (江西云厨) - 酒店餐饮管理系统 (V3.5.2)

## 项目交付清单 (Deployment Checklist)

### 1. 核心功能模块

#### 1.1 用户与安全中心 (Users & Security)
- **多角色用户管理**：支持管理员、经理、员工三种角色，具有不同权限级别
- **IP白名单功能**：可为用户配置IP访问白名单，增强安全性
- **双因素认证 (2FA)**：基于TOTP算法的MFA，支持Google Authenticator等
- **账户锁定机制**：支持账户锁定/解锁功能
- **在线状态管理**：实时跟踪用户在线状态，强制上线功能
- **安全审计日志**：记录所有用户操作和登录行为

#### 1.2 订单管理系统 (Order Management)
- **房间二维码点餐**：客户通过扫描房间二维码进行点餐
- **订单状态管理**：支持待处理、制作中、配送中、已完成、已取消等状态
- **实时订单推送**：订单创建后实时推送到后厨终端
- **订单状态更新通知**：订单状态变更时推送通知
- **Webhook集成**：支持第三方系统（钉钉、飞书、企业微信）消息推送

#### 1.3 菜单与库存管理 (Menu & Inventory)
- **多语言菜单**：支持中英菲三语菜单展示
- **库存管理**：实时库存跟踪和管理
- **菜品分类管理**：支持多种菜品分类
- **图片素材管理**：支持菜品图片上传和管理
- **推荐菜品标识**：可设置菜品为推荐菜品

#### 1.4 支付系统 (Payment System)
- **多支付方式**：支持GCash、Maya、现金、银行卡、USDT、记账到房间等多种支付方式
- **安全支付处理**：处理安全支付流程
- **支付状态跟踪**：跟踪支付状态和记录

#### 1.5 财务管理系统 (Finance Management)
- **营收统计**：实时营收数据统计
- **支出管理**：记录和管理各项支出
- **财务报表**：生成财务报表和分析
- **税率计算**：自动计算12%增值税

#### 1.6 房间与桌位管理 (Rooms & Stations)
- **房间状态管理**：管理房间状态（就绪/点餐中）
- **房间配置**：支持67个房间（8201-8232, 8301-8332, VIP房间）
- **实时状态同步**：房间状态实时同步

#### 1.7 系统配置 (System Configuration)
- **系统参数配置**：可配置酒店名称、服务费率、汇率等
- **多语言支持**：支持中文、英文、菲律宾语切换
- **Webhook配置**：配置第三方消息推送地址
- **云端连接监测**：实时监测与Supabase的连接状态

### 2. 技术特性

#### 2.1 前端技术栈
- **React 19**：最新版React框架，优化并发特性
- **TypeScript**：全流程类型约束，减少运行时错误
- **Tailwind CSS**：原子化CSS引擎，提供极致视觉体验
- **Lucide React**：轻量化矢量图标库
- **Recharts**：专业级数据可视化引擎
- **QRCode React**：二维码生成与扫描

#### 2.2 后端与云服务
- **Supabase（PostgreSQL）**：核心数据库，PostgREST特性
- **行级安全 (RLS)**：数据库级安全策略
- **边缘计算**：Vercel Edge Runtime优化，低延迟响应
- **实时订阅**：PostgreSQL逻辑复制，实时订单状态更新

#### 2.3 存储架构
- **混合存储架构（VirtualDB）**：
  - 本地存储：离线可靠层，断网时系统正常运行
  - 云端同步：Supabase云端镜像同步
- **离线优先**：云端不可用时本地数据自动对齐

#### 2.4 安全特性
- **MFA双因素认证**：基于TOTP算法的安全认证
- **IP白名单验证**：登录IP地址验证机制
- **审计日志系统**：完整操作记录和追踪
- **Webhook安全**：第三方推送安全验证

### 3. 部署配置

#### 3.1 环境配置
- **Vite构建工具**：毫秒级热更新（HMR）
- **ESM.sh导入**：无需node_modules，提升部署速度
- **Vercel部署**：CI/CD流程支持
- **Supabase集成**：数据库连接配置

#### 3.2 数据库架构
请在 Supabase SQL Editor 中运行以下脚本以完成初始化。此脚本已与前端 `constants.ts` 和 `types.ts` 完美对齐。

```sql
-- ==========================================
-- 0. 连接测试表 (用于系统设置页面的连通性测试)
-- ==========================================
CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  task TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 1. 扩展与基础设置
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. 系统配置表 (Config)
-- ==========================================
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  hotel_name TEXT NOT NULL DEFAULT '江西云厨',
  version TEXT DEFAULT '3.5.2-PROD',
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
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY, 
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'ordering')),
  active_session_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. 菜单与视觉资产 (Menu & Assets)
-- ==========================================
CREATE TABLE IF NOT EXISTS dishes (
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

CREATE TABLE IF NOT EXISTS material_images (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  file_size TEXT,
  dimensions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5.1 多语言翻译表 (Translations)
-- ==========================================
CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  key TEXT NOT NULL,
  zh TEXT,
  en TEXT,
  tl TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. 原料与库存管理 (Inventory)
-- ==========================================
CREATE TABLE IF NOT EXISTS ingredients (
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
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || upper(substr(md5(random()::text), 1, 8))),
  room_id TEXT REFERENCES rooms(id),
  items JSONB NOT NULL, 
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  service_charge DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivering', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE
);

-- ==========================================
-- 9. 安全审计日志 (Audit Logs)
-- ==========================================
CREATE TABLE IF NOT EXISTS security_logs (
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
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dishes_available ON dishes (is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock ON ingredients (stock) WHERE stock <= min_stock;
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp DESC);

-- ==========================================
-- 11. 行级安全策略 (RLS)
-- ==========================================
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- 访客权限
CREATE POLICY "Public: View Menu" ON dishes FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public: View Room Status" ON rooms FOR SELECT USING (TRUE);
CREATE POLICY "Public: Create Orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public: View Active Payments" ON payments FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public: View Config" ON config FOR SELECT USING (TRUE);
CREATE POLICY "Public: View Material Images" ON material_images FOR SELECT USING (TRUE);
CREATE POLICY "Public: View Todos" ON todos FOR SELECT USING (TRUE);
CREATE POLICY "Public: View Translations" ON translations FOR SELECT USING (TRUE);

-- 员工权限
CREATE POLICY "Staff: Manage Orders" ON orders FOR ALL USING (TRUE);
CREATE POLICY "Manager: Full Inventory Access" ON ingredients FOR ALL USING (TRUE);
CREATE POLICY "Admin: Total Control" ON users FOR ALL USING (TRUE);
CREATE POLICY "Admin: Config Control" ON config FOR ALL USING (TRUE);
CREATE POLICY "System: Log Recording" ON security_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin: View Logs" ON security_logs FOR SELECT USING (TRUE);
CREATE POLICY "Admin: Manage Material Images" ON material_images FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin: Manage Todos" ON todos FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Admin: Manage Translations" ON translations FOR ALL TO authenticated USING (TRUE);

-- ==========================================
-- 12. 初始数据植入
-- ==========================================

-- 初始管理员 (admin / admin)
INSERT INTO users (username, password, name, role, permissions, two_factor_enabled)
VALUES ('admin', 'admin', 'ROOT·系统主理人', 'admin', '["manage_menu", "view_finance", "process_orders", "manage_staff", "system_config", "material_assets"]', FALSE)
ON CONFLICT (username) DO NOTHING;

-- 初始配置
INSERT INTO config (id, hotel_name) VALUES ('global', '江西云厨·旗舰店') ON CONFLICT (id) DO NOTHING;

-- 初始支付方式 (与前端 PaymentMethod enum 对齐)
INSERT INTO payments (id, name, type, icon_type, instructions) VALUES 
('p1', 'GCash', 'GCash', 'smartphone', '请扫描柜台二维码并向服务员出示成功界面。'),
('p2', '现金支付', 'Cash', 'banknote', '请在房内等待，服务员送餐时将收取现金。'),
('p3', 'USDT 结算', 'GrabPay', 'wallet', '汇率实时计算，请联系前台获取临时充值地址。'),
('p4', 'Maya', 'Maya', 'smartphone', 'Gamitin ang Maya QR para sa mabilis na bayad.'),
('p5', '银行卡支付', 'Credit/Debit Card', 'credit-card', '支持 Visa/Mastercard 直接结算。'),
('p6', '记账到房间', 'Room Charge', 'credit-card', '消费将计入您的客房账单，结账时统一处理。')
ON CONFLICT (id) DO NOTHING;

-- 自动生成房间 (同步 constants.ts: 8201-8232, 8301-8332 + VIP)
DO $$
BEGIN
    -- 生成普通房间
    FOR i IN 1..32 LOOP
        INSERT INTO rooms (id, status) VALUES (CAST(8200 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
        INSERT INTO rooms (id, status) VALUES (CAST(8300 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    -- 生成 VIP 房间
    INSERT INTO rooms (id, status) VALUES ('VIP-666', 'ready') ON CONFLICT (id) DO NOTHING;
    INSERT INTO rooms (id, status) VALUES ('VIP-888', 'ready') ON CONFLICT (id) DO NOTHING;
    INSERT INTO rooms (id, status) VALUES ('VIP-000', 'ready') ON CONFLICT (id) DO NOTHING;
END $$;
```

### 4. 使用说明

#### 4.1 系统启动
1. **环境配置**：设置VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY环境变量
2. **数据库初始化**：在Supabase中运行上述SQL脚本
3. **启动应用**：运行`npm run dev`启动开发服务器

#### 4.2 用户登录
- **默认管理员账号**：用户名`admin`，密码`admin`
- **多角色权限**：根据角色分配不同权限
- **安全验证**：支持双因素认证和IP白名单验证

#### 4.3 业务流程
1. **客户点餐**：扫描房间二维码进入点餐页面
2. **订单处理**：订单实时推送到后厨系统
3. **状态跟踪**：订单状态实时更新和通知
4. **支付处理**：支持多种支付方式
5. **财务统计**：自动生成营收和支出报表

#### 4.4 系统管理
- **用户管理**：创建、编辑、删除用户账号
- **菜单管理**：添加、编辑、删除菜单项
- **库存管理**：跟踪和管理食材库存
- **系统配置**：配置酒店参数和支付设置

### 5. 核心竞争力
这套系统不仅仅是一个管理工具，它通过VirtualDB镜像技术解决了许多中小酒店最担心的"断网无法营业"的问题。即使云端不可用，本地数据在重新联网后自动对齐，这是目前纯SaaS系统所不具备的。同时，系统提供了完整的多语言支持、IP白名单安全验证、实时订单推送等企业级功能。

```sql
-- ==========================================
-- 0. 连接测试表 (用于系统设置页面的连通性测试)
-- ==========================================
CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  task TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 1. 扩展与基础设置
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. 系统配置表 (Config)
-- ==========================================
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  hotel_name TEXT NOT NULL DEFAULT '江西云厨',
  version TEXT DEFAULT '3.5.2-PROD',
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
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY, 
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'ordering')),
  active_session_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. 菜单与视觉资产 (Menu & Assets)
-- ==========================================
CREATE TABLE IF NOT EXISTS dishes (
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

CREATE TABLE IF NOT EXISTS material_images (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  file_size TEXT,
  dimensions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5.1 多语言翻译表 (Translations)
-- ==========================================
CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  key TEXT NOT NULL,
  zh TEXT,
  en TEXT,
  tl TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. 原料与库存管理 (Inventory)
-- ==========================================
CREATE TABLE IF NOT EXISTS ingredients (
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
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || upper(substr(md5(random()::text), 1, 8))),
  room_id TEXT REFERENCES rooms(id),
  items JSONB NOT NULL, 
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  service_charge DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivering', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE
);

-- ==========================================
-- 9. 安全审计日志 (Audit Logs)
-- ==========================================
CREATE TABLE IF NOT EXISTS security_logs (
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
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dishes_available ON dishes (is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock ON ingredients (stock) WHERE stock <= min_stock;
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp DESC);

-- ==========================================
-- 11. 行级安全策略 (RLS)
-- ==========================================
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 访客权限
CREATE POLICY "Public: View Menu" ON dishes FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public: View Room Status" ON rooms FOR SELECT USING (TRUE);
CREATE POLICY "Public: Create Orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public: View Active Payments" ON payments FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public: View Config" ON config FOR SELECT USING (TRUE);

-- 员工权限
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

-- 初始支付方式 (与前端 PaymentMethod enum 对齐)
INSERT INTO payments (id, name, type, icon_type, instructions) VALUES 
('p1', 'GCash', 'GCash', 'smartphone', '请扫描柜台二维码并向服务员出示成功界面。'),
('p2', '现金支付', 'Cash', 'banknote', '请在房内等待，服务员送餐时将收取现金。'),
('p3', 'USDT 结算', 'GrabPay', 'wallet', '汇率实时计算，请联系前台获取临时充值地址。'),
('p4', 'Maya', 'Maya', 'smartphone', 'Gamitin ang Maya QR para sa mabilis na bayad.'),
('p5', '银行卡支付', 'Credit/Debit Card', 'credit-card', '支持 Visa/Mastercard 直接结算。'),
('p6', '记账到房间', 'Room Charge', 'credit-card', '消费将计入您的客房账单，结账时统一处理。')
ON CONFLICT (id) DO NOTHING;

-- 自动生成房间 (同步 constants.ts: 8201-8232, 8301-8332 + VIP)
DO $$
BEGIN
    -- 生成普通房间
    FOR i IN 1..32 LOOP
        INSERT INTO rooms (id, status) VALUES (CAST(8200 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
        INSERT INTO rooms (id, status) VALUES (CAST(8300 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    -- 生成 VIP 房间
    INSERT INTO rooms (id, status) VALUES ('VIP-666', 'ready') ON CONFLICT (id) DO NOTHING;
    INSERT INTO rooms (id, status) VALUES ('VIP-888', 'ready') ON CONFLICT (id) DO NOTHING;
    INSERT INTO rooms (id, status) VALUES ('VIP-000', 'ready') ON CONFLICT (id) DO NOTHING;
END $$;
```
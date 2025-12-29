
# JX CLOUD (江西云厨) - 酒店餐饮管理系统 (V3.5.2)

## 技术栈

### 1. 前端技术栈（Frontend Stack）
- **React 19（最新版）**：采用React的最新版本，利用严格模式并改进了并发特性，确保UI响应如丝般顺滑。
- **TypeScript**：全流程强约束类型，从API返回值到UI组件状态，最大限度减少运行时错误。
- **Tailwind CSS**：采用原子化CSS引擎，配合系统内置的"金流（Gold）+曜石（Obsidian）"终极方案，实现极致的视觉美感。
- **Lucide React**：现代化的轻量化矢量图标库，提供系统内所有的动态视觉元素。
- **Recharts**：专业级数据可视化引擎，用于构建经营大盘、负载分析和财务配比图表。
- **QRCode React**：二维码生成库

### 2. 存储架构（Storage Architecture）
- **混合存储架构（VirtualDB）**：
  - 本地存储：作为系统的"离线可靠层"，在云端连接中断时，系统仍能正常运行。
  - Supabase 客户端：负责云端镜像同步。

### 3. 后端与云服务（Backend & Cloud）
- **Supabase（PostgreSQL）**：核心数据库。利用其性能的PostgREST特性，实现接口直接与数据库的安全通信。
- **行级安全 (RLS)**：数据库级别的行级安全策略，确保访客只能点餐，员工只能处理订单，管理员拥有全域权限。
- **边缘计算**：API接口基于Vercel Edge Runtime优化，确保全球范围内极低的响应延迟（通常< 20ms）。
- **实时订阅**：利用PostgreSQL的逻辑复制功能，实现订单状态的实时到后厨终端。

### 4. 安全与集成特性（Security & Integration）
- **MFA（双身份认证）**：基于TOTP算法（支持Google Authenticator/Microsoft Authenticator）的管理员安全系数。
- **审计引擎**：内置安全审计引擎，记录每一笔订单修改和员工登录行为。
- **网络钩子**：支持第三方系统（如钉钉、飞书、企业微信）的消息实时主动推送。

### 5. 开发工具与构建流程
- **Vite**：极速的优先资源工具，实现毫秒级的热更新（HMR）。
- **Supabase SQL 编辑器**：用于执行 DDL 脚本和管理复杂的索引策略。
- **ESM.sh**：采用全ESM导入，不依赖本地庞大的node_modules，显著提升部署和加载速度。
- **Vercel / Edge Gateway**：作为生产环境的部署平台，提供了CI/CD的流程。

## 核心竞争力：
这套系统不仅仅是一个管理工具，它通过VirtualDB镜像技术解决了许多中小酒店最担心的"断网无法营业"的问题。即使云端不可用，本地数据在重新联网后自动对齐，这是目前纯SaaS系统所不具备的。

## 数据库架构

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
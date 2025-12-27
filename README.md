# JX CLOUD (江西云厨) - 企业级酒店管理套件

JX CLOUD 是一款专为现代化酒店、高端餐饮及综合度假村打造的全链路管理系统。基于 **React 19** 与 **Supabase** 云原生架构。

---

## 🚀 生产环境数据库初始化 (Supabase)

请在 Supabase 的 **SQL Editor** 中运行以下脚本。该脚本已包含所有 64 个房间的自动初始化逻辑。

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户/员工表 (集成角色约束，无需单独创建角色表)
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 房间/桌位表 (Rooms)
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'ordering')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 菜品菜单表 (Dishes)
CREATE TABLE dishes (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  name_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 订单流水表 (Orders)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivering', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 运营支出表 (Expenses)
CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE
);

-- 6. 动态翻译表 (Translations)
CREATE TABLE translations (
  key TEXT PRIMARY KEY,
  zh TEXT NOT NULL,
  en TEXT NOT NULL,
  tl TEXT NOT NULL
);

-- 7. 安全审计表 (Security Logs)
CREATE TABLE security_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  ip TEXT,
  risk_level TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 预置基础数据
-- ==========================================

-- 预置 64 个房间 (8201-8232 和 8301-8332)
DO $$
BEGIN
    FOR i IN 1..32 LOOP
        INSERT INTO rooms (id, status) VALUES (CAST(8200 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
        INSERT INTO rooms (id, status) VALUES (CAST(8300 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- 预置初始管理员 (默认密码 admin123 逻辑在前端处理)
INSERT INTO users (username, name, role) 
VALUES ('admin', '系统管理员', 'admin') 
ON CONFLICT (username) DO NOTHING;
```

---

## 🛠 部署注意事项

1. **环境变量**：在 Vercel 部署面板中，必须配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
2. **Realtime 订阅**：请在 Supabase Dashboard 的 **Database -> Replication** 中，确保 `orders` 表已启用 **Realtime** 选项。
3. **依赖冲突 (核心修复)**：本项目使用 React 19。由于部分第三方库（如 `qrcode.react`）尚未更新 Peer Deps，系统已内置 `.npmrc` 文件配置 `legacy-peer-deps=true`。如果手动构建，请确保使用 `npm install --legacy-peer-deps`。

**江西云厨系统研发部 &copy; 2025**

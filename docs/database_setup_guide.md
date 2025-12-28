# 数据库连接设置指南

## 环境变量配置

要连接到Supabase数据库，您需要在 `.env.local` 文件中设置以下环境变量：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key  # 可选，用于AI功能
```

## 获取Supabase凭证

1. 访问 [Supabase](https://supabase.com) 并创建一个新项目
2. 在项目仪表板中，导航到 Settings > Project Settings
3. 复制 "Project URL" 作为 `VITE_SUPABASE_URL`
4. 导航到 Settings > API，复制 "anon public" 密钥作为 `VITE_SUPABASE_ANON_KEY`

## 数据库初始化

在Supabase项目中运行以下SQL脚本来初始化数据库表：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户/员工表 (集成角色约束)
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
  is_recommended BOOLEAN DEFAULT FALSE, -- 推荐标记
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

-- ==========================================
-- ⚡ 数据库索引策略 (Indexing Strategy)
-- ==========================================

-- 优化管理端实时队列查询
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX idx_orders_room ON orders (room_id);

-- 优化访客端菜单渲染与分类过滤
CREATE INDEX idx_dishes_category_available ON dishes (category) WHERE is_available = TRUE;
CREATE INDEX idx_dishes_recommended ON dishes (is_recommended) WHERE is_recommended = TRUE;

-- ==========================================
-- 🔒 行级安全策略 (RLS - Row Level Security)
-- ==========================================

-- 启用 RLS
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 访客权限：只读菜单
CREATE POLICY "Menu is viewable by everyone" ON dishes FOR SELECT USING (is_available = TRUE);

-- 访客权限：只读房间状态
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (TRUE);

-- 访客权限：匿名创建订单
CREATE POLICY "Guests can create orders" ON orders FOR INSERT WITH CHECK (TRUE);

-- 访客权限：仅查看自己的订单 (基于 Session 或 Room ID)
-- 实际场景建议配合加密的 Room ID Token
CREATE POLICY "Guests can view their own room orders" ON orders FOR SELECT USING (room_id = room_id);

-- 管理端全量权限 (基于角色)
-- 注意：需要配合 Supabase Auth 的自定义声明 (Custom Claims)
CREATE POLICY "Admins have full access to everything" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'manager'))
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

-- 预置初始管理员
INSERT INTO users (username, name, role) 
VALUES ('admin', '系统管理员', 'admin') 
ON CONFLICT (username) DO NOTHING;
```

## 实时功能配置

1. 在Supabase仪表板中，导航到 Database > Replication
2. 确保 `orders` 表已启用 **Realtime** 选项

## 运行数据库连接测试

```bash
# 安装tsx以运行TypeScript脚本
npm install -g tsx

# 运行数据库连接测试
tsx test-db-connection.ts
```

## 故障排除

如果遇到连接问题：

1. 确认环境变量已正确设置
2. 检查防火墙或网络设置
3. 确认Supabase项目未超出免费配额
4. 验证RLS策略是否正确配置
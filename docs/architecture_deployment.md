# 技术架构与部署文档

## 系统架构

### 整体架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   前端界面层     │◄──►│   API网关/中间层   │◄──►│   数据存储层     │
│                 │    │                  │    │                 │
│ • React 19     │    │ • Vite构建工具    │    │ • Supabase      │
│ • TypeScript   │    │ • 环境变量管理    │    │ • PostgreSQL    │
│ • Lucide图标    │    │ • 安全审计日志    │    │ • RLS策略       │
│ • 响应式设计    │    │ • 认证授权        │    │ • 实时订阅      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 技术栈
- **前端框架**: React 19
- **构建工具**: Vite 6.x
- **语言**: TypeScript
- **UI组件**: 原生React组件 + Lucide React图标
- **数据可视化**: Recharts
- **数据库**: Supabase (PostgreSQL)
- **实时功能**: Supabase Realtime
- **状态管理**: React Hooks (无Redux/Zustand)

## 开发环境搭建

### 1. 系统要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### 2. 安装依赖
```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd jx-cloud-enterprise-hospitality-suite

# 安装依赖
npm install
```

### 3. 环境配置
创建 `.env.local` 文件并配置以下环境变量：
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. 启动开发服务器
```bash
npm run dev
```

## 生产环境部署

### 1. 构建项目
```bash
npm run build
```

### 2. 部署配置
- 静态文件服务器配置
- 环境变量配置
- 域名绑定

### 3. Vercel部署（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署项目
vercel --prod
```

## 数据库设计

### 表结构

#### 1. users表 - 用户/员工表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. rooms表 - 房间/桌位表
```sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'ordering')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. dishes表 - 菜品菜单表
```sql
CREATE TABLE dishes (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  name_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. orders表 - 订单流水表
```sql
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
```

#### 5. expenses表 - 运营支出表
```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE
);
```

### 数据库索引策略
```sql
-- 优化管理端实时队列查询
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX idx_orders_room ON orders (room_id);

-- 优化访客端菜单渲染与分类过滤
CREATE INDEX idx_dishes_category_available ON dishes (category) WHERE is_available = TRUE;
CREATE INDEX idx_dishes_recommended ON dishes (is_recommended) WHERE is_recommended = TRUE;
```

### 行级安全策略 (RLS)
```sql
-- 启用RLS
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 访客权限策略
CREATE POLICY "Menu is viewable by everyone" ON dishes FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (TRUE);
CREATE POLICY "Guests can create orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Guests can view their own room orders" ON orders FOR SELECT USING (room_id = room_id);

-- 管理端权限策略
CREATE POLICY "Admins have full access to everything" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'manager'))
);
```

## API接口文档

### 1. 用户管理接口
- `api.users.getAll()` - 获取所有用户
- `api.users.update(user)` - 更新用户信息
- `api.users.create(user)` - 创建用户
- `api.users.delete(id)` - 删除用户
- `api.users.resetPassword(userId, newPass)` - 重置密码

### 2. 订单管理接口
- `api.orders.getAll()` - 获取所有订单
- `api.orders.create(order)` - 创建订单
- `api.orders.updateStatus(orderId, status)` - 更新订单状态

### 3. 菜单管理接口
- `api.dishes.getAll()` - 获取所有菜品
- `api.dishes.create(dish)` - 创建菜品
- `api.dishes.update(dish)` - 更新菜品
- `api.dishes.delete(id)` - 删除菜品

### 4. 房间管理接口
- `api.rooms.getAll()` - 获取所有房间
- `api.rooms.update(room)` - 更新房间状态

### 5. 财务管理接口
- `api.expenses.getAll()` - 获取所有支出
- `api.expenses.create(expense)` - 创建支出记录
- `api.expenses.delete(id)` - 删除支出记录

## 安全机制

### 1. 认证授权
- 基于Supabase Auth的用户认证
- 角色基础访问控制(RBAC)
- 环境变量敏感信息隔离

### 2. 数据安全
- 数据库行级安全(RLS)策略
- 自动安全审计日志
- SSL/TLS传输加密

### 3. 防护措施
- CORS策略限制
- 环境变量敏感密钥隔离
- 输入验证和清理

## 部署注意事项

1. **环境变量**: 在Vercel部署面板中，必须配置 `API_KEY` (Gemini) 和 `SUPABASE_URL`。
2. **Realtime 订阅**: 请在Supabase Dashboard的 **Database -> Replication** 中，确保 `orders` 表已启用 **Realtime** 选项。
3. **安全审计**: 系统所有敏感操作都会通过 `logAuditAction` 自动记录在 `security_logs` 表中。
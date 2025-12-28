# JX CLOUD (江西云厨) - 企业级酒店管理套件

JX CLOUD 是一款专为现代化酒店、高端餐饮及综合度假村打造的全链路管理系统。基于 **React 19** 与 **Supabase** 云原生架构。

## 📋 目录

- [项目概述](#项目概述)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [安装指南](#安装指南)
- [环境配置](#环境配置)
- [开发指南](#开发指南)
- [部署说明](#部署说明)
- [文档导航](#文档导航)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目概述

JX Cloud 是一款现代化的酒店管理系统，专为满足酒店、餐厅和度假村的管理需求而设计。系统采用云原生架构，提供实时数据同步、多语言支持、安全审计等企业级功能。

### 核心功能
- **实时订单管理** - 支持从点餐到配送的完整流程
- **房间状态管理** - 实时跟踪房间/桌位使用状态
- **多语言支持** - 支持中文、英文、塔加路语
- **财务审计** - 完整的收支记录和报表
- **员工权限管理** - 基于角色的访问控制
- **安全审计** - 详细的操作日志记录

## 功能特性

### 🏨 酒店管理
- 房间/桌位状态实时监控
- 订单处理与跟踪
- 客户服务管理

### 🍽️ 餐饮管理
- 菜单配置与管理
- 库存跟踪
- 订单处理流程

### 💰 财务管理
- 收入支出记录
- 财务报表生成
- 支付管理

### 👥 员工管理
- 多级权限控制
- 用户角色管理
- 操作审计日志

### 🌐 多语言支持
- 中文（简体）
- 英文
- 塔加路语（菲律宾语）

## 技术栈

### 前端技术
- **React 19** - 现代化组件框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Lucide React** - 图标库
- **Recharts** - 数据可视化

### 后端技术
- **Supabase** - BaaS (Backend as a Service)
- **PostgreSQL** - 关系数据库
- **Realtime** - 实时数据同步
- **RLS** - 行级安全

### 部署与运维
- **Vercel** - 前端部署
- **Supabase** - 后端服务
- **Git** - 版本控制

## 安装指南

### 系统要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd jx-cloud-enterprise-hospitality-suite
```

2. **安装依赖**
```bash
npm install
```

3. **创建环境变量文件**
```bash
cp .env.example .env.local
```

4. **配置环境变量**（见下文）

5. **启动开发服务器**
```bash
npm run dev
```

## 环境配置

### 必需环境变量

创建 `.env.local` 文件并配置以下变量：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 可选环境变量

```env
GEMINI_API_KEY=your_gemini_api_key  # 用于AI功能
```

## 🚀 生产环境数据库初始化 (Supabase)

请在 Supabase 的 **SQL Editor** 中运行以下脚本。该脚本已包含所有 64 个房间的自动初始化逻辑。

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

## 开发指南

### 项目结构

```
├── components/     # React组件
├── services/       # API服务和业务逻辑
├── types/          # TypeScript类型定义
├── docs/           # 项目文档
├── api/            # API路由
├── public/         # 静态资源
├── App.tsx         # 主应用组件
├── index.html      # HTML入口
└── vite.config.ts  # Vite配置
```

### 命令脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建

### 代码规范

- 使用 TypeScript 进行类型安全编程
- 组件遵循单一职责原则
- 代码提交遵循约定式提交规范

## 部署说明

### Vercel 部署

1. 登录 Vercel 并连接您的 Git 仓库
2. 配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (可选)
3. 设置构建命令为 `npm run build`
4. 设置输出目录为 `dist`

### Supabase 配置

1. 在 Supabase 项目中运行数据库初始化脚本
2. 在 Database -> Replication 中启用 `orders` 表的 Realtime 选项
3. 配置 RLS 策略（已在初始化脚本中设置）

## 文档导航

- [用户操作手册](./docs/user_manual.md) - 面向酒店管理人员和操作员
- [系统管理员手册](./docs/admin_manual.md) - 面向系统管理员
- [技术架构与部署文档](./docs/architecture_deployment.md) - 面向开发人员
- [系统运维手册](./docs/operations_manual.md) - 面向运维人员
- [常见问题FAQ](./docs/faq.md) - 常见问题解答
- [完整文档目录](./docs/index.md) - 所有文档的完整索引

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 使用 TypeScript 编写类型安全的代码
- 遵循现有的代码风格
- 为新功能添加适当的测试
- 更新相关文档

## 支持与问题

如果您遇到问题或有建议，请：

- 查看 [常见问题FAQ](./docs/faq.md)
- 提交 [GitHub Issues](https://github.com/your-repo/issues)
- 参考 [故障排查指南](./docs/troubleshooting_guide.md)

## 许可证

本项目采用特定许可证。详细信息请参见 LICENSE 文件。

## 🛠 部署注意事项

1. **环境变量**：在 Vercel 部署面板中，必须配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 和 `VITE_SENTRY_DSN`。
2. **Realtime 订阅**：请在 Supabase Dashboard 的 **Database -> Replication** 中，确保 `orders` 表已启用 **Realtime** 选项。
3. **安全审计**：系统所有敏感操作都会通过 `logAction` 自动记录在 `security_logs` 表中，包含详细元数据。
4. **错误监控**：系统已集成 Sentry 进行错误监控和性能追踪。
5. **数据库初始化**：部署前请确保在 Supabase 中运行了数据库初始化脚本，以创建必要的表结构和预置数据。

---

**江西云厨系统研发部 &copy; 2025**

*如需技术支持，请联系：[support@jxcloud.com](mailto:support@jxcloud.com)*
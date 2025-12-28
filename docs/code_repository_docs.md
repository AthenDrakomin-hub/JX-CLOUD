# 代码仓库文档

## README.md

```markdown
# JX CLOUD (江西云厨) - 企业级酒店管理套件

JX CLOUD 是一款专为现代化酒店、高端餐饮及综合度假村打造的全链路管理系统。基于 **React 19** 与 **Supabase** 云原生架构。

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

## 🛠 部署注意事项

1. **环境变量**：在 Vercel 部署面板中，必须配置 `API_KEY` (Gemini) 和 `SUPABASE_URL`。
2. **Realtime 订阅**：请在 Supabase Dashboard 的 **Database -> Replication** 中，确保 `orders` 表已启用 **Realtime** 选项。
3. **安全审计**：系统所有敏感操作都会通过 `logAuditAction` 自动记录在 `security_logs` 表中。

**江西云厨系统研发部 &copy; 2025**
```

## CONTRIBUTING.md

```markdown
# 贡献指南

感谢您对JX Cloud项目的兴趣！我们欢迎各种形式的贡献。

## 开发环境设置

1. Fork 项目仓库
2. 克隆到本地
3. 安装依赖：`npm install`
4. 创建特性分支：`git checkout -b feature-name`
5. 提交更改：`git commit -m 'Add some feature'`
6. 推送到分支：`git push origin feature-name`
7. 提交Pull Request

## 代码规范

- 使用TypeScript进行类型安全编程
- 遵循React最佳实践
- 组件保持单一职责
- 代码应包含适当注释

## 提交信息规范

请遵循以下格式提交信息：
```
type(scope): description

[optional body]

[optional footer]
```

类型包括：
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

## 报告问题

- 使用问题模板
- 提供复现步骤
- 包含环境信息
- 附上错误截图（如适用）

## 代码审查

所有提交都需要经过审查，审查重点包括：
- 代码质量
- 安全性
- 性能影响
- 文档完整性
```

## CHANGELOG.md

```markdown
# 变更日志

## [v3.1.0] - 2025-01-01

### 新增功能
- 添加多语言支持（中文、英文、塔加路语）
- 实现动态翻译功能
- 增加VIP房间标识
- 添加云端素材库功能

### 改进
- 优化订单处理界面
- 改进响应式设计
- 增强安全审计日志
- 优化数据库查询性能

### 修复
- 修复订单状态同步问题
- 修复房间状态显示问题
- 修复支付模块显示问题

## [v3.0.0] - 2024-12-15

### 新增功能
- 完整的订单管理系统
- 房间/桌位状态管理
- 菜单配置管理
- 财务审计功能
- 员工权限管理
- 支付管理模块

### 改进
- 使用React 19重构
- 集成Supabase数据库
- 实现实时数据同步
- 添加安全审计机制

## [v2.0.0] - 2024-06-01

### 新增功能
- 初步的酒店管理系统
- 基础订单处理
- 简单的房间管理

## [v1.0.0] - 2024-01-01

### 初始版本
- 项目基础架构搭建
- 基础UI组件
- 原型设计
```
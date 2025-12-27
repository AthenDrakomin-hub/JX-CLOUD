# JX CLOUD (江西云厨) - 企业级酒店管理套件

> 专为现代化酒店、高端餐饮及综合度假村打造的全链路管理系统

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/) [![Supabase](https://img.shields.io/badge/Supabase-2.39.0-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/) [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

JX Cloud 是一款现代化的企业级酒店管理套件，采用 React 19 与 Supabase 云原生架构，为酒店、餐厅及度假村提供全链路管理解决方案。

## ✨ 特性

- **实时订单管理** - 基于 Supabase Realtime 的实时订单状态更新
- **多语言支持** - 支持中文、英文、菲律宾语三语切换
- **扫码点餐** - 为每个房间生成专属二维码，客人可直接扫码点餐
- **多角色权限** - 管理员、经理、员工三级权限管理
- **财务审计** - 完整的收入支出跟踪与审计功能
- **安全可靠** - 基于 JWT 的身份验证与行级安全策略

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Supabase 账户

### 本地开发

1. **克隆项目**

```bash
git clone <repository-url>
cd jx-cloud-enterprise-hospitality-suite
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件并添加：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **启动开发服务器**

```bash
npm run dev
```

### 生产部署

1. **构建项目**

```bash
npm run build
```

2. **部署到 Vercel**

在 Vercel 项目设置中配置以下环境变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🏗️ 数据库初始化

在 Supabase SQL 编辑器中运行以下脚本初始化数据库表结构和基础数据：

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

-- 预置初始管理员
INSERT INTO users (username, name, role) 
VALUES ('admin', '系统管理员', 'admin') 
ON CONFLICT (username) DO NOTHING;
```

## 🛠 配置要点

1. **Realtime 订阅**：在 Supabase Dashboard 的 **Database -> Replication** 中，确保 `orders` 表已启用 **Realtime** 选项
2. **RLS 策略**：运行 `enable_rls.sql` 脚本为 `security_logs` 和 `rooms` 表启用行级安全策略
3. **存储桶配置**：如需使用图片素材库功能，在 Supabase Dashboard 的 **Storage** 中创建名为 `materials` 的存储桶
4. **用户配置**：运行 `user_setup.sql` 脚本配置 2 个管理员和 3 个员工账号

## 📋 功能模块

- **Dashboard** - 实时业务数据分析与监控
- **Rooms** - 房间/桌位状态管理与二维码生成
- **Orders** - 订单全流程跟踪与管理
- **Menu** - 菜单配置与库存管理
- **Finance** - 财务审计与支出管理
- **Users** - 员工管理与安全审计
- **Settings** - 系统配置与法律文档

## 🔐 安全特性

- **身份验证**：通过 Supabase Auth 实现安全认证
- **行级安全**：通过 RLS 策略控制数据访问权限
- **匿名化设计**：不收集个人身份信息，保护用户隐私
- **加密传输**：所有数据传输使用 HTTPS 加密

## 🌐 国际化

系统支持中文、英文、菲律宾语三语切换，可轻松扩展至更多语言。

## 📄 许可证

本项目遵循特定许可证协议。详细信息请参阅 [LICENSE](./LICENSE) 文件（如存在）。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目！

## 📄 法律文档

- [隐私政策](./PRIVACY_POLICY.md) - 了解我们如何保护您的隐私
- [服务条款](./TERMS_OF_SERVICE.md) - 使用本服务的条款和条件
- [免责声明](./DISCLAIMER.md) - 了解责任边界和服务现状

## 📞 支持

如需技术支持或有疑问，请通过以下方式联系：

- 项目主页: https://www.jiangxijiudian.store/
- 问题报告: [GitHub Issues](链接到项目 Issues)

---

**江西云厨系统研发部 &copy; 2025****
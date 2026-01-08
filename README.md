# 江西云厨终端系统 (JX CLOUD) - 生产环境部署手册

本手册旨在指导技术团队将江西云厨系统从本地开发环境迁移至基于 **Vercel + Supabase** 的生产级云基础设施。

---

## 🛠 一、 基础设施准备

1.  **Supabase 账户**：[注册 Supabase](https://supabase.com/) 并创建一个新项目。
2.  **Vercel 账户**：[注册 Vercel](https://vercel.com/) 用于托管前端及边缘函数。
3.  **域名 (可选)**：生产环境建议绑定独立域名。

---

## 🗄 二、 数据库初始化 (Supabase SQL)

登录 Supabase 控制台，进入 **SQL Editor**，新建查询并依次执行以下脚本。

### 1. 核心架构设计
```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 系统全局配置
CREATE TABLE system_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  hotel_name TEXT DEFAULT '江西云厨',
  version TEXT DEFAULT '5.6.0',
  theme TEXT DEFAULT 'light',
  font_family TEXT DEFAULT 'Plus Jakarta Sans',
  font_size_base INTEGER DEFAULT 16,
  printer_ip TEXT DEFAULT '192.168.1.100',
  printer_port TEXT DEFAULT '9100',
  auto_print_order BOOLEAN DEFAULT TRUE,
  auto_print_receipt BOOLEAN DEFAULT FALSE,
  service_charge_rate DECIMAL(5,4) DEFAULT 0.12,
  contrast_strict BOOLEAN DEFAULT FALSE,
  voice_broadcast_enabled BOOLEAN DEFAULT TRUE,
  voice_volume DECIMAL(3,2) DEFAULT 1.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 菜品品类
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 菜品资产 (金额存分为 BIGINT，前端除以100)
CREATE TABLE menu_dishes (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  price_cents BIGINT NOT NULL, 
  category_id UUID REFERENCES menu_categories(id),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT FALSE,
  partner_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单主表 (JSONB 存储快照)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'Cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户与权限体系 (生产环境核心)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff', -- admin, staff, maintainer
  module_permissions JSONB DEFAULT '{}',
  ip_whitelist TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 注入超级管理员 (Seed Data)
**重要**：请先在 Supabase **Authentication** 页面手动创建一个邮箱为 `admin@jxcloud.com` 的用户，获取其 `User ID` (UUID)，然后执行：
```sql
INSERT INTO public.users (id, username, email, full_name, role, module_permissions)
VALUES (
  '你的_SUPER_ADMIN_UUID', 
  'admin', 
  'admin@jxcloud.com', 
  '系统总管理员', 
  'admin', 
  '{"dashboard": {"enabled": true}, "settings": {"enabled": true}}' -- Admin 逻辑在代码中会默认放行所有模块
);

INSERT INTO public.system_config (id, hotel_name) VALUES ('global', '江西云厨生产终端');
```

---

## ⚡ 三、 边缘函数部署 (Vercel Edge)

在 Vercel 项目设置中，配置以下 **Environment Variables**：

| 变量名 | 来源/说明 |
| :--- | :--- |
| `VITE_PROJECT_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase `anon` 秘钥 (用于前端匿名访问) |
| `SUPABASE_URL` | 同上 (供边缘函数使用) |
| `SUPABASE_SERVICE_ROLE_KEY` | 供边缘函数使用 (服务端环境) |

### 边缘网关 (api/index.ts)
系统会自动识别 `api/` 目录下的逻辑并部署为 Edge Runtime。它负责：
1.  **安全脱敏**：不向前端暴露 Service Key，只透出业务接口。
2.  **高权操作**：处理跨表统计、物理删除等受控任务。

---

## 🔐 四、 权限授权体系说明

本系统采用 **JSONB 矩阵授权模式**，无需修改代码即可动态控制权限：

1.  **管理员授权**：
    *   在“员工授权”模块中点击编辑。
    *   开启某个模块（如“财务与清算”）后，系统会在数据库 `module_permissions` 字段写入：`{"financial_hub": {"enabled": true, "r": true, "u": false}}`。
2.  **前端拦截逻辑**：
    *   `App.tsx` 中的 `hasAccess` 计算属性会实时解析该 JSON。
    *   如果用户没有 `orders` 模块权限，侧边栏将**自动隐藏**，直接通过 URL 访问会触发 **Access Denied** 安全屏障。
3.  **IP 白名单**：
    *   在员工档案中填入特定 IP（如固定办公 IP），系统将仅允许该 IP 登录该账号。

---

## 🖼 五、 云端素材库配置

1.  在 Supabase 控制台进入 **Storage**。
2.  创建一个 **Public** 桶，命名为 `jiangxiyunchu`。
3.  设置存储策略：允许 `Authenticated` 用户上传，允许所有用户 `SELECT`。
4.  在“图片管理”模块上传的所有图片将自动获得 CDN 加速路径，并同步至菜品档案。

---

## 🚀 六、 生产上线核对表 (Checklist)

- [ ] **HTTPS 强制**：在 Vercel 开启 Strict HTTPS。
- [ ] **环境变量**：确认所有 `VITE_` 前缀变量已在 Vercel Environment 面板配置。
- [ ] **数据库 RLS**：对 `orders` 和 `users` 表开启 Row Level Security，防止数据越权。
- [ ] **打印机测试**：确保本地热敏打印机与系统配置的 IP 在同一局域网或已做内网穿透。

---

## 📞 技术支持
江西云厨系统研发部 © 2025
*Enterprise Hospitality Intelligence Suite*
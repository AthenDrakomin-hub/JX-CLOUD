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
  id text not null default 'global'::text,
  hotel_name text null default '江西云厨'::text,
  version text null default '5.2.0'::text,
  theme text null default 'light'::text,
  font_family text null default 'Plus Jakarta Sans'::text,
  font_size_base integer null default 16,
  font_weight_base integer null default 500,
  line_height_base numeric(3, 2) null default 1.5,
  letter_spacing numeric(4, 2) null default 0,
  contrast_strict boolean null default true,
  text_color_main text null default '#0f172a'::text,
  bg_color_main text null default '#f8fafc'::text,
  printer_ip text null default '192.168.1.100'::text,
  printer_port text null default '9100'::text,
  auto_print_order boolean null default true,
  auto_print_receipt boolean null default true,
  voice_broadcast_enabled boolean null default true,
  voice_volume numeric(3, 2) null default 0.8,
  service_charge_rate numeric(4, 3) null default 0.05,
  updated_at timestamp with time zone null default now(),
  source_tag jsonb null,
  constraint system_config_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_system_config_source_tag on public.system_config using gin (source_tag jsonb_path_ops) TABLESPACE pg_default;

-- 菜品品类
CREATE TABLE menu_categories (
  id integer not null default nextval('menu_categories_id_seq'::regclass),
  name text not null,
  code text not null,
  parent_id integer null,
  level integer not null default 1,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  source_tag jsonb null,
  constraint menu_categories_pkey primary key (id),
  constraint uq_menu_categories_code unique (code),
  constraint uq_menu_categories_name_parent unique (name, parent_id),
  constraint fk_menu_categories_parent foreign KEY (parent_id) references menu_categories (id) on delete set null,
  constraint chk_menu_categories_display_order_nonneg check ((display_order >= 0)),
  constraint chk_menu_categories_level_nonzero check ((level >= 1))
);

create index IF not exists idx_menu_categories_source_tag on public.menu_categories using gin (source_tag jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_menu_categories_parent on public.menu_categories using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_menu_categories_active_order on public.menu_categories using btree (is_active, display_order) TABLESPACE pg_default;

create trigger trigger_menu_categories_updated_at BEFORE
update on menu_categories for EACH row
execute FUNCTION update_menu_categories_updated_at ();

-- 菜品资产 (金额以菲律宾比索为单位存储)
CREATE TABLE menu_dishes (
  idx integer null,
  id text not null,
  name_zh text not null,
  name_en text null,
  price_php integer null,
  stock integer not null default 0,
  image_url text null,
  is_available boolean not null default true,
  created_at timestamp with time zone not null default now(),
  category_id integer null,
  source_tag jsonb null,
  constraint menu_dishes_new_pkey primary key (id),
  constraint menu_dishes_new_category_id_fkey foreign KEY (category_id) references menu_categories (id) on delete set null,
  constraint menu_dishes_new_price_php_positive check ((price_php > 0)),
  constraint menu_dishes_new_stock_check check ((stock >= 0))
);

create index IF not exists idx_menu_dishes_new_source_tag on public.menu_dishes using gin (source_tag) TABLESPACE pg_default;

create index IF not exists idx_menu_dishes_new_category on public.menu_dishes using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_menu_dishes_new_available on public.menu_dishes using btree (is_available) TABLESPACE pg_default;

create index IF not exists idx_menu_dishes_new_price_php on public.menu_dishes using btree (price_php) TABLESPACE pg_default;

-- 订单主表 (JSONB 存储快照)
CREATE TABLE orders (
  id uuid not null default gen_random_uuid (),
  room_id text not null,
  items jsonb not null,
  total_amount numeric(10, 2) not null,
  tax_amount numeric(10, 2) null default 0,
  status text null default 'pending'::text,
  payment_method text null default 'Cash'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  updated_by uuid null,
  source_tag text null,
  constraint orders_pkey primary key (id),
  constraint orders_room_id_fkey foreign KEY (room_id) references rooms (id) on delete CASCADE,
  constraint orders_updated_by_fkey foreign KEY (updated_by) references users (id)
);

create index IF not exists idx_orders_room_id on public.orders using btree (room_id) TABLESPACE pg_default;

create index IF not exists idx_orders_source_tag on public.orders using btree (source_tag) TABLESPACE pg_default;

-- 用户与权限体系 (生产环境核心)
CREATE TABLE users (
  id uuid not null default gen_random_uuid (),
  email text not null,
  full_name text null,
  avatar_url text null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  auth_id uuid null,
  role text null default 'viewer'::text,
  username text not null,
  password text null,
  last_login timestamp with time zone null,
  module_permissions jsonb null,
  ip_whitelist text[] null,
  is_online boolean null default false,
  source_tag jsonb null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_username_key unique (username),
  constraint chk_users_ip_whitelist_format check (
    (
      (ip_whitelist is null)
      or (
        array_to_string(ip_whitelist, ','::text) ~ '^((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(,\s*)?)+$'::text
      )
    )
  ),
  constraint chk_users_role check (
    (
      role = any (
        array[
          'viewer'::text,
          'editor'::text,
          'admin'::text,
          'super_admin'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_source_tag on public.users using gin (source_tag jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_users_source_tag_user_type on public.users using gin (
  ((source_tag -> 'user_type'::text)) jsonb_path_ops
) TABLESPACE pg_default;

create index IF not exists idx_users_source_tag_region on public.users using gin (((source_tag -> 'region'::text)) jsonb_path_ops) TABLESPACE pg_default;

-- 支付配置表
CREATE TABLE payment_configs (
  id uuid not null default gen_random_uuid (),
  name text not null,
  type text not null,
  is_active boolean null default true,
  icon_type text null default 'credit-card'::text,
  instructions text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  source_tag jsonb null,
  constraint payment_configs_pkey primary key (id),
  constraint chk_payment_configs_source_tag_valid check (
    (
      (source_tag is null)
      or (
        jsonb_typeof(source_tag) = any (array['object'::text, 'array'::text])
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_configs_source_tag on public.payment_configs using gin (source_tag jsonb_path_ops) TABLESPACE pg_default;

-- 房间/桌位表
CREATE TABLE rooms (
  idx serial not null,
  id text not null,
  status text null default 'ready'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  source_tag text null,
  constraint rooms_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_rooms_id on public.rooms using btree (id) TABLESPACE pg_default;

create index IF not exists idx_rooms_source_tag on public.rooms using btree (source_tag) TABLESPACE pg_default;

create trigger trigger_rooms_updated_at BEFORE
update on rooms for EACH row
execute FUNCTION update_rooms_updated_at ();
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

# 江西云厨终端系统 - 核心数据库配置 (V5.2 生产闭环版)

本项目是基于 **Supabase (PostgreSQL)** 的全栈餐饮终端系统。

## 1. 数据库初始化 SQL (全量)

```sql
-- 启用必备扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 支付网关配置
CREATE TABLE payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'GCash', 'Maya', 'Cash', 'Alipay', 'Wechat'
  is_active BOOLEAN DEFAULT TRUE,
  icon_type TEXT DEFAULT 'credit-card',
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 品类架构
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- 3. 食材/物料库存
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock DECIMAL(12,2) DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 10,
  category TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 系统全局配置
CREATE TABLE system_config (
  id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'light',
  font_size TEXT DEFAULT 'medium',
  printer_ip TEXT,
  printer_port TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 用户表
CREATE TABLE users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NULL,
  avatar_url TEXT NULL,
  metadata JSONB NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  auth_id UUID NULL,
  role TEXT NULL DEFAULT 'viewer'::TEXT,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);
```

## 2. 行级安全 (RLS) 策略

- **用户表**: `CREATE POLICY "Allow Admin Full Access" ON users FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');`
- **订单读取**: `CREATE POLICY "Allow Public Read Orders" ON orders FOR SELECT TO public USING (true);`

## 3. 边缘函数 (Edge Functions)

支付回调处理伪代码：
```typescript
serve(async (req) => {
  const { order_id, status } = await req.json();
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'preparing' })
    .eq('id', order_id);
  return new Response(JSON.stringify({ success: true }));
});
```
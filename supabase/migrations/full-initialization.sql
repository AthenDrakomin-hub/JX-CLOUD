-- 完整的数据库初始化脚本
-- 基于 schema.ts 创建所有必需的表和函数

-- 1. 创建认证相关表 (Better-Auth required)
CREATE TABLE IF NOT EXISTS public."user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  role TEXT DEFAULT 'user',
  partner_id TEXT,
  module_permissions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL,
  transports JSONB,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建业务相关表
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  partner_id TEXT,
  module_permissions JSONB,
  auth_type TEXT DEFAULT 'credentials',
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_passkey_bound BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  tags TEXT[],
  price NUMERIC NOT NULL,
  category_id TEXT,
  stock INTEGER DEFAULT 99,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT FALSE,
  partner_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  customer_id TEXT,
  items JSONB DEFAULT '[]',
  total_amount NUMERIC DEFAULT '0',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_proof TEXT,
  cash_received NUMERIC,
  cash_change NUMERIC,
  is_printed BOOLEAN DEFAULT FALSE,
  partner_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  currency TEXT DEFAULT 'PHP',
  currency_symbol TEXT DEFAULT '₱',
  exchange_rate NUMERIC DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  payment_type TEXT DEFAULT 'digital',
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  description_en TEXT,
  icon_type TEXT,
  wallet_address TEXT,
  qr_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建用户迁移和注册相关表
CREATE TABLE IF NOT EXISTS public.user_migration (
  auth_user_id UUID PRIMARY KEY,
  business_user_id TEXT,
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  migration_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.registration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_time TIMESTAMPTZ DEFAULT NOW(),
  approval_time TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建upsert_business_user函数
CREATE OR REPLACE FUNCTION public.upsert_business_user(
  p_id TEXT,
  p_email TEXT,
  p_username TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'user',
  p_email_verified BOOLEAN DEFAULT FALSE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public."user" (id, email, username, name, role, email_verified, created_at, updated_at)
  VALUES (p_id, p_email, p_username, p_name, p_role, p_email_verified, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      username = COALESCE(EXCLUDED.username, public."user".username),
      name = COALESCE(EXCLUDED.name, public."user".name),
      role = COALESCE(EXCLUDED.role, public."user".role),
      email_verified = EXCLUDED.email_verified,
      updated_at = NOW();
END;
$$;

-- 5. 设置所有权限
-- 表权限
GRANT ALL ON TABLE public."user" TO service_role;
GRANT ALL ON TABLE public.session TO service_role;
GRANT ALL ON TABLE public.account TO service_role;
GRANT ALL ON TABLE public.verification TO service_role;
GRANT ALL ON TABLE public.passkeys TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.menu_dishes TO service_role;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT ALL ON TABLE public.payment_methods TO service_role;
GRANT ALL ON TABLE public.user_migration TO service_role;
GRANT ALL ON TABLE public.registration_requests TO service_role;

-- 函数权限
GRANT EXECUTE ON FUNCTION public.upsert_business_user(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;

-- 序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 6. 验证创建结果
SELECT 
  'user' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'session' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'account' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'account') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'verification' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verification') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'passkeys' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'passkeys') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'users' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'menu_dishes' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'menu_dishes') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'orders' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'payment_methods' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'user_migration' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_migration') THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 
  'registration_requests' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'registration_requests') THEN 'CREATED' ELSE 'FAILED' END as status;

-- 7. 验证函数
SELECT 
  'upsert_business_user' as function_name,
  CASE WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'upsert_business_user') THEN 'CREATED' ELSE 'FAILED' END as status,
  has_function_privilege('service_role', 'upsert_business_user(text,text,text,text,text,boolean)', 'EXECUTE') as executable;
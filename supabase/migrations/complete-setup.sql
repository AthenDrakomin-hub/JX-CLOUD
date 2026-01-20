-- 完整的数据库初始化和权限修复脚本

-- 1. 创建缺失的 registration_requests 表
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

-- 2. 确保所有必需的表都存在
-- user_migration 表（从之前的SQL中）
CREATE TABLE IF NOT EXISTS public.user_migration (
  auth_user_id UUID PRIMARY KEY,
  business_user_id TEXT,
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  migration_status TEXT DEFAULT 'pending'
);

-- 3. 确保 upsert_business_user 函数存在
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

-- 4. 设置表权限
GRANT ALL ON TABLE public."user" TO service_role;
GRANT ALL ON TABLE public.user_migration TO service_role;
GRANT ALL ON TABLE public.registration_requests TO service_role;

-- 5. 设置函数权限
GRANT EXECUTE ON FUNCTION public.upsert_business_user(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;

-- 6. 设置序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 8. 验证创建的表和函数
SELECT 'registration_requests table' as component, 
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'registration_requests') 
            THEN 'CREATED' ELSE 'FAILED' END as status
UNION ALL
SELECT 'user_migration table' as component,
       CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_migration')
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'upsert_business_user function' as component,
       CASE WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'upsert_business_user')
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 9. 测试权限
SELECT has_function_privilege('service_role', 'upsert_business_user(text,text,text,text,text,boolean)', 'EXECUTE') as function_executable;
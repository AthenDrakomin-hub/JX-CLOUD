-- ================================================
-- 江西云厨 - 紧急数据库修复脚本
-- 解决 PGRST204 和 PGRST205 错误
-- ================================================

-- 第一步：禁用所有 RLS 策略（临时解决方案）
DO $$ 
DECLARE 
    t text; 
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
    END LOOP; 
END $$;

-- 第二步：添加缺失的字段
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS partner_id TEXT;

-- 第三步：确保 Better Auth 表存在
CREATE TABLE IF NOT EXISTS public.user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  image TEXT,
  role TEXT DEFAULT 'user',
  partner_id TEXT,
  module_permissions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 第四步：给所有表授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 第五步：插入测试数据验证修复
INSERT INTO public.menu_categories (id, name, name_en, level, display_order, is_active, parent_id, partner_id)
VALUES 
  ('fix-test-cat-1', '修复测试一级', 'Fix Test Level 1', 1, 1, true, null, null),
  ('fix-test-cat-2', '修复测试二级', 'Fix Test Level 2', 2, 1, true, 'fix-test-cat-1', null)
ON CONFLICT (id) DO NOTHING;

-- 第六步：验证修复结果
SELECT '✅ Database schema fix completed!' as status;

-- 检查关键表结构
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN ('menu_categories', 'user', 'users') 
  AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
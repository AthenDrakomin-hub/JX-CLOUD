-- 江西云厨 - 数据库结构更新脚本
-- 修复表结构不匹配问题

-- 1. 确保所有必需的表都存在并有正确结构

-- 修复 menu_categories 表，添加缺失的 partner_id 字段
ALTER TABLE public.menu_categories 
ADD COLUMN IF NOT EXISTS partner_id TEXT;

-- 确保 Better Auth 的 user 表存在
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

-- 确保 session 表存在（Better Auth 需要）
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

-- 2. 重建 RLS 策略以确保完全开放访问
-- 先禁用所有表的 RLS
DO $$ 
DECLARE 
    t text; 
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
    END LOOP; 
END $$;

-- 然后重新启用并设置宽松策略
DO $$ 
DECLARE 
    t text; 
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') 
    LOOP 
        -- 重新启用 RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- 删除现有策略
        EXECUTE format('DROP POLICY IF EXISTS "Global Access" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Full access policy" ON public.%I', t);
        
        -- 创建新的宽松策略
        EXECUTE format('CREATE POLICY "Allow all access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP; 
END $$;

-- 3. 确保 Better Auth 表有正确的权限
GRANT ALL PRIVILEGES ON TABLE public.user TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.session TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 4. 检查并修复外键约束
ALTER TABLE public.menu_categories 
DROP CONSTRAINT IF EXISTS menu_categories_parent_id_fkey;

ALTER TABLE public.menu_categories 
ADD CONSTRAINT menu_categories_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES public.menu_categories(id) ON DELETE CASCADE;

-- 5. 验证表结构
-- 检查 menu_categories 是否有所有必需字段
DO $$
BEGIN
  -- 检查 parent_id 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_categories' AND column_name = 'parent_id'
  ) THEN
    RAISE NOTICE 'parent_id column missing from menu_categories';
  ELSE
    RAISE NOTICE 'parent_id column exists in menu_categories';
  END IF;
  
  -- 检查 partner_id 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_categories' AND column_name = 'partner_id'
  ) THEN
    RAISE NOTICE 'partner_id column missing from menu_categories';
  ELSE
    RAISE NOTICE 'partner_id column exists in menu_categories';
  END IF;
  
  -- 检查 user 表的 role 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user' AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'role column missing from user table';
  ELSE
    RAISE NOTICE 'role column exists in user table';
  END IF;
END $$;

-- 6. 插入测试数据验证结构
-- 插入一个测试分类
INSERT INTO public.menu_categories (id, name, name_en, level, display_order, is_active, parent_id, partner_id)
VALUES ('test-category-1', '测试一级分类', 'Test Level 1', 1, 1, true, null, null)
ON CONFLICT (id) DO NOTHING;

-- 插入二级分类
INSERT INTO public.menu_categories (id, name, name_en, level, display_order, is_active, parent_id, partner_id)
VALUES ('test-category-2', '测试二级分类', 'Test Level 2', 2, 1, true, 'test-category-1', null)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE 'Database schema update completed successfully!';
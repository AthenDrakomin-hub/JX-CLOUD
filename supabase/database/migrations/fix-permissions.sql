-- 修复数据库权限配置脚本
-- 为upsert_business_user函数授予必要的权限

-- 1. 确保public模式下的函数可被service_role访问
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. 为upsert_business_user函数授予权限
GRANT EXECUTE ON FUNCTION public.upsert_business_user(text, text, text, text, text, boolean) TO service_role;

-- 3. 确保相关表的权限
GRANT ALL ON TABLE public.user TO service_role;
GRANT ALL ON TABLE public.user_migration TO service_role;
GRANT ALL ON TABLE public.registration_requests TO service_role;

-- 4. 为序列授予权限（如果有自增主键）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. 设置默认权限（对于未来创建的对象）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 6. 验证权限设置
SELECT 
    proname as function_name,
    proacl as permissions
FROM pg_proc 
WHERE proname = 'upsert_business_user';

-- 7. 测试函数是否可执行
SELECT has_function_privilege('service_role', 'upsert_business_user(text,text,text,text,text,boolean)', 'EXECUTE') as can_execute;
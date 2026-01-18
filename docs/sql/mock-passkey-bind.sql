-- SQL Mock 绑定状态脚本
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 更新指定用户的指纹绑定状态
UPDATE public.users 
SET is_passkey_bound = true 
WHERE email = 'athendrakominproton.me';

-- 或者更新所有用户的指纹绑定状态（用于测试）
UPDATE public.users 
SET is_passkey_bound = true 
WHERE email IS NOT NULL;

-- 查询验证更新结果
SELECT email, is_passkey_bound, is_active 
FROM public.users 
WHERE email = 'athendrakominproton.me';
-- 清理数据库中的密码相关字段
-- 确保系统只使用生物识别认证

-- 1. 移除users表中的password_hash字段（如果为空）
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 2. 移除account表中的password字段（如果为空且不需要OAuth）
-- 注意：保留此字段可能更安全，以防将来需要OAuth集成
-- ALTER TABLE account DROP COLUMN IF EXISTS password;

-- 3. 添加注释说明认证机制
COMMENT ON TABLE "user" IS 'Main user table for Better Auth - WebAuthn/Passkey only';
COMMENT ON TABLE passkeys IS 'WebAuthn passkey credentials - primary authentication method';
COMMENT ON TABLE session IS 'Active user sessions - secured by passkeys only';

-- 4. 验证清理结果
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name ILIKE '%password%'
  AND table_schema = 'public';
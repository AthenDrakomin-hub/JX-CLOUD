-- ============================================================
-- 🛡️ Passkey 表安全配置脚本
-- 为江西云厨系统的 Passkey 表配置行级安全策略
-- ============================================================

-- 开启 Passkey 表的行级安全
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- 核心策略：仅允许用户访问自己的 Passkey
CREATE POLICY "Users can manage their own passkeys" ON passkeys
  FOR ALL USING (auth.uid()::text = user_id);

-- 允许服务角色操作所有 Passkey（供 Better Auth 后端使用）
CREATE POLICY "Allow service role to manage passkeys" ON passkeys
  FOR ALL USING (current_setting('role') = 'service_role');

-- 禁止匿名访问
CREATE POLICY "Deny anonymous access to passkeys" ON passkeys
  FOR ALL TO anon USING (false);

-- 额外的安全索引（如果还不存在）
CREATE INDEX IF NOT EXISTS passkeys_user_id_idx ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS passkeys_credential_id_idx ON passkeys(credential_id);

-- 验证策略创建成功
SELECT tablename, policyname, roles, qual 
FROM pg_policies 
WHERE tablename = 'passkeys';

-- 检查表结构
\d passkeys

-- ============================================================
-- 📝 使用说明：
-- 1. 在 Supabase 控制台的 SQL 编辑器中执行此脚本
-- 2. 或者通过 psql 命令行工具执行
-- 3. 确保在 Better Auth 创建 passkeys 表之后再执行
-- ============================================================
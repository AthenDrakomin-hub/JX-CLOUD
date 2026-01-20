-- 重新创建passkey表以匹配Drizzle schema定义
-- 删除现有表（如果存在）
DROP TABLE IF EXISTS passkeys CASCADE;

-- 创建符合Better Auth要求的新表
CREATE TABLE passkeys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    device_type TEXT NOT NULL,
    transports JSONB,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建必要索引
CREATE INDEX passkeys_user_id_idx ON passkeys(user_id);
CREATE INDEX passkeys_credential_id_idx ON passkeys(credential_id);

-- 添加表注释
COMMENT ON TABLE passkeys IS 'Better Auth WebAuthn passkey credentials';
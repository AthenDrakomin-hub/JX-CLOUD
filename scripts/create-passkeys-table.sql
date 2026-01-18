-- 直接创建 passkeys 表的 SQL 脚本
-- 用于在 Supabase 数据库中创建 Passkey 认证所需的表

-- 检查表是否已存在
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables 
                 WHERE table_schema = 'public' 
                 AND table_name = 'passkeys') THEN
    
    CREATE TABLE passkeys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id TEXT NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0 NOT NULL,
      device_type TEXT NOT NULL,
      transports JSONB DEFAULT '[]'::jsonb,
      last_used_at TIMESTAMP WITH TIME ZONE,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT passkeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
    );

    -- 创建索引
    CREATE INDEX passkeys_user_id_idx ON passkeys USING btree (user_id);
    CREATE INDEX passkeys_credential_id_idx ON passkeys USING btree (credential_id);

    RAISE NOTICE '✅ passkeys 表创建成功';
  ELSE
    RAISE NOTICE 'ℹ️ passkeys 表已存在';
  END IF;
END $$;

-- 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'passkeys'
ORDER BY ordinal_position;
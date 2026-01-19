-- ==========================================
-- 补充 Better-Auth 核心认证表 (生产环境)
-- ==========================================

-- 外部账户关联表
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 验证令牌表
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Passkey 生物凭证表 (指纹/面部识别核心数据)
CREATE TABLE IF NOT EXISTS "passkey" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "credentialId" TEXT NOT NULL UNIQUE,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT FALSE,
    "transports" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- RLS 安全加固
-- ==========================================

-- 启用 RLS 策略
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "passkey" ENABLE ROW LEVEL SECURITY;

-- 账户关联策略
CREATE POLICY "Users can manage their own accounts" ON "account"
FOR ALL USING (auth.uid()::text = "userId");

-- 验证令牌策略
CREATE POLICY "Users can manage their own verifications" ON "verification"
FOR ALL USING (auth.uid()::text = split_part("identifier", ':', 2));

-- Passkey 生物凭证策略
CREATE POLICY "Users can manage their own passkeys" ON "passkey"
FOR ALL USING (auth.uid()::text = "userId");

-- ==========================================
-- 索引优化
-- ==========================================

-- 账户索引
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider ON "account"("providerId", "accountId");

-- 验证令牌索引
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"("identifier");
CREATE INDEX IF NOT EXISTS idx_verification_expires ON "verification"("expiresAt");

-- Passkey 索引
CREATE INDEX IF NOT EXISTS idx_passkey_user_id ON "passkey"("userId");
CREATE INDEX IF NOT EXISTS idx_passkey_credential_id ON "passkey"("credentialId");

-- ==========================================
-- 数据初始化
-- ==========================================

-- 插入默认系统配置（如果不存在）
INSERT INTO "system_config" (id, hotel_name, theme, version, auto_print_order, ticket_style, font_family)
VALUES ('global', '江西云厨', 'light', '8.8.0', true, 'standard', 'Plus Jakarta Sans')
ON CONFLICT (id) DO NOTHING;

-- 插入默认支付方式（如果不存在）
INSERT INTO "payment_methods" (id, name, name_en, currency, currency_symbol, exchange_rate, is_active, payment_type, sort_order)
VALUES 
    ('cash_php', '现金支付', 'Cash Payment', 'PHP', '₱', 1.0, true, 'cash', 1),
    ('gcash', 'GCash', 'GCash', 'PHP', '₱', 1.0, true, 'digital', 2)
ON CONFLICT (id) DO NOTHING;

-- 插入默认房间数据（如果不存在）
INSERT INTO "rooms" (id, status)
SELECT room_num, 'available'
FROM unnest(ARRAY[
    '8201','8202','8203','8204','8205','8206','8207','8208','8209','8210',
    '8211','8212','8213','8214','8215','8216','8217','8218','8219','8220',
    '8221','8222','8223','8224','8225','8226','8227','8228','8229','8230',
    '8231','8232',
    '8301','8302','8303','8304','8305','8306','8307','8308','8309','8310',
    '8311','8312','8313','8314','8315','8316','8317','8318','8319','8320',
    '8321','8322','8323','8324','8325','8326','8327','8328','8329','8330',
    '8331','8332',
    'VIP-666','VIP-888','VIP-000'
]) as room_num
ON CONFLICT (id) DO NOTHING;

-- 验证创建结果
SELECT '✅ Better-Auth 表创建完成' as status;
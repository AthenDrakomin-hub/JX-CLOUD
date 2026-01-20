
-- ==========================================
-- 1. Better-Auth 核心认证表 (Passkey 物理资产存储)
-- ==========================================

-- 用户会话表
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

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
-- 2. RLS 安全加固与审计
-- ==========================================

-- 确保认证相关表也受到保护
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "passkey" ENABLE ROW LEVEL SECURITY;

-- 允许用户访问自己的生物凭证
CREATE POLICY "Users can manage their own passkeys" ON "passkey"
FOR ALL USING (auth.uid()::text = "userId");

-- 之前的同步触发器 (保持不变，已在文件中定义)
-- ...

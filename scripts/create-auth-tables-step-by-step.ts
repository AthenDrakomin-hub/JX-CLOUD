import postgres from 'postgres';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量获取数据库连接信息
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 或 POSTGRES_URL 环境变量未设置');
  process.exit(1);
}

async function createAuthTablesStepByStep() {
  console.log('🚀 逐步创建 Better-Auth 表...');
  
  const sql = postgres(connectionString!);
  
  try {
    // 1. 创建 account 表
    console.log('1. 创建 account 表...');
    await sql`
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
    `;
    console.log('✅ account 表创建成功');

    // 2. 创建 verification 表
    console.log('2. 创建 verification 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ verification 表创建成功');

    // 3. 创建 passkey 表
    console.log('3. 创建 passkey 表...');
    await sql`
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
    `;
    console.log('✅ passkey 表创建成功');

    // 4. 启用 RLS
    console.log('4. 启用 RLS 策略...');
    await sql`ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE "passkey" ENABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS 策略启用成功');

    // 5. 创建 RLS 策略
    console.log('5. 创建 RLS 策略...');
    await sql`
      CREATE POLICY "Users can manage their own accounts" ON "account"
      FOR ALL USING (auth.uid()::text = "userId");
    `;
    
    await sql`
      CREATE POLICY "Users can manage their own verifications" ON "verification"
      FOR ALL USING (auth.uid()::text = split_part("identifier", ':', 2));
    `;
    
    await sql`
      CREATE POLICY "Users can manage their own passkeys" ON "passkey"
      FOR ALL USING (auth.uid()::text = "userId");
    `;
    console.log('✅ RLS 策略创建成功');

    // 6. 创建索引
    console.log('6. 创建索引...');
    await sql`CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_account_provider ON "account"("providerId", "accountId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"("identifier");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_verification_expires ON "verification"("expiresAt");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_passkey_user_id ON "passkey"("userId");`;
    await sql`CREATE INDEX IF NOT EXISTS idx_passkey_credential_id ON "passkey"("credentialId");`;
    console.log('✅ 索引创建成功');

    // 7. 验证创建结果
    console.log('\n🔍 验证创建结果:');
    const tablesToCheck = ['account', 'verification', 'passkey'];
    
    for (const table of tablesToCheck) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        ) AS table_exists;
      `;
      
      if (result[0].table_exists) {
        console.log(`✅ ${table} 表已存在`);
        
        // 显示表的基本信息
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`   记录数: ${countResult[0].count}`);
      } else {
        console.log(`❌ ${table} 表不存在`);
      }
    }

    console.log('\n🎉 所有 Better-Auth 表创建完成！');
    
    await sql.end();
  } catch (error) {
    console.error('❌ 创建表过程中发生错误:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行逐步创建
createAuthTablesStepByStep();
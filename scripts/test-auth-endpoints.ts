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

async function testAuthEndpoints() {
  console.log('🚀 测试认证相关 API 端点...');
  
  const sql = postgres(connectionString!);
  
  try {
    // 1. 测试用户表访问
    console.log('1. 测试用户表访问...');
    const userResult = await sql`SELECT COUNT(*) as count FROM "user" LIMIT 1`;
    console.log(`✅ 用户表访问正常: ${userResult[0].count} 条记录`);
    
    // 2. 测试会话表访问
    console.log('2. 测试会话表访问...');
    const sessionResult = await sql`SELECT COUNT(*) as count FROM "session" LIMIT 1`;
    console.log(`✅ 会话表访问正常: ${sessionResult[0].count} 条记录`);
    
    // 3. 测试通行密钥表访问
    console.log('3. 测试通行密钥表访问...');
    const passkeyResult = await sql`SELECT COUNT(*) as count FROM "passkeys" LIMIT 1`;
    console.log(`✅ 通行密钥表访问正常: ${passkeyResult[0].count} 条记录`);
    
    // 4. 测试验证表访问
    console.log('4. 测试验证表访问...');
    const verificationResult = await sql`SELECT COUNT(*) as count FROM "verification" LIMIT 1`;
    console.log(`✅ 验证表访问正常: ${verificationResult[0].count} 条记录`);
    
    // 5. 测试账户表访问
    console.log('5. 测试账户表访问...');
    const accountResult = await sql`SELECT COUNT(*) as count FROM "account" LIMIT 1`;
    console.log(`✅ 账户表访问正常: ${accountResult[0].count} 条记录`);
    
    console.log('\n🎉 所有认证相关表访问测试通过！');
    
    await sql.end();
  } catch (error) {
    console.error('❌ 数据库访问测试失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行测试
testAuthEndpoints();
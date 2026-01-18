#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function createTestData() {
  console.log('🧪 创建测试数据来演示表关系...\n');
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    return;
  }

  const client = postgres(connectionString, { 
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60
  });
  
  const db = drizzle(client);

  try {
    // 创建测试用户数据
    console.log('👤 创建测试用户数据...');
    
    // 插入user表数据 (Better Auth认证表)
    const testUserId = 'test-user-001';
    const testEmail = 'test@example.com';
    
    const insertUserQuery = `
      INSERT INTO "user" (id, name, email, role, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, name
    `;
    
    const userResult = await db.execute(insertUserQuery, [
      testUserId,
      '测试用户',
      testEmail,
      'admin',
      true
    ]);
    
    if (userResult.length > 0) {
      console.log(`   ✅ 创建认证用户: ${userResult[0].name} (${userResult[0].email})`);
    }

    // 插入users表数据 (业务逻辑表)
    const insertUsersQuery = `
      INSERT INTO "users" (id, username, email, name, role, auth_type, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, email, name
    `;
    
    const usersResult = await db.execute(insertUsersQuery, [
      'biz-' + testUserId,
      'test_admin',
      testEmail,  // 使用相同邮箱实现关联
      '测试用户',
      'admin',
      'password',
      true
    ]);
    
    if (usersResult.length > 0) {
      console.log(`   ✅ 创建业务用户: ${usersResult[0].username} (${usersResult[0].email})`);
    }

    // 插入passkeys表数据 (生物识别)
    const insertPasskeyQuery = `
      INSERT INTO "passkeys" (user_id, credential_id, public_key, device_type, counter, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, user_id, device_type
    `;
    
    const passkeyResult = await db.execute(insertPasskeyQuery, [
      testUserId,
      'test-credential-id-12345',
      '-----BEGIN PUBLIC KEY-----\nTEST-PUBLIC-KEY-DATA\n-----END PUBLIC KEY-----',
      'cross-platform',
      0
    ]);
    
    if (passkeyResult.length > 0) {
      console.log(`   ✅ 创建生物识别凭证: ${passkeyResult[0].device_type} 设备`);
    }

    console.log('\n🔍 验证表关系...');
    
    // 验证双用户系统关联
    const verifyQuery = `
      SELECT 
        u1.id as auth_id,
        u1.email as auth_email,
        u1.name as auth_name,
        u2.id as business_id,
        u2.username as business_username,
        u2.name as business_name,
        COUNT(p.id) as passkey_count
      FROM "user" u1
      JOIN "users" u2 ON u1.email = u2.email
      LEFT JOIN "passkeys" p ON u1.id = p.user_id
      WHERE u1.email = $1
      GROUP BY u1.id, u1.email, u1.name, u2.id, u2.username, u2.name
    `;
    
    const verification = await db.execute(verifyQuery, [testEmail]);
    
    if (verification.length > 0) {
      const record = verification[0];
      console.log('\n✅ 表关系验证成功:');
      console.log(`   认证用户ID: ${record.auth_id}`);
      console.log(`   业务用户ID: ${record.business_id}`);
      console.log(`   共同邮箱: ${record.auth_email}`);
      console.log(`   生物识别凭证数: ${record.passkey_count}`);
      console.log(`   关联状态: ✅ 完全关联`);
    }

    console.log('\n📊 当前表数据统计:');
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "user") as user_count,
        (SELECT COUNT(*) FROM "users") as users_count,
        (SELECT COUNT(*) FROM "passkeys") as passkeys_count
    `;
    
    const stats = await db.execute(statsQuery);
    console.log(`   user表: ${stats[0].user_count} 条记录`);
    console.log(`   users表: ${stats[0].users_count} 条记录`);
    console.log(`   passkeys表: ${stats[0].passkeys_count} 条记录`);

    console.log('\n✅ 测试数据创建完成!');

  } catch (error) {
    console.error('❌ 创建测试数据时出错:', error);
  } finally {
    await client.end();
    console.log('🔒 数据库连接已关闭');
  }
}

createTestData();
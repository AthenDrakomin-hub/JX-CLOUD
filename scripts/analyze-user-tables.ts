#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { user, users, passkeys } from '../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function analyzeUserTables() {
  console.log('🔍 分析用户相关表的关系...\n');
  
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
    // 1. 检查各表的数据量
    console.log('📊 表数据量统计:');
    const userCount = await db.select({ count: sql`COUNT(*)` }).from(user);
    const usersCount = await db.select({ count: sql`COUNT(*)` }).from(users);
    const passkeysCount = await db.select({ count: sql`COUNT(*)` }).from(passkeys);
    
    console.log(`   user表 (认证表): ${userCount[0].count} 条记录`);
    console.log(`   users表 (业务表): ${usersCount[0].count} 条记录`);
    console.log(`   passkeys表 (生物识别): ${passkeysCount[0].count} 条记录\n`);

    // 2. 查看user表结构示例数据
    console.log('📋 user表 (Better Auth认证表) 示例数据:');
    const userSamples = await db.select().from(user).limit(3);
    userSamples.forEach((u, i) => {
      console.log(`   ${i + 1}. ID: ${u.id.substring(0, 8)}..., Email: ${u.email}, Role: ${u.role}`);
    });
    console.log('');

    // 3. 查看users表结构示例数据
    console.log('📋 users表 (业务逻辑表) 示例数据:');
    const usersSamples = await db.select().from(users).limit(3);
    usersSamples.forEach((u, i) => {
      console.log(`   ${i + 1}. ID: ${u.id.substring(0, 8)}..., Username: ${u.username}, Email: ${u.email || 'N/A'}, Role: ${u.role}`);
    });
    console.log('');

    // 4. 查看passkeys表示例数据
    console.log('📋 passkeys表 (生物识别认证) 示例数据:');
    const passkeysSamples = await db.select().from(passkeys).limit(3);
    passkeysSamples.forEach((p, i) => {
      console.log(`   ${i + 1}. ID: ${p.id.toString().substring(0, 8)}..., User_ID: ${p.userId.substring(0, 8)}..., Device: ${p.deviceType}`);
    });
    console.log('');

    // 5. 分析关联关系
    console.log('🔗 表关联关系分析:');
    
    // 检查user和users表的email匹配情况
    const emailMatchQuery = sql`
      SELECT COUNT(*) as matched_count
      FROM ${user} u1
      JOIN ${users} u2 ON u1.email = u2.email
    `;
    const emailMatches = await db.execute(emailMatchQuery);
    console.log(`   ✅ user ↔ users 表通过 email 字段关联: ${emailMatches[0].matched_count} 条匹配记录`);

    // 检查passkeys和user表的关联
    const passkeyUserQuery = sql`
      SELECT COUNT(*) as linked_count
      FROM ${passkeys} p
      JOIN ${user} u ON p.user_id = u.id
    `;
    const passkeyLinks = await db.execute(passkeyUserQuery);
    console.log(`   ✅ passkeys ↔ user 表通过 user_id 字段关联: ${passkeyLinks[0].linked_count} 条关联记录`);

    // 6. 显示具体的关联示例
    console.log('\n🔍 具体关联示例:');
    
    // 获取一个完整的关联示例
    const fullRelationQuery = sql`
      SELECT 
        u1.id as auth_id,
        u1.email as auth_email,
        u1.name as auth_name,
        u2.id as business_id,
        u2.username as business_username,
        u2.name as business_name,
        COUNT(p.id) as passkey_count
      FROM ${user} u1
      JOIN ${users} u2 ON u1.email = u2.email
      LEFT JOIN ${passkeys} p ON u1.id = p.user_id
      GROUP BY u1.id, u1.email, u1.name, u2.id, u2.username, u2.name
      LIMIT 1
    `;
    
    const relationSample = await db.execute(fullRelationQuery);
    if (relationSample.length > 0) {
      const sample = relationSample[0];
      console.log(`   用户关联示例:`);
      console.log(`     认证ID: ${sample.auth_id.substring(0, 8)}...`);
      console.log(`     业务ID: ${sample.business_id.substring(0, 8)}...`);
      console.log(`     邮箱: ${sample.auth_email}`);
      console.log(`     用户名: ${sample.business_username}`);
      console.log(`     生物识别凭证数量: ${sample.passkey_count}`);
    }

    console.log('\n✅ 表关系分析完成!');

  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  } finally {
    await client.end();
    console.log('🔒 数据库连接已关闭');
  }
}

// 导入sql函数
import { sql } from 'drizzle-orm';

analyzeUserTables();
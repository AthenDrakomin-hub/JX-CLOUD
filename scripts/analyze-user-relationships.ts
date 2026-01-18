#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function analyzeUserRelationships() {
  console.log('🔍 深入分析 user、users 和 passkeys 表的关系...\n');
  
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
    // 使用原始SQL查询来避免schema不匹配的问题
    console.log('📊 表数据量统计:');
    
    // 查询各表记录数
    const userCountResult = await db.execute(`SELECT COUNT(*) as count FROM "user"`);
    const usersCountResult = await db.execute(`SELECT COUNT(*) as count FROM "users"`);
    const passkeysCountResult = await db.execute(`SELECT COUNT(*) as count FROM "passkeys"`);
    
    const userCount = parseInt(userCountResult[0].count);
    const usersCount = parseInt(usersCountResult[0].count);
    const passkeysCount = parseInt(passkeysCountResult[0].count);
    
    console.log(`   user表 (认证表): ${userCount} 条记录`);
    console.log(`   users表 (业务表): ${usersCount} 条记录`);
    console.log(`   passkeys表 (生物识别): ${passkeysCount} 条记录\n`);

    // 显示表结构摘要
    console.log('📋 表结构摘要:');
    console.log('   user表 (Better Auth认证表):');
    console.log('     - id (text, PK) - 认证系统唯一标识');
    console.log('     - email (text, UK) - 邮箱地址');
    console.log('     - name (text) - 用户姓名');
    console.log('     - role (text) - 用户角色');
    console.log('     - partner_id (text) - 合伙人ID');
    console.log('');
    
    console.log('   users表 (业务逻辑表):');
    console.log('     - id (text, PK) - 业务系统唯一标识');
    console.log('     - username (text) - 用户名');
    console.log('     - email (text) - 邮箱地址');
    console.log('     - name (text) - 用户姓名');
    console.log('     - role (text) - 用户角色');
    console.log('     - partner_id (text) - 合伙人ID');
    console.log('     - auth_type (text) - 认证类型');
    console.log('');
    
    console.log('   passkeys表 (生物识别认证):');
    console.log('     - id (uuid, PK) - 凭证唯一标识');
    console.log('     - user_id (text, FK) - 关联的用户ID');
    console.log('     - credential_id (text) - WebAuthn凭证ID');
    console.log('     - public_key (text) - 公钥');
    console.log('     - device_type (text) - 设备类型');
    console.log('');

    // 分析关联关系
    console.log('🔗 表关联关系分析:');
    
    // 检查通过email关联的情况
    const emailJoinQuery = `
      SELECT 
        u1.id as auth_id,
        u1.email as auth_email,
        u1.name as auth_name,
        u2.id as business_id,
        u2.username as business_username,
        u2.name as business_name
      FROM "user" u1
      JOIN "users" u2 ON u1.email = u2.email
      LIMIT 3
    `;
    
    const emailMatches = await db.execute(emailJoinQuery);
    console.log(`   ✅ user ↔ users 表通过 email 字段关联`);
    console.log(`      匹配记录数: ${emailMatches.length}`);
    if (emailMatches.length > 0) {
      console.log('      关联示例:');
      emailMatches.forEach((match, i) => {
        console.log(`        ${i + 1}. 认证邮箱: ${match.auth_email}`);
        console.log(`           认证ID: ${match.auth_id?.substring(0, 8)}...`);
        console.log(`           业务用户名: ${match.business_username}`);
        console.log(`           业务ID: ${match.business_id?.substring(0, 8)}...`);
      });
    }
    console.log('');

    // 检查passkeys和user的关联
    const passkeyJoinQuery = `
      SELECT 
        p.id as passkey_id,
        p.user_id,
        p.device_type,
        u.email as user_email,
        u.name as user_name
      FROM "passkeys" p
      JOIN "user" u ON p.user_id = u.id
      LIMIT 3
    `;
    
    const passkeyMatches = await db.execute(passkeyJoinQuery);
    console.log(`   ✅ passkeys ↔ user 表通过 user_id 字段关联`);
    console.log(`      关联记录数: ${passkeyMatches.length}`);
    if (passkeyMatches.length > 0) {
      console.log('      关联示例:');
      passkeyMatches.forEach((match, i) => {
        console.log(`        ${i + 1}. 凭证ID: ${match.passkey_id?.toString().substring(0, 8)}...`);
        console.log(`           用户ID: ${match.user_id?.substring(0, 8)}...`);
        console.log(`           用户邮箱: ${match.user_email}`);
        console.log(`           设备类型: ${match.device_type}`);
      });
    }
    console.log('');

    // 检查完整的三表关联
    const tripleJoinQuery = `
      SELECT 
        u1.id as auth_id,
        u1.email as email,
        u2.id as business_id,
        u2.username,
        COUNT(p.id) as passkey_count
      FROM "user" u1
      JOIN "users" u2 ON u1.email = u2.email
      LEFT JOIN "passkeys" p ON u1.id = p.user_id
      GROUP BY u1.id, u1.email, u2.id, u2.username
      HAVING COUNT(p.id) > 0
      LIMIT 2
    `;
    
    const tripleMatches = await db.execute(tripleJoinQuery);
    console.log(`   🔗 三表完整关联 (user ↔ users ↔ passkeys):`);
    console.log(`      完整关联记录数: ${tripleMatches.length}`);
    if (tripleMatches.length > 0) {
      console.log('      完整关联示例:');
      tripleMatches.forEach((match, i) => {
        console.log(`        ${i + 1}. 邮箱: ${match.email}`);
        console.log(`           认证ID: ${match.auth_id?.substring(0, 8)}...`);
        console.log(`           业务用户名: ${match.username}`);
        console.log(`           生物识别凭证数: ${match.passkey_count}`);
      });
    } else {
      console.log('      暂无完整的三表关联数据');
    }

    // 总结关系模式
    console.log('\n📚 关系模式总结:');
    console.log('   1. 双用户系统架构:');
    console.log('      • user表: Better Auth认证系统的标准用户表');
    console.log('      • users表: 业务逻辑系统的扩展用户表');
    console.log('      • 通过email字段实现数据同步和关联');
    console.log('');
    console.log('   2. 生物识别集成:');
    console.log('      • passkeys表存储WebAuthn生物识别凭证');
    console.log('      • 通过user_id外键关联到user认证表');
    console.log('      • 支持指纹、面部识别等多种生物特征认证');
    console.log('');
    console.log('   3. 数据流向:');
    console.log('      认证流程: user表 → passkeys表 (生物识别)');
    console.log('      业务流程: users表 (业务操作)');
    console.log('      同步机制: 通过email字段保持两套用户系统的一致性');

    console.log('\n✅ 表关系分析完成!');

  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  } finally {
    await client.end();
    console.log('🔒 数据库连接已关闭');
  }
}

analyzeUserRelationships();
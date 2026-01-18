#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function demonstrateTableRelationships() {
  console.log('🔍 演示 user、users 和 passkeys 表的关系...\n');
  
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
    // 直接执行SQL查询来展示关系概念
    console.log('📚 三表关系架构说明:');
    
    console.log('\n1. 🔄 双用户系统架构:');
    console.log('   user表 (认证系统) ←→ users表 (业务系统)');
    console.log('   关联字段: email');
    console.log('   目的: 实现认证与业务逻辑解耦');
    
    console.log('\n2. 🔐 生物识别集成:');
    console.log('   user表 ←→ passkeys表');
    console.log('   关联字段: user_id (外键)');
    console.log('   目的: 支持WebAuthn生物识别认证');
    
    console.log('\n3. 📊 数据流向图:');
    console.log('   认证流程: 前端 → user表 → passkeys表');
    console.log('   业务流程: 前端 → users表 → 业务逻辑');
    console.log('   同步机制: 通过email字段保持数据一致性');
    
    // 展示表结构对比
    console.log('\n📋 表结构对比分析:');
    
    console.log('\n   user表 (Better Auth标准):');
    console.log('   ┌─────────────────────────────────────┐');
    console.log('   │ id          | text (PK)            │');
    console.log('   │ email       | text (UK)            │');
    console.log('   │ name        | text                 │');
    console.log('   │ role        | text                 │');
    console.log('   │ partner_id  | text                 │');
    console.log('   └─────────────────────────────────────┘');
    
    console.log('\n   users表 (业务扩展):');
    console.log('   ┌─────────────────────────────────────┐');
    console.log('   │ id          | text (PK)            │');
    console.log('   │ username    | text                 │');
    console.log('   │ email       | text                 │');
    console.log('   │ name        | text                 │');
    console.log('   │ role        | text                 │');
    console.log('   │ auth_type   | text                 │');
    console.log('   └─────────────────────────────────────┘');
    
    console.log('\n   passkeys表 (生物识别):');
    console.log('   ┌─────────────────────────────────────┐');
    console.log('   │ id          | uuid (PK)            │');
    console.log('   │ user_id     | text (FK → user.id)  │');
    console.log('   │ device_type | text                 │');
    console.log('   │ public_key  | text                 │');
    console.log('   └─────────────────────────────────────┘');
    
    // 查询当前数据库中的实际关系
    console.log('\n🔍 当前数据库中的关系状态:');
    
    // 检查是否有通过email关联的记录
    const emailRelationQuery = `
      SELECT 
        COUNT(*) as total_pairs,
        COUNT(CASE WHEN u1.email = u2.email THEN 1 END) as email_matches
      FROM "user" u1
      CROSS JOIN "users" u2
    `;
    
    const relationStats = await db.execute(emailRelationQuery);
    console.log(`   user ↔ users 邮箱匹配可能性: ${relationStats[0].email_matches}/${relationStats[0].total_pairs}`);
    
    // 检查passkeys关联
    const passkeyRelationQuery = `
      SELECT COUNT(*) as linked_passkeys
      FROM "passkeys" p
      JOIN "user" u ON p.user_id = u.id
    `;
    
    const passkeyStats = await db.execute(passkeyRelationQuery);
    console.log(`   user ↔ passkeys 已关联记录: ${passkeyStats[0].linked_passkeys}`);
    
    // 展示理论上的完整关系模型
    console.log('\n🎯 完整的关系模型示例:');
    console.log('   假设数据:');
    console.log('   user表:');
    console.log('     id: "auth-123", email: "admin@example.com", name: "管理员"');
    console.log('   users表:');
    console.log('     id: "biz-456", username: "admin", email: "admin@example.com"');
    console.log('   passkeys表:');
    console.log('     user_id: "auth-123", device_type: "cross-platform"');
    console.log('');
    console.log('   关系链: user(id="auth-123") ← email:"admin@example.com" → users(username="admin")');
    console.log('           user(id="auth-123") ← user_id:"auth-123" → passkeys(device_type="cross-platform")');
    
    console.log('\n✨ 架构优势:');
    console.log('   • 认证与业务解耦: Better Auth负责认证，业务表负责权限');
    console.log('   • 生物识别支持: 通过passkeys表实现WebAuthn标准');
    console.log('   • 数据同步机制: email字段作为两套系统的桥梁');
    console.log('   • 安全性保障: RLS策略通过partner_id实现数据隔离');
    
    console.log('\n✅ 表关系演示完成!');

  } catch (error) {
    console.error('❌ 演示过程中出错:', error);
  } finally {
    await client.end();
    console.log('🔒 数据库连接已关闭');
  }
}

demonstrateTableRelationships();
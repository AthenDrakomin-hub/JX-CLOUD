#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function addMissingField() {
  console.log('🔍 检查并添加缺失的 is_passkey_bound 字段...\n');
  
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
    // 1. 首先检查字段是否已存在
    console.log('📋 检查 users 表结构...');
    
    const columnCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_passkey_bound'
    `;
    
    const columnExists = await db.execute(columnCheckQuery);
    
    if (columnExists.length > 0) {
      console.log('✅ 字段 is_passkey_bound 已存在，无需添加');
      return;
    }
    
    console.log('❌ 字段 is_passkey_bound 不存在，准备添加...');
    
    // 2. 安全地添加字段
    console.log('➕ 正在添加 is_passkey_bound 字段...');
    
    const addColumnQuery = `
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "is_passkey_bound" BOOLEAN DEFAULT FALSE
    `;
    
    await db.execute(addColumnQuery);
    console.log('✅ 字段添加成功!');
    
    // 3. 验证字段已正确添加
    console.log('🔍 验证新字段...');
    
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_passkey_bound'
    `;
    
    const verification = await db.execute(verifyQuery);
    
    if (verification.length > 0) {
      const col = verification[0];
      console.log(`✅ 验证成功:`);
      console.log(`   字段名: ${col.column_name}`);
      console.log(`   数据类型: ${col.data_type}`);
      console.log(`   可空: ${col.is_nullable}`);
      console.log(`   默认值: ${col.column_default}`);
    } else {
      console.error('❌ 字段验证失败');
      return;
    }
    
    // 4. 更新现有记录的默认值（如果需要）
    console.log('🔄 更新现有记录的默认值...');
    
    const updateQuery = `
      UPDATE "users" 
      SET "is_passkey_bound" = FALSE 
      WHERE "is_passkey_bound" IS NULL
    `;
    
    const updateResult = await db.execute(updateQuery);
    console.log(`✅ 更新了 ${updateResult.count || 0} 条记录`);
    
    // 5. 设置字段为非空（如果原设计需要）
    console.log('🔒 设置字段约束...');
    
    const setNotNullQuery = `
      ALTER TABLE "users" 
      ALTER COLUMN "is_passkey_bound" SET NOT NULL
    `;
    
    await db.execute(setNotNullQuery);
    console.log('✅ 字段约束设置完成');
    
    console.log('\n🎉 is_passkey_bound 字段添加完成!');
    console.log('📝 字段说明:');
    console.log('   - 名称: is_passkey_bound');
    console.log('   - 类型: BOOLEAN');
    console.log('   - 默认值: FALSE');
    console.log('   - 用途: 标记用户是否已绑定生物识别凭证');
    console.log('   - 解决问题: 修复认证流程中因字段缺失导致的SQL错误');

  } catch (error) {
    console.error('❌ 添加字段时出错:', error);
    
    // 如果是字段已存在的错误，给出友好提示
    if (error.message && error.message.includes('column "is_passkey_bound" of relation "users" already exists')) {
      console.log('💡 提示: 字段可能已在其他地方被添加，请重启应用验证');
    }
  } finally {
    await client.end();
    console.log('🔒 数据库连接已关闭');
  }
}

addMissingField();
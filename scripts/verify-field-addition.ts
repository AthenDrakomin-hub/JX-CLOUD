#!/usr/bin/env tsx
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function verifyFieldAddition() {
  console.log('🔍 验证 is_passkey_bound 字段添加结果...\n');
  
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
    // 验证字段是否存在
    console.log('📋 验证字段存在性...');
    
    const fieldCheckQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_passkey_bound'
    `;
    
    const fieldInfo = await db.execute(fieldCheckQuery);
    
    if (fieldInfo.length > 0) {
      const field = fieldInfo[0];
      console.log('✅ 字段验证通过:');
      console.log(`   字段名: ${field.column_name}`);
      console.log(`   数据类型: ${field.data_type}`);
      console.log(`   是否可空: ${field.is_nullable}`);
      console.log(`   默认值: ${field.column_default}`);
    } else {
      console.error('❌ 字段未找到!');
      return;
    }
    
    // 测试查询包含该字段的SQL
    console.log('\n🧪 测试包含新字段的查询...');
    
    const testQuery = `
      SELECT 
        id,
        username,
        email,
        is_passkey_bound
      FROM "users" 
      LIMIT 1
    `;
    
    try {
      const testResult = await db.execute(testQuery);
      console.log('✅ SQL查询测试成功!');
      if (testResult.length > 0) {
        console.log('   查询结果示例:');
        console.log(`     ID: ${testResult[0].id}`);
        console.log(`     用户名: ${testResult[0].username}`);
        console.log(`     邮箱: ${testResult[0].email}`);
        console.log(`     生物识别绑定状态: ${testResult[0].is_passkey_bound}`);
      }
    } catch (queryError) {
      console.error('❌ SQL查询测试失败:', queryError.message);
      return;
    }
    
    // 检查表的整体结构
    console.log('\n📊 users表完整结构:');
    
    const fullStructureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    const structure = await db.execute(fullStructureQuery);
    
    console.log('┌─────────────────────┬─────────────┬──────────┬──────────────┐');
    console.log('│ 字段名              │ 数据类型    │ 可空     │ 默认值       │');
    console.log('├─────────────────────┼─────────────┼──────────┼──────────────┤');
    
    structure.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '是' : '否';
      const defaultValue = col.column_default || 'NULL';
      console.log(`│ ${col.column_name.padEnd(19)} │ ${col.data_type.padEnd(11)} │ ${nullable.padEnd(8)} │ ${defaultValue.padEnd(12)} │`);
    });
    
    console.log('└─────────────────────┴─────────────┴──────────┴──────────────┘');
    
    console.log('\n✅ 字段添加验证完成!');
    console.log('💡 现在认证流程应该能正常工作，不会再出现SQL错误');

  } catch (error) {
    console.error('❌ 验证过程中出错:', error);
  } finally {
    await client.end();
    console.log('🔒 数据库连接已关闭');
  }
}

verifyFieldAddition();
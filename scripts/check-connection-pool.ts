// 检查数据库连接池状态和连接数
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkConnectionPoolStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔍 检查数据库连接池状态...\n');
    
    // 1. 检查基本连接
    console.log('1️⃣ 执行基础连接测试...');
    const result = await pool.query('SELECT 1 as connection_test');
    console.log('✅ 基础连接测试通过:', result.rows[0]);
    
    // 2. 检查活跃连接数
    console.log('\n2️⃣ 检查当前活跃连接数...');
    const connCount = await pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    console.log('📊 连接统计:');
    console.log('  总连接数:', connCount.rows[0].total_connections);
    console.log('  活跃连接数:', connCount.rows[0].active_connections);
    console.log('  空闲连接数:', connCount.rows[0].idle_connections);
    
    // 3. 检查字段一致性
    console.log('\n3️⃣ 检查 user 和 users 表字段一致性...');
    const fieldCheck = await pool.query(`
      SELECT 
        table_name,
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('user', 'users') 
      AND column_name IN ('role', 'email', 'partner_id')
      ORDER BY table_name, column_name
    `);
    
    console.log('📋 字段一致性检查结果:');
    fieldCheck.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    // 4. 验证关键字段是否存在
    console.log('\n4️⃣ 验证关键字段存在性...');
    const userFields = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name IN ('role', 'email', 'partner_id')
    `);
    
    const usersFields = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('role', 'email', 'partner_id')
    `);
    
    const userFieldNames = userFields.rows.map(r => r.column_name);
    const usersFieldNames = usersFields.rows.map(r => r.column_name);
    
    console.log('user 表关键字段:', userFieldNames);
    console.log('users 表关键字段:', usersFieldNames);
    
    const allRequiredFields = ['role', 'email', 'partner_id'];
    const userHasAll = allRequiredFields.every(field => userFieldNames.includes(field));
    const usersHasAll = allRequiredFields.every(field => usersFieldNames.includes(field));
    
    console.log('user 表字段完整性:', userHasAll ? '✅ 完整' : '❌ 缺失');
    console.log('users 表字段完整性:', usersHasAll ? '✅ 完整' : '❌ 缺失');
    
    // 5. 检查表结构差异
    console.log('\n5️⃣ 详细表结构对比...');
    const userSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user'
      ORDER BY ordinal_position
    `);
    
    const usersSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📄 user 表完整结构:');
    userSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    console.log('\n📄 users 表完整结构:');
    usersSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
  } catch (error: any) {
    console.error('❌ 连接池检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkConnectionPoolStatus();
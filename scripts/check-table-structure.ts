// 检查表结构的脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔍 检查数据库表结构...');
    
    // 检查 user 表结构
    console.log('\n📋 user 表结构:');
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      ORDER BY ordinal_position
    `);
    userColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // 检查 users 表结构
    console.log('\n📋 users 表结构:');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    usersColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // 查看现有的用户数据
    console.log('\n👥 现有用户数据:');
    const existingUsers = await pool.query('SELECT email, role, partner_id FROM users LIMIT 5');
    existingUsers.rows.forEach(user => {
      console.log(`  ${user.email} - Role: ${user.role}, Partner: ${user.partner_id}`);
    });
    
  } catch (error: any) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
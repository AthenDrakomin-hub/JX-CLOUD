// 验证最终权限状态
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function verifyFinalStatus() {
  const targetEmail = '2811284084@qq.com';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔍 最终权限状态验证\n');
    console.log('=' .repeat(50));
    
    // 检查认证表状态
    console.log('🔐 认证表 (user) 状态:');
    const authResult = await pool.query(
      'SELECT id, email, role, partner_id FROM "user" WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    console.log('  状态:', authResult.rows[0] || '❌ 未找到');
    
    // 检查业务表状态  
    console.log('\n💼 业务表 (users) 状态:');
    const bizResult = await pool.query(
      'SELECT id, email, role, partner_id, username, display_name FROM users WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    console.log('  状态:', bizResult.rows[0] || '❌ 未找到');
    
    // 与主账号对比
    console.log('\n📋 权限对比:');
    const rootResult = await pool.query(
      'SELECT role, partner_id FROM users WHERE email = $1 LIMIT 1',
      ['athendrakomin@proton.me']
    );
    
    const targetUser = bizResult.rows[0];
    const rootUser = rootResult.rows[0];
    
    console.log('目标账号 Role:', targetUser?.role || '❌ 未知');
    console.log('目标账号 Partner ID:', targetUser?.partner_id || '❌ 未知');
    console.log('主账号 Role:', rootUser?.role || '❌ 未知');
    console.log('主账号 Partner ID:', rootUser?.partner_id || '❌ 未知');
    
    // 权限一致性检查
    console.log('\n✅ 权限一致性检查:');
    const roleMatch = targetUser?.role === rootUser?.role;
    const partnerMatch = targetUser?.partner_id === rootUser?.partner_id;
    
    console.log('Role 匹配:', roleMatch ? '✅ 是' : '❌ 否');
    console.log('Partner ID 匹配:', partnerMatch ? '✅ 是' : '❌ 否');
    
    if (roleMatch && partnerMatch) {
      console.log('\n🎉 权限同步成功！');
      console.log('✅ 邮箱 2811284084@qq.com 已获得与主账号完全一致的管理员权限');
    } else {
      console.log('\n⚠️  权限尚未完全同步');
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error: any) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

verifyFinalStatus();
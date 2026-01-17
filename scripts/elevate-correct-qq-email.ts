// 为正确邮箱地址 2811284084@qq.com 执行提权操作
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function elevateCorrectQQEmail() {
  const correctEmail = '2811284084@qq.com';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log(`🚀 为正确邮箱 ${correctEmail} 执行提权操作...\n`);
    
    // 首先检查当前状态
    console.log('🔍 当前用户状态检查:');
    
    // 检查认证表
    const authCheck = await pool.query(
      'SELECT id, email, role, partner_id FROM "user" WHERE email = $1 LIMIT 1',
      [correctEmail]
    );
    console.log('认证表状态:', authCheck.rows[0] || '未找到');
    
    // 检查业务表
    const bizCheck = await pool.query(
      'SELECT id, email, role, partner_id, username, display_name FROM users WHERE email = $1 LIMIT 1',
      [correctEmail]
    );
    console.log('业务表状态:', bizCheck.rows[0] || '未找到');
    
    console.log('\n⚡ 执行提权操作...\n');
    
    // 更新认证表 - 确保是admin角色
    console.log('🔐 更新认证表权限:');
    const authUpdate = await pool.query(
      `UPDATE "user" 
       SET role = 'admin', partner_id = 'SYSTEM_ADMIN', updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, role, partner_id`,
      [correctEmail]
    );
    
    if (authUpdate.rowCount > 0) {
      console.log('✅ 认证表更新成功:', authUpdate.rows[0]);
    } else {
      console.log('📝 认证表中未找到，正在创建...');
      const authInsert = await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, role, partner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, email, role, partner_id`,
        [`user-${Date.now()}`, 'QQ邮箱管理员', correctEmail, true, 'admin', 'SYSTEM_ADMIN']
      );
      console.log('✅ 认证表创建成功:', authInsert.rows[0]);
    }
    
    // 更新业务表 - 确保是admin角色且partner_id为SYSTEM_ADMIN
    console.log('\n💼 更新业务表权限:');
    const bizUpdate = await pool.query(
      `UPDATE users 
       SET role = 'admin', partner_id = 'SYSTEM_ADMIN', is_active = true
       WHERE email = $1
       RETURNING id, email, role, partner_id, username, display_name`,
      [correctEmail]
    );
    
    if (bizUpdate.rowCount > 0) {
      console.log('✅ 业务表更新成功:', bizUpdate.rows[0]);
    } else {
      console.log('📝 业务表中未找到，正在创建...');
      const bizInsert = await pool.query(
        `INSERT INTO users (id, username, email, name, role, partner_id, is_active, display_name, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, email, role, partner_id, username, display_name`,
        [
          `user-${Date.now()}-biz`, 
          'qq-email-admin', 
          correctEmail, 
          'QQ邮箱管理员', 
          'admin', 
          'SYSTEM_ADMIN', 
          true, 
          'QQ邮箱系统管理员'
        ]
      );
      console.log('✅ 业务表创建成功:', bizInsert.rows[0]);
    }
    
    // 最终验证
    console.log('\n' + '='.repeat(50));
    console.log('✅ 最终验证结果:');
    console.log('='.repeat(50));
    
    const finalAuth = await pool.query(
      'SELECT id, email, role, partner_id FROM "user" WHERE email = $1 LIMIT 1',
      [correctEmail]
    );
    
    const finalBiz = await pool.query(
      'SELECT id, email, role, partner_id, username, display_name FROM users WHERE email = $1 LIMIT 1',
      [correctEmail]
    );
    
    console.log(`\n📧 邮箱地址: ${correctEmail}`);
    console.log('\n🔐 认证表最终状态:');
    console.log('  Role:', finalAuth.rows[0]?.role || '❌ 未知');
    console.log('  Partner ID:', finalAuth.rows[0]?.partner_id || '❌ 未知');
    console.log('  ID:', finalAuth.rows[0]?.id || '❌ 未知');
    
    console.log('\n💼 业务表最终状态:');
    console.log('  Role:', finalBiz.rows[0]?.role || '❌ 未知');
    console.log('  Partner ID:', finalBiz.rows[0]?.partner_id || '❌ 未知');
    console.log('  Username:', finalBiz.rows[0]?.username || '❌ 未知');
    console.log('  Display Name:', finalBiz.rows[0]?.display_name || '❌ 未知');
    
    // 与主账号对比
    console.log('\n📋 与主账号权限对比:');
    const rootUser = await pool.query(
      'SELECT role, partner_id FROM users WHERE email = $1 LIMIT 1',
      ['athendrakomin@proton.me']
    );
    
    console.log('主账号 Role:', rootUser.rows[0]?.role);
    console.log('主账号 Partner ID:', rootUser.rows[0]?.partner_id);
    console.log('当前账号 Role:', finalBiz.rows[0]?.role);
    console.log('当前账号 Partner ID:', finalBiz.rows[0]?.partner_id);
    
    console.log('\n🎉 提权操作完成！');
    console.log('✅ 邮箱 2811284084@qq.com 已获得系统管理员权限');
    
  } catch (error: any) {
    console.error('❌ 提权操作失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

elevateCorrectQQEmail();
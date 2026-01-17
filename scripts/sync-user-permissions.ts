// 验证和同步用户权限的脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function verifyAndSyncUserPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔍 验证用户权限同步状态...\n');
    
    // 查找所有相关用户
    const userEmails = [
      '2811284084qq.com',
      '2811284084@qq.com', 
      'athendrakomin@proton.me'
    ];
    
    console.log('📋 用户权限状态检查:');
    console.log('=' .repeat(50));
    
    for (const email of userEmails) {
      console.log(`\n📧 邮箱: ${email}`);
      
      // 检查认证表 (user)
      const authResult = await pool.query(
        'SELECT id, email, role, partner_id FROM "user" WHERE email = $1 LIMIT 1',
        [email]
      );
      
      // 检查业务表 (users)  
      const bizResult = await pool.query(
        'SELECT id, email, role, partner_id, username, display_name FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      
      console.log('  认证表 (user):', authResult.rows[0] || '❌ 未找到');
      console.log('  业务表 (users):', bizResult.rows[0] || '❌ 未找到');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 权限同步操作:');
    console.log('='.repeat(50));
    
    // 为目标邮箱执行同步操作
    const targetEmail = '2811284084qq.com';
    
    // 更新认证表
    console.log(`\n🔐 更新认证表权限 (${targetEmail}):`);
    const updateAuth = await pool.query(
      `UPDATE "user" 
       SET role = 'admin', partner_id = 'SYSTEM_ADMIN', updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, role, partner_id`,
      [targetEmail]
    );
    
    if (updateAuth.rowCount > 0) {
      console.log('  ✅ 认证表更新成功:', updateAuth.rows[0]);
    } else {
      console.log('  ℹ️  认证表中未找到该用户，正在创建...');
      const insertAuth = await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, role, partner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, email, role, partner_id`,
        [`user-${Date.now()}`, 'QQ管理员', targetEmail, true, 'admin', 'SYSTEM_ADMIN']
      );
      console.log('  ✅ 认证表创建成功:', insertAuth.rows[0]);
    }
    
    // 更新业务表
    console.log(`\n💼 更新业务表权限 (${targetEmail}):`);
    const updateBiz = await pool.query(
      `UPDATE users 
       SET role = 'admin', partner_id = 'SYSTEM_ADMIN', is_active = true
       WHERE email = $1
       RETURNING id, email, role, partner_id, username, display_name`,
      [targetEmail]
    );
    
    if (updateBiz.rowCount > 0) {
      console.log('  ✅ 业务表更新成功:', updateBiz.rows[0]);
    } else {
      console.log('  ℹ️  业务表中未找到该用户，正在创建...');
      const insertBiz = await pool.query(
        `INSERT INTO users (id, username, email, name, role, partner_id, is_active, display_name, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, email, role, partner_id, username, display_name`,
        [
          `user-${Date.now()}-biz`, 
          'qqadmin', 
          targetEmail, 
          'QQ管理员', 
          'admin', 
          'SYSTEM_ADMIN', 
          true, 
          'QQ系统管理员'
        ]
      );
      console.log('  ✅ 业务表创建成功:', insertBiz.rows[0]);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 最终验证结果:');
    console.log('='.repeat(50));
    
    // 最终验证
    const finalAuth = await pool.query(
      'SELECT id, email, role, partner_id FROM "user" WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    
    const finalBiz = await pool.query(
      'SELECT id, email, role, partner_id, username, display_name FROM users WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    
    console.log(`\n📧 目标邮箱: ${targetEmail}`);
    console.log('🔐 认证表状态:');
    console.log('  Role:', finalAuth.rows[0]?.role || '❌ 未知');
    console.log('  Partner ID:', finalAuth.rows[0]?.partner_id || '❌ 未知');
    console.log('  ID:', finalAuth.rows[0]?.id || '❌ 未知');
    
    console.log('\n💼 业务表状态:');
    console.log('  Role:', finalBiz.rows[0]?.role || '❌ 未知');
    console.log('  Partner ID:', finalBiz.rows[0]?.partner_id || '❌ 未知');
    console.log('  Username:', finalBiz.rows[0]?.username || '❌ 未知');
    console.log('  Display Name:', finalBiz.rows[0]?.display_name || '❌ 未知');
    
    console.log('\n🎉 权限同步完成！');
    console.log('✅ 目标邮箱已获得系统管理员权限');
    
  } catch (error: any) {
    console.error('❌ 操作失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

verifyAndSyncUserPermissions();
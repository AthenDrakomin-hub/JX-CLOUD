// 直接使用环境变量的提权脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('🚀 执行QQ邮箱提权操作 (直接连接模式)...');

async function executeDirectPrivilegeEscalation() {
  const targetEmail = '2811284084qq.com';
  const rootEmail = 'athendrakomin@proton.me';
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log(`🔍 检查目标邮箱 ${targetEmail} 的当前状态...`);
    
    // 1. 检查认证表(user)中的状态
    console.log('\n📋 认证表(user)状态:');
    const authResult = await pool.query(
      'SELECT * FROM "user" WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    console.log('认证表记录:', authResult.rows[0] || '未找到');
    
    // 2. 检查业务表(users)中的状态
    console.log('\n📋 业务表(users)状态:');
    const bizResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    console.log('业务表记录:', bizResult.rows[0] || '未找到');
    
    // 3. 检查主账号状态作为参考
    console.log('\n📋 主账号参考状态:');
    const rootAuthResult = await pool.query(
      'SELECT * FROM "user" WHERE email = $1 LIMIT 1',
      [rootEmail]
    );
    const rootBizResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [rootEmail]
    );
    console.log('主账号认证表:', rootAuthResult.rows[0]);
    console.log('主账号业务表:', rootBizResult.rows[0]);
    
    // 4. 执行提权操作
    console.log('\n⚡ 执行提权操作...');
    
    // 处理认证表
    if (authResult.rows.length === 0) {
      console.log('📝 在认证表中创建用户记录...');
      await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [`user-${Date.now()}`, 'QQ管理员', targetEmail, true, 'admin']
      );
      console.log('✅ 认证表用户创建完成');
    } else {
      console.log('📝 更新认证表用户角色...');
      await pool.query(
        'UPDATE "user" SET role = $1, updated_at = NOW() WHERE email = $2',
        ['admin', targetEmail]
      );
      console.log('✅ 认证表角色更新完成');
    }
    
    // 处理业务表
    if (bizResult.rows.length === 0) {
      console.log('📝 在业务表中创建用户记录...');
      const modulePermissions = rootBizResult.rows[0]?.module_permissions || '{}';
      await pool.query(
        `INSERT INTO users (id, username, email, name, role, partner_id, module_permissions) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`user-${Date.now()}-biz`, 'qqadmin', targetEmail, 'QQ管理员', 'admin', null, modulePermissions]
      );
      console.log('✅ 业务表用户创建完成');
    } else {
      console.log('📝 更新业务表用户权限...');
      const modulePermissions = rootBizResult.rows[0]?.module_permissions || '{}';
      await pool.query(
        'UPDATE users SET role = $1, partner_id = $2, module_permissions = $3 WHERE email = $4',
        ['admin', null, modulePermissions, targetEmail]
      );
      console.log('✅ 业务表权限更新完成');
    }
    
    // 5. 验证结果
    console.log('\n✅ 提权操作完成！正在验证结果...');
    
    console.log('\n📋 最终状态验证:');
    const finalAuth = await pool.query(
      'SELECT * FROM "user" WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    const finalBiz = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [targetEmail]
    );
    
    console.log('🔐 认证表最终状态:');
    console.log('  Email:', finalAuth.rows[0]?.email);
    console.log('  Role:', finalAuth.rows[0]?.role);
    console.log('  ID:', finalAuth.rows[0]?.id);
    
    console.log('\n💼 业务表最终状态:');
    console.log('  Email:', finalBiz.rows[0]?.email);
    console.log('  Role:', finalBiz.rows[0]?.role);
    console.log('  Partner ID:', finalBiz.rows[0]?.partner_id);
    console.log('  Username:', finalBiz.rows[0]?.username);
    
    // 6. 显示主账号对比
    console.log('\n📋 主账号对比:');
    const finalRootAuth = await pool.query(
      'SELECT * FROM "user" WHERE email = $1 LIMIT 1',
      [rootEmail]
    );
    const finalRootBiz = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [rootEmail]
    );
    
    console.log('主账号认证表 Role:', finalRootAuth.rows[0]?.role);
    console.log('主账号业务表 Role:', finalRootBiz.rows[0]?.role);
    console.log('主账号业务表 Partner ID:', finalRootBiz.rows[0]?.partner_id);
    
    console.log('\n🎉 提权操作成功完成！');
    console.log('✅ QQ邮箱账号已获得与主账号相同的管理员权限');
    
  } catch (error: any) {
    console.error('❌ 提权操作失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeDirectPrivilegeEscalation();
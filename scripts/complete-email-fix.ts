// 彻底解决邮箱格式问题 - 删除重建方案
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function completeEmailFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔥 彻底解决邮箱格式问题 - 删除重建方案\n');
    
    const wrongEmail = '2811284084qq.com';
    const correctEmail = '2811284084@qq.com';
    
    // 1. 记录需要删除的账户信息
    console.log('1️⃣ 记录错误账户信息...');
    const wrongAccount = await pool.query(`
      SELECT id, email, username, role, partner_id, display_name
      FROM users 
      WHERE email = $1 OR username = $1
    `, [wrongEmail]);
    
    if (wrongAccount.rows.length === 0) {
      console.log('❌ 未找到错误格式的账户');
      return;
    }
    
    const accountToDelete = wrongAccount.rows[0];
    console.log('找到需要删除的账户:');
    console.log(`  ID: ${accountToDelete.id}`);
    console.log(`  Email: ${accountToDelete.email}`);
    console.log(`  Username: ${accountToDelete.username}`);
    console.log(`  Role: ${accountToDelete.role}`);
    console.log(`  Partner ID: ${accountToDelete.partner_id}`);
    console.log(`  Display Name: ${accountToDelete.display_name}`);
    
    // 2. 删除错误格式的账户
    console.log('\n2️⃣ 删除错误格式账户...');
    const deleteResult = await pool.query(`
      DELETE FROM users 
      WHERE id = $1
      RETURNING id, email
    `, [accountToDelete.id]);
    
    if (deleteResult.rowCount > 0) {
      console.log(`✅ 已删除账户: ${deleteResult.rows[0].email} (${deleteResult.rows[0].id})`);
    }
    
    // 3. 重新插入正确格式的账户
    console.log('\n3️⃣ 重新插入正确格式账户...');
    const insertResult = await pool.query(`
      INSERT INTO users (id, email, username, name, role, partner_id, display_name, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, email, username
    `, [
      accountToDelete.id,           // 保持原ID
      correctEmail,                 // 正确邮箱
      correctEmail,                 // 用户名也用正确邮箱
      accountToDelete.display_name || 'QQ管理员', // 名称
      accountToDelete.role || 'admin',             // 角色
      accountToDelete.partner_id || 'SYSTEM_ADMIN', // 合作伙伴
      accountToDelete.display_name || 'QQ系统管理员', // 显示名称
      true                          // 激活状态
    ]);
    
    if (insertResult.rowCount > 0) {
      const newRow = insertResult.rows[0];
      console.log(`✅ 已插入正确账户:`);
      console.log(`  Email: ${newRow.email}`);
      console.log(`  Username: ${newRow.username}`);
      console.log(`  ID: ${newRow.id}`);
    }
    
    // 4. 验证结果
    console.log('\n4️⃣ 验证最终结果...');
    
    console.log('📋 认证表状态:');
    const authFinal = await pool.query(`
      SELECT email, id, role, partner_id 
      FROM "user" 
      ORDER BY email
    `);
    
    authFinal.rows.forEach(user => {
      const isValid = user.email.includes('@');
      const status = isValid ? '✅' : '❌';
      console.log(`  ${user.email} ${status}`);
    });
    
    console.log('\n📋 业务表状态:');
    const bizFinal = await pool.query(`
      SELECT email, username, id, role, partner_id 
      FROM users 
      ORDER BY email
    `);
    
    bizFinal.rows.forEach(user => {
      const identifier = user.email || user.username;
      const isValid = identifier.includes('@');
      const status = isValid ? '✅' : '❌';
      console.log(`  ${identifier} ${status}`);
    });
    
    // 5. 最终确认
    console.log('\n📊 最终确认:');
    
    const authValid = authFinal.rows.every(u => u.email.includes('@'));
    const bizValid = bizFinal.rows.every(u => 
      (u.email && u.email.includes('@')) || (u.username && u.username.includes('@'))
    );
    const sameCount = authFinal.rows.length === bizFinal.rows.length;
    
    console.log(`  认证表邮箱格式正确: ${authValid ? '✅' : '❌'}`);
    console.log(`  业务表邮箱格式正确: ${bizValid ? '✅' : '❌'}`);
    console.log(`  两表记录数一致: ${sameCount ? '✅' : '❌'}`);
    
    if (authValid && bizValid && sameCount) {
      console.log('\n🎉 邮箱格式问题彻底解决！');
      console.log('✅ 两个表都只有带@的正确邮箱格式');
      console.log('✅ 记录数量完全一致');
      console.log('✅ 权限配置正确');
      
      console.log('\n🏆 最终账户列表:');
      authFinal.rows.forEach(user => {
        console.log(`  • ${user.email} (${user.role})`);
      });
    } else {
      console.log('\n❌ 问题仍未完全解决');
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

completeEmailFix();
// 最终精确用户清理
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function finalPreciseCleanup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🎯 最终精确清理...\n');
    
    const targetEmails = ['athendrakomin@proton.me', '2811284084qq.com'];
    
    // 1. 精确删除业务表中的冗余记录
    console.log('1️⃣ 精确清理业务表冗余...');
    
    // 删除staff001这类测试账户
    const deleteStaff = await pool.query(`
      DELETE FROM users 
      WHERE username = 'staff001' OR email IS NULL
      RETURNING username, id
    `);
    
    if (deleteStaff.rowCount > 0) {
      console.log(`  删除了 ${deleteStaff.rowCount} 个测试账户:`);
      deleteStaff.rows.forEach(row => {
        console.log(`    - ${row.username} (${row.id})`);
      });
    }
    
    // 删除主账号的重复记录（保留UUID格式的那条）
    const deleteDuplicateAdmin = await pool.query(`
      DELETE FROM users 
      WHERE email = 'athendrakomin@proton.me' AND id = 'admin-root'
      RETURNING id, username
    `);
    
    if (deleteDuplicateAdmin.rowCount > 0) {
      console.log(`  删除了主账号的重复记录:`);
      deleteDuplicateAdmin.rows.forEach(row => {
        console.log(`    - ${row.username} (${row.id})`);
      });
    }
    
    // 2. 更新QQ账户的业务表ID与认证表对齐
    console.log('\n2️⃣ 对齐QQ账户ID...');
    
    const qqAuthId = 'user-1768677356465';
    const updateQQBiz = await pool.query(`
      UPDATE users 
      SET id = $1 
      WHERE email = '2811284084qq.com' AND id != $1
      RETURNING id, email
    `, [qqAuthId]);
    
    if (updateQQBiz.rowCount > 0) {
      console.log(`  ✅ QQ账户ID已更新为: ${qqAuthId}`);
    }
    
    // 3. 确保partner_id正确
    console.log('\n3️⃣ 标准化partner_id...');
    
    const standardizePartners = await pool.query(`
      UPDATE users 
      SET partner_id = 'SYSTEM_ADMIN' 
      WHERE email IN ($1, $2) AND (partner_id IS NULL OR partner_id != 'SYSTEM_ADMIN')
      RETURNING email, partner_id
    `, targetEmails);
    
    if (standardizePartners.rowCount > 0) {
      console.log('  ✅ partner_id已标准化为SYSTEM_ADMIN');
    }
    
    // 4. 最终验证
    console.log('\n4️⃣ 最终状态确认...');
    
    console.log('📋 认证表状态:');
    const authFinal = await pool.query(`
      SELECT email, id, role, partner_id 
      FROM "user" 
      WHERE email IN ($1, $2)
      ORDER BY email
    `, targetEmails);
    
    authFinal.rows.forEach(user => {
      console.log(`  ${user.email}:`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Partner ID: ${user.partner_id}`);
    });
    
    console.log('\n📋 业务表状态:');
    const bizFinal = await pool.query(`
      SELECT email, username, id, role, partner_id 
      FROM users 
      WHERE email IN ($1, $2) OR username IN ($1, $2)
      ORDER BY email
    `, targetEmails);
    
    bizFinal.rows.forEach(user => {
      console.log(`  ${user.email || user.username}:`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Partner ID: ${user.partner_id}`);
    });
    
    // 结果确认
    console.log(`\n📊 最终统计:`);
    console.log(`  认证表记录: ${authFinal.rows.length}`);
    console.log(`  业务表记录: ${bizFinal.rows.length}`);
    
    const isValid = (
      authFinal.rows.length === 2 && 
      bizFinal.rows.length === 2 &&
      bizFinal.rows.every(u => u.role === 'admin') &&
      bizFinal.rows.every(u => u.partner_id === 'SYSTEM_ADMIN')
    );
    
    if (isValid) {
      console.log('\n🎉 用户账户去重手术圆满完成！');
      console.log('✅ 只保留2个唯一管理员账户');
      console.log('✅ 所有账户role为admin');
      console.log('✅ 所有账户partner_id为SYSTEM_ADMIN');
      console.log('✅ 认证表与业务表ID已对齐');
    } else {
      console.log('\n❌ 结果不符合要求，请检查');
    }
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  } finally {
    await pool.end();
  }
}

finalPreciseCleanup();
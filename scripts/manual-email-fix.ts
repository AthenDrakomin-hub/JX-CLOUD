// 手动修正业务表中的邮箱格式
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function manualEmailFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔧 手动修正业务表邮箱格式...\n');
    
    const wrongEmail = '2811284084qq.com';
    const correctEmail = '2811284084@qq.com';
    
    // 直接执行更新，绕过可能的触发器问题
    console.log(`将业务表中的 ${wrongEmail} 更新为 ${correctEmail}...`);
    
    // 先检查是否存在
    const checkExist = await pool.query(
      'SELECT id, email, username FROM users WHERE email = $1 OR username = $1',
      [wrongEmail]
    );
    
    if (checkExist.rows.length > 0) {
      console.log('找到需要修正的记录:');
      checkExist.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Email: ${row.email}, Username: ${row.username}`);
      });
      
      // 执行更新
      console.log('\n执行更新...');
      const updateResult = await pool.query(`
        UPDATE users 
        SET email = $1, username = $1
        WHERE email = $2 OR username = $2
        RETURNING id, email, username
      `, [correctEmail, wrongEmail]);
      
      if (updateResult.rowCount > 0) {
        console.log('✅ 更新成功:');
        updateResult.rows.forEach(row => {
          console.log(`  ${row.email} (${row.username})`);
        });
      }
    } else {
      console.log('未找到需要修正的记录');
    }
    
    // 验证最终结果
    console.log('\n🔍 验证最终结果...');
    
    const finalCheck = await pool.query(`
      SELECT email, username, id, role, partner_id 
      FROM users 
      ORDER BY email, username
    `);
    
    console.log('📋 业务表最终状态:');
    finalCheck.rows.forEach((user, index) => {
      const identifier = user.email || user.username;
      const isValid = identifier.includes('@');
      const status = isValid ? '✅' : '❌';
      console.log(`${index + 1}. ${identifier} ${status}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
    });
    
    // 统计
    const validCount = finalCheck.rows.filter(u => 
      (u.email && u.email.includes('@')) || (u.username && u.username.includes('@'))
    ).length;
    
    console.log(`\n📊 最终统计: ${validCount}/${finalCheck.rows.length} 个有效邮箱`);
    
    if (validCount === finalCheck.rows.length) {
      console.log('\n🎉 邮箱格式修正圆满完成！');
      console.log('✅ 所有邮箱都包含@符号');
    } else {
      console.log('\n❌ 仍有邮箱格式问题');
    }
    
  } catch (error) {
    console.error('❌ 修正失败:', error.message);
  } finally {
    await pool.end();
  }
}

manualEmailFix();
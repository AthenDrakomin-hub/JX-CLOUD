// 修正邮箱格式错误
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function fixEmailFormat() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔧 修正邮箱格式错误...\n');
    
    const wrongEmail = '2811284084qq.com';
    const correctEmail = '2811284084@qq.com';
    
    console.log(`将 ${wrongEmail} 修正为 ${correctEmail}\n`);
    
    // 1. 修正认证表中的邮箱
    console.log('1️⃣ 修正认证表邮箱...');
    const authUpdate = await pool.query(`
      UPDATE "user" 
      SET email = $1 
      WHERE email = $2
      RETURNING id, email
    `, [correctEmail, wrongEmail]);
    
    if (authUpdate.rowCount > 0) {
      console.log(`  ✅ 认证表邮箱已修正: ${authUpdate.rows[0].email}`);
    } else {
      console.log('  ℹ️  认证表中未找到该邮箱');
    }
    
    // 2. 修正业务表中的邮箱
    console.log('\n2️⃣ 修正业务表邮箱...');
    const bizUpdate = await pool.query(`
      UPDATE users 
      SET email = $1 
      WHERE email = $2
      RETURNING id, email, username
    `, [correctEmail, wrongEmail]);
    
    if (bizUpdate.rowCount > 0) {
      bizUpdate.rows.forEach(row => {
        console.log(`  ✅ 业务表邮箱已修正: ${row.email || row.username}`);
      });
    } else {
      console.log('  ℹ️  业务表中未找到该邮箱');
    }
    
    // 3. 验证修正结果
    console.log('\n3️⃣ 验证修正结果...');
    
    console.log('📋 认证表状态:');
    const authCheck = await pool.query(`
      SELECT email, id, role, partner_id 
      FROM "user" 
      ORDER BY email
    `);
    
    authCheck.rows.forEach(user => {
      const status = user.email.includes('@') ? '✅' : '❌';
      console.log(`  ${user.email} ${status}`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Role: ${user.role}`);
    });
    
    console.log('\n📋 业务表状态:');
    const bizCheck = await pool.query(`
      SELECT email, username, id, role, partner_id 
      FROM users 
      ORDER BY email, username
    `);
    
    bizCheck.rows.forEach(user => {
      const identifier = user.email || user.username;
      const status = identifier.includes('@') ? '✅' : '❌';
      console.log(`  ${identifier} ${status}`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Role: ${user.role}`);
    });
    
    // 4. 最终确认
    console.log('\n📊 最终确认:');
    const validEmails = authCheck.rows.filter(u => u.email.includes('@')).length;
    const validBizEmails = bizCheck.rows.filter(u => 
      (u.email && u.email.includes('@')) || (u.username && u.username.includes('@'))
    ).length;
    
    console.log(`  认证表有效邮箱数: ${validEmails}/2`);
    console.log(`  业务表有效邮箱数: ${validBizEmails}/2`);
    
    if (validEmails === 2 && validBizEmails === 2) {
      console.log('\n🎉 邮箱格式修正完成！');
      console.log('✅ 所有邮箱都包含@符号');
      console.log('✅ 账户体系完整');
    } else {
      console.log('\n⚠️ 仍有邮箱格式问题');
    }
    
  } catch (error) {
    console.error('❌ 修正失败:', error.message);
  } finally {
    await pool.end();
  }
}

fixEmailFormat();
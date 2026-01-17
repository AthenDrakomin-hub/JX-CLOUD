// 用户账户去重手术 - 第一步：现状调查
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function investigateUserAccounts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 用户账户现状调查...\n');
    
    // 1. 检查认证表(user)中的账户
    console.log('📋 认证表(user)账户列表:');
    const authUsers = await pool.query(`
      SELECT id, email, name, role, partner_id, created_at
      FROM "user"
      ORDER BY email, created_at
    `);
    
    authUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // 2. 检查业务表(users)中的账户
    console.log('📋 业务表(users)账户列表:');
    const bizUsers = await pool.query(`
      SELECT id, email, username, name, role, partner_id, display_name, created_at
      FROM users
      ORDER BY email, created_at
    `);
    
    bizUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
      console.log(`   Display Name: ${user.display_name}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // 3. 识别目标账户
    console.log('🎯 目标保留账户:');
    const targetEmails = ['athendrakomin@proton.me', '2811284084qq.com'];
    
    for (const email of targetEmails) {
      console.log(`\n📧 ${email}:`);
      
      // 认证表中的记录
      const authRecord = authUsers.rows.find(u => u.email === email);
      if (authRecord) {
        console.log(`  认证表 ID: ${authRecord.id}`);
      } else {
        console.log(`  认证表: ❌ 未找到`);
      }
      
      // 业务表中的记录
      const bizRecords = bizUsers.rows.filter(u => u.email === email);
      if (bizRecords.length > 0) {
        console.log(`  业务表记录数: ${bizRecords.length}`);
        bizRecords.forEach((record, i) => {
          console.log(`    ${i + 1}. ID: ${record.id} (Created: ${record.created_at})`);
        });
      } else {
        console.log(`  业务表: ❌ 未找到`);
      }
    }
    
    // 4. 识别需要删除的冗余账户
    console.log('\n🗑️ 需要删除的冗余账户:');
    
    // 认证表中的冗余账户
    const redundantAuth = authUsers.rows.filter(u => 
      !targetEmails.includes(u.email) || 
      (targetEmails.includes(u.email) && u.email === 'athendrakomin@proton.me' && !u.id.startsWith('user-'))
    );
    
    if (redundantAuth.length > 0) {
      console.log('认证表冗余账户:');
      redundantAuth.forEach(user => {
        const reason = !targetEmails.includes(user.email) ? '非目标邮箱' : 'ID格式不正确';
        console.log(`  - ${user.email} (${user.id}) - ${reason}`);
      });
    }
    
    // 业务表中的冗余账户
    const redundantBiz = bizUsers.rows.filter(u => !targetEmails.includes(u.email));
    if (redundantBiz.length > 0) {
      console.log('业务表冗余账户:');
      redundantBiz.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 调查失败:', error.message);
  } finally {
    await pool.end();
  }
}

investigateUserAccounts();
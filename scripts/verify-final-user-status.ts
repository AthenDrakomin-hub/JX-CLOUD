// 验证最终用户账户状态
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function verifyFinalUserStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 验证最终用户账户状态...\n');
    
    const targetEmails = ['athendrakomin@proton.me', '2811284084qq.com'];
    
    // 检查认证表状态
    console.log('📋 认证表(user)状态:');
    const authUsers = await pool.query(`
      SELECT email, id, role, partner_id, created_at
      FROM "user"
      ORDER BY email
    `);
    
    authUsers.rows.forEach((user, index) => {
      const isTarget = targetEmails.includes(user.email);
      console.log(`${index + 1}. ${user.email} ${isTarget ? '✅' : '❌'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // 检查业务表状态
    console.log('📋 业务表(users)状态:');
    const bizUsers = await pool.query(`
      SELECT email, username, id, role, partner_id, display_name, created_at
      FROM users
      ORDER BY email, username
    `);
    
    bizUsers.rows.forEach((user, index) => {
      const identifier = user.email || user.username;
      const isTarget = targetEmails.includes(user.email) || targetEmails.includes(user.username);
      console.log(`${index + 1}. ${identifier} ${isTarget ? '✅' : '❌'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
      console.log(`   Display Name: ${user.display_name || 'N/A'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // 统计分析
    console.log('📊 统计分析:');
    console.log(`  认证表总记录数: ${authUsers.rows.length}`);
    console.log(`  业务表总记录数: ${bizUsers.rows.length}`);
    
    const targetAuth = authUsers.rows.filter(u => targetEmails.includes(u.email));
    const targetBiz = bizUsers.rows.filter(u => 
      targetEmails.includes(u.email) || targetEmails.includes(u.username)
    );
    
    console.log(`  目标认证记录数: ${targetAuth.length}`);
    console.log(`  目标业务记录数: ${targetBiz.length}`);
    
    // 验证要求
    console.log('\n📋 要求验证:');
    
    const bizCountCorrect = targetBiz.length === 2;
    const allAdmin = targetBiz.every(u => u.role === 'admin');
    const correctPartner = targetBiz.every(u => 
      u.partner_id === null || u.partner_id === 'SYSTEM_ADMIN'
    );
    
    console.log(`  ✅ 只保留2个账户: ${bizCountCorrect ? '是' : '否'}`);
    console.log(`  ✅ Role全部为admin: ${allAdmin ? '是' : '否'}`);
    console.log(`  ✅ Partner ID正确: ${correctPartner ? '是' : '否'}`);
    
    if (bizCountCorrect && allAdmin && correctPartner) {
      console.log('\n🎉 账户去重手术成功完成！');
      console.log('✅ 符合所有要求');
      
      // 显示最终的两个账户
      console.log('\n🏆 最终保留的两个管理员账户:');
      targetBiz.forEach(user => {
        const identifier = user.email || user.username;
        console.log(`  • ${identifier}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    Partner ID: ${user.partner_id}`);
        console.log(`    ID: ${user.id}`);
      });
    } else {
      console.log('\n❌ 未完全符合要求');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

verifyFinalUserStatus();
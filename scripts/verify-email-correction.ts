// 验证邮箱格式修正结果
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function verifyEmailCorrection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 验证邮箱格式修正结果...\n');
    
    // 检查所有用户邮箱格式
    console.log('📋 所有用户邮箱状态:');
    
    // 认证表检查
    console.log('\n🔐 认证表(user):');
    const authUsers = await pool.query(`
      SELECT email, id, role, partner_id 
      FROM "user" 
      ORDER BY email
    `);
    
    authUsers.rows.forEach((user, index) => {
      const isValid = user.email.includes('@');
      const status = isValid ? '✅' : '❌';
      console.log(`${index + 1}. ${user.email} ${status}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
    });
    
    // 业务表检查
    console.log('\n💼 业务表(users):');
    const bizUsers = await pool.query(`
      SELECT email, username, id, role, partner_id 
      FROM users 
      ORDER BY email, username
    `);
    
    bizUsers.rows.forEach((user, index) => {
      const identifier = user.email || user.username;
      const isValid = identifier.includes('@');
      const status = isValid ? '✅' : '❌';
      console.log(`${index + 1}. ${identifier} ${status}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Partner ID: ${user.partner_id}`);
    });
    
    // 统计分析
    console.log('\n📊 格式验证统计:');
    
    const authWithEmail = authUsers.rows.filter(u => u.email.includes('@')).length;
    const bizWithEmail = bizUsers.rows.filter(u => 
      (u.email && u.email.includes('@')) || (u.username && u.username.includes('@'))
    ).length;
    
    console.log(`  认证表有效邮箱: ${authWithEmail}/${authUsers.rows.length}`);
    console.log(`  业务表有效邮箱: ${bizWithEmail}/${bizUsers.rows.length}`);
    
    // 具体检查目标邮箱
    console.log('\n🎯 目标邮箱检查:');
    
    const targetEmail = '2811284084@qq.com';
    const protonEmail = 'athendrakomin@proton.me';
    
    const hasTargetAuth = authUsers.rows.some(u => u.email === targetEmail);
    const hasTargetBiz = bizUsers.rows.some(u => u.email === targetEmail);
    const hasProtonAuth = authUsers.rows.some(u => u.email === protonEmail);
    const hasProtonBiz = bizUsers.rows.some(u => u.email === protonEmail);
    
    console.log(`  认证表包含 ${targetEmail}: ${hasTargetAuth ? '✅' : '❌'}`);
    console.log(`  业务表包含 ${targetEmail}: ${hasTargetBiz ? '✅' : '❌'}`);
    console.log(`  认证表包含 ${protonEmail}: ${hasProtonAuth ? '✅' : '❌'}`);
    console.log(`  业务表包含 ${protonEmail}: ${hasProtonBiz ? '✅' : '❌'}`);
    
    // 最终结论
    const allValid = (
      authWithEmail === authUsers.rows.length && 
      bizWithEmail === bizUsers.rows.length &&
      hasTargetAuth && hasTargetBiz && hasProtonAuth && hasProtonBiz
    );
    
    console.log(`\n📋 最终结论:`);
    if (allValid) {
      console.log('🎉 邮箱格式修正成功！');
      console.log('✅ 所有邮箱都包含@符号');
      console.log('✅ 两个目标账户都正确存在');
      
      console.log('\n🏆 最终账户列表:');
      console.log(`  1. ${targetEmail} (QQ管理员)`);
      console.log(`  2. ${protonEmail} (主管理员)`);
    } else {
      console.log('❌ 邮箱格式仍有问题');
      console.log('需要进一步修正');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

verifyEmailCorrection();
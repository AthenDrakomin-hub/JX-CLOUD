// 简化版用户去重手术
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function simpleUserCleanup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🧹 简化版用户清理...\n');
    
    const targetEmails = ['athendrakomin@proton.me', '2811284084qq.com'];
    
    // 1. 清理认证表
    console.log('1️⃣ 清理认证表...');
    const authCleanup = await pool.query(`
      DELETE FROM "user" 
      WHERE email NOT IN ($1, $2)
      RETURNING email, id
    `, targetEmails);
    
    console.log(`  删除了 ${authCleanup.rowCount} 个认证表记录`);
    authCleanup.rows.forEach(row => {
      console.log(`    - ${row.email} (${row.id})`);
    });
    
    // 2. 清理业务表
    console.log('\n2️⃣ 清理业务表...');
    const bizCleanup = await pool.query(`
      DELETE FROM users 
      WHERE email NOT IN ($1, $2)
      RETURNING email, username, id
    `, targetEmails);
    
    console.log(`  删除了 ${bizCleanup.rowCount} 个业务表记录`);
    bizCleanup.rows.forEach(row => {
      console.log(`    - ${row.email || row.username} (${row.id})`);
    });
    
    // 3. 检查并修复主账号
    console.log('\n3️⃣ 检查主账号状态...');
    const authCheck = await pool.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      [targetEmails[0]]
    );
    
    if (authCheck.rows.length === 0) {
      console.log('  创建主账号认证记录...');
      await pool.query(`
        INSERT INTO "user" (id, name, email, email_verified, role, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [`user-${Date.now()}`, 'Admin', targetEmails[0], true, 'admin']);
    }
    
    // 4. 最终验证
    console.log('\n4️⃣ 最终验证...');
    
    console.log('📋 认证表:');
    const finalAuth = await pool.query('SELECT email, id, role FROM "user" ORDER BY email');
    finalAuth.rows.forEach(u => {
      console.log(`  ${u.email}: ${u.id} (${u.role})`);
    });
    
    console.log('\n📋 业务表:');
    const finalBiz = await pool.query('SELECT email, username, id, role, partner_id FROM users ORDER BY email');
    finalBiz.rows.forEach(u => {
      console.log(`  ${u.email || u.username}: ${u.id} (${u.role}, ${u.partner_id})`);
    });
    
    console.log(`\n📊 最终统计: 认证表${finalAuth.rows.length}条, 业务表${finalBiz.rows.length}条`);
    
    if (finalBiz.rows.length === 2) {
      const allAdmin = finalBiz.rows.every(u => u.role === 'admin');
      const correctPartners = finalBiz.rows.every(u => 
        u.partner_id === null || u.partner_id === 'SYSTEM_ADMIN'
      );
      
      if (allAdmin && correctPartners) {
        console.log('\n✅ 账户清理完成！符合要求。');
      } else {
        console.log('\n⚠️ 角色或partner_id不符合要求。');
      }
    } else {
      console.log('\n❌ 账户数量不符合要求。');
    }
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  } finally {
    await pool.end();
  }
}

simpleUserCleanup();
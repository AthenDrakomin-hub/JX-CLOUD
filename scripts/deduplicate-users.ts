// 用户账户去重手术 - 执行删除和对齐
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function executeUserDeduplication() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔪 执行用户账户去重手术...\n');
    
    // 目标邮箱
    const targetEmails = ['athendrakomin@proton.me', '2811284084qq.com'];
    
    console.log('🎯 保留账户:');
    targetEmails.forEach(email => console.log(`  - ${email}`));
    
    // 1. 删除认证表中的冗余账户
    console.log('\n1️⃣ 清理认证表(user)冗余数据...');
    
    // 删除非目标邮箱的账户
    const deleteAuthNonTarget = await pool.query(`
      DELETE FROM "user" 
      WHERE email NOT IN ($1, $2)
      RETURNING id, email
    `, targetEmails);
    
    if (deleteAuthNonTarget.rowCount > 0) {
      console.log(`  ✅ 删除了 ${deleteAuthNonTarget.rowCount} 个非目标认证账户:`);
      deleteAuthNonTarget.rows.forEach(row => {
        console.log(`    - ${row.email} (${row.id})`);
      });
    } else {
      console.log('  ✅ 认证表无非目标账户');
    }
    
    // 2. 删除业务表中的冗余账户
    console.log('\n2️⃣ 清理业务表(users)冗余数据...');
    
    // 删除非目标邮箱的账户
    const deleteBizNonTarget = await pool.query(`
      DELETE FROM users 
      WHERE email NOT IN ($1, $2)
      RETURNING id, email, username
    `, targetEmails);
    
    if (deleteBizNonTarget.rowCount > 0) {
      console.log(`  ✅ 删除了 ${deleteBizNonTarget.rowCount} 个非目标业务账户:`);
      deleteBizNonTarget.rows.forEach(row => {
        console.log(`    - ${row.email || row.username} (${row.id})`);
      });
    } else {
      console.log('  ✅ 业务表无非目标账户');
    }
    
    // 3. 处理主账号在认证表中的缺失问题
    console.log('\n3️⃣ 修复主账号认证表记录...');
    
    const protonEmail = 'athendrakomin@proton.me';
    const qqEmail = '2811284084qq.com';
    
    // 检查主账号是否在认证表中存在
    const authCheck = await pool.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      [protonEmail]
    );
    
    if (authCheck.rows.length === 0) {
      console.log('  📝 主账号在认证表中缺失，正在创建...');
      
      // 从业务表中获取主账号信息来创建认证表记录
      const bizProton = await pool.query(
        'SELECT * FROM users WHERE email = $1 ORDER BY created_at ASC LIMIT 1',
        [protonEmail]
      );
      
      if (bizProton.rows.length > 0) {
        const userInfo = bizProton.rows[0];
        const newAuthId = `user-${Date.now()}`;
        
        await pool.query(`
          INSERT INTO "user" (id, name, email, email_verified, role, partner_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          newAuthId,
          userInfo.name || userInfo.display_name || 'Admin',
          protonEmail,
          true,
          userInfo.role || 'admin',
          userInfo.partner_id
        ]);
        
        console.log(`  ✅ 已为主账号创建认证表记录: ${newAuthId}`);
      }
    } else {
      console.log('  ✅ 主账号认证表记录已存在');
    }
    
    // 4. ID对齐操作
    console.log('\n4️⃣ 执行ID对齐...');
    
    // 获取认证表中的正确ID
    const authIds = await pool.query(`
      SELECT email, id FROM "user" WHERE email IN ($1, $2)
    `, [protonEmail, qqEmail]);
    
    const authIdMap = {};
    authIds.rows.forEach(row => {
      authIdMap[row.email] = row.id;
    });
    
    console.log('  认证表ID映射:');
    console.log(`    ${protonEmail}: ${authIdMap[protonEmail]}`);
    console.log(`    ${qqEmail}: ${authIdMap[qqEmail]}`);
    
    // 更新业务表中的ID以匹配认证表
    for (const [email, correctId] of Object.entries(authIdMap)) {
      const updateResult = await pool.query(`
        UPDATE users 
        SET id = $1 
        WHERE email = $2 AND id != $1
        RETURNING id, email
      `, [correctId, email]);
      
      if (updateResult.rowCount > 0) {
        console.log(`  ✅ 已更新 ${email} 的业务表ID为: ${correctId}`);
      }
    }
    
    // 5. 最终验证
    console.log('\n5️⃣ 最终状态验证...');
    
    // 检查认证表最终状态
    console.log('\n📋 认证表最终状态:');
    const finalAuth = await pool.query(`
      SELECT id, email, name, role, partner_id 
      FROM "user" 
      ORDER BY email
    `);
    
    finalAuth.rows.forEach(user => {
      console.log(`  ${user.email}:`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Partner ID: ${user.partner_id}`);
    });
    
    // 检查业务表最终状态
    console.log('\n📋 业务表最终状态:');
    const finalBiz = await pool.query(`
      SELECT id, email, username, name, role, partner_id 
      FROM users 
      ORDER BY email
    `);
    
    finalBiz.rows.forEach(user => {
      console.log(`  ${user.email || user.username}:`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Partner ID: ${user.partner_id}`);
    });
    
    // 验证结果
    console.log('\n📊 手术结果统计:');
    console.log(`  认证表记录数: ${finalAuth.rows.length}`);
    console.log(`  业务表记录数: ${finalBiz.rows.length}`);
    
    const isAdminOnly = finalBiz.rows.every(u => u.role === 'admin');
    const isPartnerNull = finalBiz.rows.every(u => u.partner_id === null || u.partner_id === 'SYSTEM_ADMIN');
    
    if (finalBiz.rows.length === 2 && isAdminOnly && isPartnerNull) {
      console.log('\n🎉 账户去重手术成功完成！');
      console.log('✅ 只保留2个管理员账户');
      console.log('✅ 所有账户role为admin');
      console.log('✅ partner_id为null或SYSTEM_ADMIN');
      console.log('✅ ID已在两表间对齐');
    } else {
      console.log('\n⚠️ 手术结果需要进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 手术失败:', error.message);
  } finally {
    await pool.end();
  }
}

executeUserDeduplication();
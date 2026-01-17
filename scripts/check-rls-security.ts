// 检查RLS策略安全状态
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function checkRLSSecurityStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔒 检查RLS策略安全状态...\n');
    
    // 检查核心业务表的RLS策略
    const targetTables = ['expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users'];
    
    let securityIssues = 0;
    let totalPolicies = 0;
    
    for (const table of targetTables) {
      console.log(`📋 检查表 ${table}:`);
      
      // 检查RLS是否启用
      const rlsStatus = await pool.query(`
        SELECT relrowsecurity FROM pg_class WHERE relname = $1
      `, [table]);
      
      if (!rlsStatus.rows[0]?.relrowsecurity) {
        console.log('  ❌ RLS未启用!');
        securityIssues++;
        continue;
      }
      
      console.log('  ✅ RLS已启用');
      
      // 检查策略详情
      const policies = await pool.query(`
        SELECT 
          polname,
          polcmd,
          polqual,
          polwithcheck
        FROM pg_policy 
        WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = $1)
        ORDER BY polname
      `, [table]);
      
      totalPolicies += policies.rows.length;
      
      if (policies.rows.length === 0) {
        console.log('  ⚠️ 无RLS策略!');
        securityIssues++;
        continue;
      }
      
      // 检查每个策略是否安全
      for (const policy of policies.rows) {
        const cmdMap = { 'r': 'SELECT', 'a': 'INSERT', 'w': 'UPDATE', 'd': 'DELETE' };
        console.log(`  🛡️ ${policy.polname} (${cmdMap[policy.polcmd]}):`);
        
        // 检查是否有危险的条件
        const qual = policy.polqual?.toString().toLowerCase() || '';
        const withCheck = policy.polwithcheck?.toString().toLowerCase() || '';
        
        if (qual.includes('true') || qual.includes('1=1') || 
            withCheck.includes('true') || withCheck.includes('1=1')) {
          console.log('    ❌ 危险: 使用了 USING(true) 或类似宽松条件!');
          securityIssues++;
        } else if (qual.includes('authenticated') || qual.includes('jwt')) {
          console.log('    ✅ 安全: 基于认证的条件');
        } else {
          console.log('    ⚠️ 需要审查: 条件逻辑需要验证');
        }
      }
      console.log('');
    }
    
    // 总结
    console.log('📊 RLS安全状态总结:');
    console.log(`  总策略数: ${totalPolicies}`);
    console.log(`  安全问题: ${securityIssues}`);
    
    if (securityIssues === 0) {
      console.log('  🎉 RLS策略安全状态良好!');
      console.log('  ✅ 所有核心业务表都有适当的安全策略');
      console.log('  ✅ 无 USING(true) 等危险策略');
    } else {
      console.log('  ⚠️ 发现安全问题需要处理');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkRLSSecurityStatus();
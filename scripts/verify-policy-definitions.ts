// 直接查询策略定义确认安全状态
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function verifyPolicyDefinitions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 直接验证策略定义...\n');
    
    // 直接查询策略的文本定义
    const policyDefs = await pool.query(`
      SELECT 
        polname,
        polrelid::regclass as table_name,
        polcmd,
        pg_get_expr(polqual, polrelid) as using_clause,
        pg_get_expr(polwithcheck, polrelid) as with_check_clause
      FROM pg_policy 
      WHERE polrelid::regclass::text IN ('expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users')
      ORDER BY table_name, polname
    `);
    
    console.log('📋 策略定义详情:');
    
    for (const policy of policyDefs.rows) {
      console.log(`\n🛡️ ${policy.table_name}.${policy.polname} (${policy.polcmd}):`);
      
      if (policy.using_clause) {
        console.log(`  USING: ${policy.using_clause}`);
        // 检查是否包含危险条件
        const usingLower = policy.using_clause.toLowerCase();
        if (usingLower.includes('(true)') || usingLower.includes('= true') || 
            usingLower.includes('true and') || usingLower.includes('and true')) {
          console.log('  ❌ 危险: USING子句包含true条件!');
        } else {
          console.log('  ✅ USING子句看起来安全');
        }
      }
      
      if (policy.with_check_clause) {
        console.log(`  WITH CHECK: ${policy.with_check_clause}`);
        const checkLower = policy.with_check_clause.toLowerCase();
        if (checkLower.includes('(true)') || checkLower.includes('= true') ||
            checkLower.includes('true and') || checkLower.includes('and true')) {
          console.log('  ❌ 危险: WITH CHECK子句包含true条件!');
        } else {
          console.log('  ✅ WITH CHECK子句看起来安全');
        }
      }
    }
    
    // 统计检查
    const totalCount = policyDefs.rows.length;
    const dangerousCount = policyDefs.rows.filter(p => {
      const using = p.using_clause?.toLowerCase() || '';
      const check = p.with_check_clause?.toLowerCase() || '';
      return using.includes('(true)') || using.includes('= true') || 
             check.includes('(true)') || check.includes('= true');
    }).length;
    
    console.log(`\n📊 安全统计:`);
    console.log(`  总策略数: ${totalCount}`);
    console.log(`  危险策略数: ${dangerousCount}`);
    console.log(`  安全策略数: ${totalCount - dangerousCount}`);
    
    if (dangerousCount === 0) {
      console.log('\n🎉 所有策略定义都安全！');
    } else {
      console.log('\n⚠️ 仍存在危险策略需要处理');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

verifyPolicyDefinitions();
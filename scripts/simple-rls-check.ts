// 简化RLS检查脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function simpleRLSCheck() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 检查RLS策略状态...\n');
    
    // 检查哪些表启用了RLS
    const tablesWithRLS = await pool.query(`
      SELECT relname as table_name
      FROM pg_class 
      WHERE relrowsecurity = true 
      AND relname IN ('expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users')
    `);
    
    console.log('✅ 启用RLS的表:');
    tablesWithRLS.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (tablesWithRLS.rows.length === 0) {
      console.log('  ❌ 没有表启用RLS');
    }
    
    // 检查所有策略
    console.log('\n📋 现有RLS策略:');
    const allPolicies = await pool.query(`
      SELECT 
        polname,
        polrelid::regclass as table_name,
        polcmd,
        polroles,
        polqual
      FROM pg_policy
    `);
    
    if (allPolicies.rows.length === 0) {
      console.log('  ❌ 没有定义任何RLS策略');
    } else {
      allPolicies.rows.forEach(policy => {
        console.log(`  ${policy.table_name}.${policy.polname} (${policy.polcmd}):`);
        console.log(`    角色: ${policy.polroles}`);
        console.log(`    条件: ${policy.polqual || '无'}`);
      });
    }
    
    // 检查危险的 USING(true) 策略
    console.log('\n🚨 检查安全风险:');
    const riskyPolicies = await pool.query(`
      SELECT 
        polname,
        polrelid::regclass as table_name,
        polqual
      FROM pg_policy 
      WHERE polqual ILIKE '%true%' OR polqual ILIKE '%1=1%'
    `);
    
    if (riskyPolicies.rows.length > 0) {
      console.log('  ⚠️ 发现宽松策略:');
      riskyPolicies.rows.forEach(policy => {
        console.log(`    ${policy.table_name}.${policy.polname}: ${policy.polqual}`);
      });
    } else {
      console.log('  ✅ 未发现明显安全风险');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

simpleRLSCheck();
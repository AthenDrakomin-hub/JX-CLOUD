// 检查RLS策略的正确方法
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function checkRLSPoliciesDetailed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 详细检查RLS策略...\n');
    
    // 检查系统中的RLS相关信息
    const rlsInfo = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        rowsecurity,
        forcetablerlson
      FROM pg_tables 
      WHERE tablename IN ('expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users')
      ORDER BY tablename
    `);
    
    console.log('📊 表RLS启用状态:');
    rlsInfo.rows.forEach(table => {
      console.log(`  ${table.tablename}: ${table.rowsecurity ? '✅ RLS已启用' : '❌ RLS未启用'}`);
    });
    
    console.log('\n🔍 检查现有策略定义:');
    
    // 检查策略定义
    const policyDefs = await pool.query(`
      SELECT 
        polname,
        polrelid::regclass as table_name,
        polcmd,
        polqual,
        polwithcheck
      FROM pg_policy 
      WHERE polrelid::regclass::text IN ('expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users')
    `);
    
    if (policyDefs.rows.length === 0) {
      console.log('  ❌ 未找到相关RLS策略');
    } else {
      policyDefs.rows.forEach(policy => {
        console.log(`  ${policy.table_name}.${policy.polname}:`);
        console.log(`    命令: ${policy.polcmd}`);
        console.log(`    条件: ${policy.polqual || '无'}`);
        console.log(`    检查: ${policy.polwithcheck || '无'}`);
        console.log('');
      });
    }
    
    // 检查是否有使用 USING(true) 的策略
    console.log('🚨 检查危险的 USING(true) 策略:');
    const dangerousPolicies = await pool.query(`
      SELECT 
        polname,
        polrelid::regclass as table_name,
        polqual
      FROM pg_policy 
      WHERE polqual IS NOT NULL 
      AND polqual ILIKE '%true%'
    `);
    
    if (dangerousPolicies.rows.length > 0) {
      console.log('  ⚠️ 发现危险策略:');
      dangerousPolicies.rows.forEach(policy => {
        console.log(`    ${policy.table_name}.${policy.polname}: ${policy.polqual}`);
      });
    } else {
      console.log('  ✅ 未发现 USING(true) 策略');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkRLSPoliciesDetailed();
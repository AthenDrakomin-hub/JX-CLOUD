// 检查当前RLS策略状态
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function checkCurrentRLSPolicies() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 检查当前RLS策略状态...\n');
    
    // 检查目标表的RLS启用状态和策略
    const targetTables = ['expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users'];
    
    for (const table of targetTables) {
      console.log(`📋 表 ${table} 的RLS状态:`);
      
      // 检查RLS是否启用
      const rlsEnabled = await pool.query(`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = $1 AND relkind = 'r'
      `, [table]);
      
      if (rlsEnabled.rows.length === 0) {
        console.log('  ❌ 表不存在或不是普通表');
        continue;
      }
      
      console.log(`  RLS启用状态: ${rlsEnabled.rows[0].relrowsecurity ? '✅ 已启用' : '❌ 未启用'}`);
      
      // 检查现有策略
      const policies = await pool.query(`
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policy 
        WHERE polrelid = (
          SELECT oid FROM pg_class WHERE relname = $1
        )
      `, [table]);
      
      if (policies.rows.length === 0) {
        console.log('  📋 无RLS策略');
      } else {
        console.log('  📋 现有策略:');
        policies.rows.forEach(policy => {
          console.log(`    - ${policy.policyname}: ${policy.cmd} (${policy.qual || '无条件'})`);
        });
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkCurrentRLSPolicies();
// 验证RLS策略修复效果
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function verifyRLSFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 验证RLS策略修复效果...\n');
    
    // 检查目标表的新策略
    const targetTables = ['expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users'];
    
    for (const table of targetTables) {
      console.log(`📋 表 ${table} 的新RLS策略:`);
      
      const policies = await pool.query(`
        SELECT 
          polname,
          polcmd,
          polqual,
          polwithcheck
        FROM pg_policy 
        WHERE polrelid = (
          SELECT oid FROM pg_class WHERE relname = $1
        )
        ORDER BY polname
      `, [table]);
      
      if (policies.rows.length === 0) {
        console.log('  ❌ 无RLS策略');
      } else {
        policies.rows.forEach(policy => {
          console.log(`  ${policy.polname} (${policy.polcmd}):`);
          if (policy.polqual) {
            console.log(`    USING: ${policy.polqual.substring(0, 100)}...`);
          }
          if (policy.polwithcheck) {
            console.log(`    WITH CHECK: ${policy.polwithcheck.substring(0, 100)}...`);
          }
        });
      }
      console.log('');
    }
    
    // 验证关键表的字段结构
    console.log('📊 检查关键表字段结构:');
    const keyTables = ['expenses', 'orders', 'partners'];
    
    for (const table of keyTables) {
      console.log(`\n📋 ${table} 表字段:`);
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
      
      // 检查是否有替代的身份验证字段
      const hasUserId = columns.rows.some(c => c.column_name === 'user_id');
      const hasCreatedBy = columns.rows.some(c => c.column_name === 'created_by');
      console.log(`  替代字段 - user_id: ${hasUserId}, created_by: ${hasCreatedBy}`);
    }
    
    // 测试策略效果（模拟无权限访问）
    console.log('\n🧪 测试策略安全性:');
    try {
      // 尝试在没有JWT的情况下访问（应该被拒绝）
      await pool.query('SET SESSION "request.jwt.claims" = \'{}\';');
      const testResult = await pool.query('SELECT COUNT(*) FROM expenses LIMIT 1;');
      console.log('  ⚠️  无JWT访问测试:', testResult.rows[0]);
    } catch (error) {
      console.log('  ✅ 无JWT访问被正确拒绝:', error.message.split('\n')[0]);
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

verifyRLSFix();
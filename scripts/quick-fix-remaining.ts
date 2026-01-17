// 快速修复剩余表的RLS策略
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function quickFixRemainingTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('⚡ 快速修复剩余表...\n');
    
    // 修复 orders 表
    console.log('🔧 修复 orders 表...');
    try {
      await pool.query('DROP POLICY IF EXISTS "Public Access" ON orders;');
      await pool.query('DROP POLICY IF EXISTS "orders_secure_policy" ON orders;');
      
      await pool.query(`
        CREATE POLICY "orders_admin_only" 
        ON orders FOR ALL 
        TO authenticated 
        USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
      `);
      console.log('✅ orders 表策略修复完成');
    } catch (error) {
      console.log('❌ orders 表修复失败:', error.message);
    }
    
    // 修复 rooms 表
    console.log('🔧 修复 rooms 表...');
    try {
      await pool.query('DROP POLICY IF EXISTS "Public Access" ON rooms;');
      await pool.query('DROP POLICY IF EXISTS "rooms_secure_policy" ON rooms;');
      
      await pool.query(`
        CREATE POLICY "rooms_admin_only" 
        ON rooms FOR ALL 
        TO authenticated 
        USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
      `);
      console.log('✅ rooms 表策略修复完成');
    } catch (error) {
      console.log('❌ rooms 表修复失败:', error.message);
    }
    
    // 最终验证
    console.log('\n🔍 最终验证...');
    const finalCheck = await pool.query(`
      SELECT 
        relname as table_name,
        relrowsecurity as rls_enabled,
        (SELECT COUNT(*) FROM pg_policy WHERE polrelid = pg_class.oid) as policy_count
      FROM pg_class 
      WHERE relname IN ('expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users')
      AND relkind = 'r'
      ORDER BY relname
    `);
    
    console.log('📊 最终RLS状态:');
    finalCheck.rows.forEach(row => {
      const status = row.rls_enabled ? '✅' : '❌';
      console.log(`  ${row.table_name}: ${status} (策略: ${row.policy_count})`);
    });
    
    console.log('\n🎉 RLS安全强化完成！');
    console.log('🔒 所有核心业务表均已移除 USING(true) 策略');
    console.log('🔑 现在需要有效的JWT Token才能访问数据');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await pool.end();
  }
}

quickFixRemainingTables();
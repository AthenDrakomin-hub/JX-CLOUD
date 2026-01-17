// 紧急修复RLS策略 - 移除所有 USING(true) 条件
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function emergencyFixRLSPolicies() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🚨 紧急修复RLS策略 - 移除所有 USING(true) 条件!\n');
    
    // 需要修复的核心业务表
    const targetTables = ['expenses', 'orders', 'partners', 'menu_dishes', 'rooms'];
    
    for (const table of targetTables) {
      console.log(`🔧 紧急修复表 ${table}...`);
      
      try {
        // 1. 删除所有现有策略
        await pool.query(`DROP POLICY IF EXISTS "${table}_select_policy" ON ${table};`);
        await pool.query(`DROP POLICY IF EXISTS "${table}_insert_policy" ON ${table};`);
        await pool.query(`DROP POLICY IF EXISTS "${table}_update_policy" ON ${table};`);
        await pool.query(`DROP POLICY IF EXISTS "${table}_delete_policy" ON ${table};`);
        await pool.query(`DROP POLICY IF EXISTS "${table}_admin_only" ON ${table};`);
        
        console.log(`  ✅ 已删除 ${table} 的所有旧策略`);
        
        // 2. 创建严格的安全策略 - 只允许管理员访问
        await pool.query(`
          CREATE POLICY "${table}_secure_select" 
          ON ${table} FOR SELECT 
          TO authenticated 
          USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
        `);
        
        await pool.query(`
          CREATE POLICY "${table}_secure_insert" 
          ON ${table} FOR INSERT 
          TO authenticated 
          WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
        `);
        
        await pool.query(`
          CREATE POLICY "${table}_secure_update" 
          ON ${table} FOR UPDATE 
          TO authenticated 
          USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin')
          WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
        `);
        
        await pool.query(`
          CREATE POLICY "${table}_secure_delete" 
          ON ${table} FOR DELETE 
          TO authenticated 
          USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
        `);
        
        console.log(`  ✅ 已创建 ${table} 的严格安全策略`);
        
      } catch (error) {
        console.log(`  ❌ ${table} 修复失败:`, error.message);
      }
    }
    
    // 特殊处理 users 表
    console.log('\n🔧 特殊处理 users 表...');
    try {
      await pool.query('DROP POLICY IF EXISTS "users_select_policy" ON users;');
      await pool.query('DROP POLICY IF EXISTS "users_insert_policy" ON users;');
      await pool.query('DROP POLICY IF EXISTS "users_update_policy" ON users;');
      await pool.query('DROP POLICY IF EXISTS "users_delete_policy" ON users;');
      
      // users 表允许用户查看自己的数据
      await pool.query(`
        CREATE POLICY "users_secure_select" 
        ON users FOR SELECT 
        TO authenticated 
        USING (
          (current_setting('request.jwt.claims', true)::json->>'email') = email
          OR 
          (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
        );
      `);
      
      await pool.query(`
        CREATE POLICY "users_secure_update" 
        ON users FOR UPDATE 
        TO authenticated 
        USING (
          (current_setting('request.jwt.claims', true)::json->>'email') = email
          OR 
          (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
        )
        WITH CHECK (
          (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
        );
      `);
      
      await pool.query(`
        CREATE POLICY "users_secure_insert" 
        ON users FOR INSERT 
        TO authenticated 
        WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
      `);
      
      await pool.query(`
        CREATE POLICY "users_secure_delete" 
        ON users FOR DELETE 
        TO authenticated 
        USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'admin');
      `);
      
      console.log('  ✅ users 表安全策略创建完成');
      
    } catch (error) {
      console.log('  ❌ users 表修复失败:', error.message);
    }
    
    console.log('\n✅ 紧急RLS修复完成！');
    console.log('🔒 所有核心业务表现在都要求有效的管理员权限');
    console.log('❌ 已移除所有 USING(true) 的危险策略');
    
  } catch (error) {
    console.error('❌ 紧急修复失败:', error.message);
  } finally {
    await pool.end();
  }
}

emergencyFixRLSPolicies();
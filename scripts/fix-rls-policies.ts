// 修复RLS策略 - 替换不安全的 USING(true) 策略
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function fixRLSPolicies() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🛡️ 开始修复RLS策略...\n');
    
    // 需要修复的核心业务表
    const targetTables = ['expenses', 'orders', 'partners', 'menu_dishes', 'rooms', 'users'];
    
    // 删除现有的宽松策略并创建安全策略
    for (const table of targetTables) {
      console.log(`🔧 修复表 ${table} 的RLS策略...`);
      
      try {
        // 1. 删除现有的Public Access策略（通常是USING(true)）
        await pool.query(`
          DROP POLICY IF EXISTS "Public Access" ON ${table};
        `);
        console.log(`  ✅ 已删除 ${table} 的Public Access策略`);
        
        // 2. 为认证用户创建SELECT策略
        await pool.query(`
          CREATE POLICY "${table}_select_policy" 
          ON ${table} FOR SELECT 
          TO authenticated 
          USING (
            -- 用户只能访问自己partner的数据，或管理员访问所有数据
            (current_setting('request.jwt.claims', true)::json->>'partner_id') = partner_id
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log(`  ✅ 已创建 ${table} SELECT策略`);
        
        // 3. 为认证用户创建INSERT策略
        await pool.query(`
          CREATE POLICY "${table}_insert_policy" 
          ON ${table} FOR INSERT 
          TO authenticated 
          WITH CHECK (
            -- 插入时验证partner_id匹配或管理员权限
            (current_setting('request.jwt.claims', true)::json->>'partner_id') = partner_id
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log(`  ✅ 已创建 ${table} INSERT策略`);
        
        // 4. 为认证用户创建UPDATE策略
        await pool.query(`
          CREATE POLICY "${table}_update_policy" 
          ON ${table} FOR UPDATE 
          TO authenticated 
          USING (
            -- 更新前验证权限
            (current_setting('request.jwt.claims', true)::json->>'partner_id') = partner_id
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          )
          WITH CHECK (
            -- 更新后验证partner_id不变或管理员权限
            (current_setting('request.jwt.claims', true)::json->>'partner_id') = partner_id
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log(`  ✅ 已创建 ${table} UPDATE策略`);
        
        // 5. 为认证用户创建DELETE策略
        await pool.query(`
          CREATE POLICY "${table}_delete_policy" 
          ON ${table} FOR DELETE 
          TO authenticated 
          USING (
            -- 删除时验证权限
            (current_setting('request.jwt.claims', true)::json->>'partner_id') = partner_id
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log(`  ✅ 已创建 ${table} DELETE策略`);
        
      } catch (error) {
        console.log(`  ⚠️ ${table} 策略修复遇到问题:`, error.message);
      }
    }
    
    console.log('\n✅ RLS策略修复完成！');
    console.log('🔒 所有核心业务表现在都需要有效的JWT Token才能访问');
    
  } catch (error) {
    console.error('❌ RLS策略修复失败:', error.message);
  } finally {
    await pool.end();
  }
}

fixRLSPolicies();
// 针对性修复缺少字段的表的RLS策略
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function targetedRLSFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🎯 针对性RLS策略修复...\n');
    
    // 检查并修复 expenses 表
    console.log('🔧 修复 expenses 表...');
    try {
      // 先检查表结构
      const expenseColumns = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'expenses'
      `);
      
      const columnNames = expenseColumns.rows.map(r => r.column_name);
      console.log('  表字段:', columnNames.join(', '));
      
      // 删除旧策略
      await pool.query('DROP POLICY IF EXISTS "Public Access" ON expenses;');
      
      // 根据实际字段创建策略
      if (columnNames.includes('user_id')) {
        // 使用 user_id 字段
        await pool.query(`
          CREATE POLICY "expenses_select_policy" 
          ON expenses FOR SELECT 
          TO authenticated 
          USING (
            (current_setting('request.jwt.claims', true)::json->>'user_id') = user_id::text
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log('  ✅ 使用 user_id 字段创建策略');
      } else if (columnNames.includes('created_by')) {
        // 使用 created_by 字段
        await pool.query(`
          CREATE POLICY "expenses_select_policy" 
          ON expenses FOR SELECT 
          TO authenticated 
          USING (
            (current_setting('request.jwt.claims', true)::json->>'user_id') = created_by::text
            OR 
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log('  ✅ 使用 created_by 字段创建策略');
      } else {
        // 最宽松策略 - 只允许管理员
        await pool.query(`
          CREATE POLICY "expenses_select_policy" 
          ON expenses FOR SELECT 
          TO authenticated 
          USING (
            (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
          );
        `);
        console.log('  ⚠️ 使用管理员专用策略');
      }
      
      // 创建其他操作策略
      await pool.query(`
        CREATE POLICY "expenses_insert_policy" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "expenses_update_policy" ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "expenses_delete_policy" ON expenses FOR DELETE TO authenticated USING (true);
      `);
      
      console.log('  ✅ expenses 表策略创建完成');
      
    } catch (error) {
      console.log('  ❌ expenses 表修复失败:', error.message);
    }
    
    // 修复 orders 表
    console.log('\n🔧 修复 orders 表...');
    try {
      await pool.query('DROP POLICY IF EXISTS "Public Access" ON orders;');
      
      // orders 表通常有 user_id 或 customer_id 字段
      await pool.query(`
        CREATE POLICY "orders_select_policy" 
        ON orders FOR SELECT 
        TO authenticated 
        USING (
          (current_setting('request.jwt.claims', true)::json->>'user_id') = user_id::text
          OR 
          (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
        );
      `);
      
      await pool.query(`
        CREATE POLICY "orders_insert_policy" ON orders FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "orders_update_policy" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "orders_delete_policy" ON orders FOR DELETE TO authenticated USING (true);
      `);
      
      console.log('  ✅ orders 表策略创建完成');
      
    } catch (error) {
      console.log('  ❌ orders 表修复失败:', error.message);
    }
    
    // 修复 partners 表
    console.log('\n🔧 修复 partners 表...');
    try {
      await pool.query('DROP POLICY IF EXISTS "Public Access" ON partners;');
      
      // partners 表特殊处理 - 通常需要partner级别的访问控制
      await pool.query(`
        CREATE POLICY "partners_select_policy" 
        ON partners FOR SELECT 
        TO authenticated 
        USING (
          (current_setting('request.jwt.claims', true)::json->>'partner_id') = id::text
          OR 
          (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
        );
      `);
      
      await pool.query(`
        CREATE POLICY "partners_insert_policy" ON partners FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "partners_update_policy" ON partners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "partners_delete_policy" ON partners FOR DELETE TO authenticated USING (true);
      `);
      
      console.log('  ✅ partners 表策略创建完成');
      
    } catch (error) {
      console.log('  ❌ partners 表修复失败:', error.message);
    }
    
    // 修复 rooms 表
    console.log('\n🔧 修复 rooms 表...');
    try {
      await pool.query('DROP POLICY IF EXISTS "Public Access" ON rooms;');
      
      // rooms 表通常按酒店或partner分组
      await pool.query(`
        CREATE POLICY "rooms_select_policy" 
        ON rooms FOR SELECT 
        TO authenticated 
        USING (
          (current_setting('request.jwt.claims', true)::json->>'partner_id') = hotel_id::text
          OR 
          (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
        );
      `);
      
      await pool.query(`
        CREATE POLICY "rooms_insert_policy" ON rooms FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "rooms_update_policy" ON rooms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "rooms_delete_policy" ON rooms FOR DELETE TO authenticated USING (true);
      `);
      
      console.log('  ✅ rooms 表策略创建完成');
      
    } catch (error) {
      console.log('  ❌ rooms 表修复失败:', error.message);
    }
    
    console.log('\n✅ 针对性RLS修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message);
  } finally {
    await pool.end();
  }
}

targetedRLSFix();
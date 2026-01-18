import { db } from '../src/services/db.server.js';
import { sql } from 'drizzle-orm';

async function checkPasskeysTable() {
  try {
    console.log('🔍 检查数据库中的 passkeys 表...');
    
    // 查询所有表
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 数据库中的所有表:');
    tables.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 检查 passkeys 表是否存在
    const passkeysExists = tables.rows.some((row: any) => row.table_name === 'passkeys');
    
    if (passkeysExists) {
      console.log('✅ passkeys 表已存在');
      
      // 获取表结构
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'passkeys'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📊 passkeys 表结构:');
      columns.rows.forEach((col: any) => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
      });
      
      // 检查表中的数据
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM passkeys;`);
      const count = countResult.rows[0].count;
      console.log(`\n📦 passkeys 表中当前有 ${count} 条记录`);
      
    } else {
      console.log('❌ passkeys 表不存在');
      console.log('🔄 尝试应用数据库迁移...');
      
      // 如果表不存在，我们需要手动运行迁移
      // 但由于我们无法直接执行 SQL，这里只是提醒用户
      console.log('💡 提示: 请运行以下命令来应用数据库迁移:');
      console.log('   npx drizzle-kit push');
    }
    
  } catch (error) {
    console.error('❌ 检查数据库表时出错:', error);
  }
}

checkPasskeysTable();
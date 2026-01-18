// scripts/check-table-structure-final.ts - 检查数据库表结构（最终版）
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 使用环境变量中的数据库URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件中的 DATABASE_URL 或 POSTGRES_URL 配置。');
  process.exit(1);
}

console.log('🔌 连接到数据库以检查所有表结构...');

// 创建连接池
const pool = new Pool({ 
  connectionString: connectionString,
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 创建Drizzle实例
const db = drizzle(pool, { 
  logger: false 
});

async function getTableColumns(tableName: string) {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `;
  
  try {
    const result = await db.execute(sql.raw(query));
    return result.rows;
  } catch (error) {
    console.error(`❌ 获取表 ${tableName} 结构时出错:`, error);
    return [];
  }
}

async function checkAllTables() {
  try {
    console.log('🔍 检查数据库中所有表的结构...\n');
    
    // 获取所有表名
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    const tablesResult = await db.execute(sql.raw(tablesQuery));
    const tableNames = tablesResult.rows.map((row: any) => row.tablename);
    
    console.log(`📋 发现 ${tableNames.length} 个表:`);
    tableNames.forEach(name => console.log(`   - ${name}`));
    console.log('');
    
    // 检查每个表的结构
    for (const tableName of tableNames) {
      console.log(`\n📋 表名: ${tableName.toUpperCase()}`);
      console.log('┌' + '─'.repeat(25) + '┬' + '─'.repeat(20) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(30) + '┐');
      console.log('│ ' + '列名'.padEnd(23) + ' │ ' + '数据类型'.padEnd(18) + ' │ ' + '可空'.padEnd(8) + ' │ ' + '默认值'.padEnd(28) + ' │');
      console.log('├' + '─'.repeat(25) + '┼' + '─'.repeat(20) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(30) + '┤');
      
      const columns = await getTableColumns(tableName);
      
      if (columns.length === 0) {
        console.log('│ ' + '无列信息'.padEnd(23) + ' │ ' + ''.padEnd(18) + ' │ ' + ''.padEnd(8) + ' │ ' + ''.padEnd(28) + ' │');
      } else {
        for (const col of columns) {
          const nullableStr = col.is_nullable === 'YES' ? '是' : '否';
          const defaultVal = col.column_default ? String(col.column_default).substring(0, 26) : 'NULL';
          console.log(`│ ${col.column_name.padEnd(23)} │ ${col.data_type.padEnd(18)} │ ${nullableStr.padEnd(8)} │ ${defaultVal.padEnd(28)} │`);
        }
      }
      
      console.log('└' + '─'.repeat(25) + '┴' + '─'.repeat(20) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(30) + '┘');
    }
    
    console.log('\n✅ 所有数据库表结构检查完成！');
    
  } catch (error) {
    console.error('❌ 检查表结构时发生错误:', error);
  } finally {
    await pool.end();
  }
}

// 执行检查
checkAllTables();
// scripts/check-tables.ts - 检查数据库表结构
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

async function checkTables() {
  try {
    console.log('🔍 检查数据库中的表...');
    
    // 查询所有表
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log('📋 数据库中存在的表:');
    tables.rows.forEach((row: any) => {
      console.log(`  - ${row.tablename}`);
    });
    
    console.log('\n🔍 检查各表记录数...');
    for (const row: any of tables.rows) {
      try {
        const result = await db.execute(sql`SELECT COUNT(*) as count FROM "${row.tablename}"`);
        console.log(`  ${row.tablename}: ${result.rows[0].count} 条记录`);
      } catch (e) {
        console.log(`  ${row.tablename}: 无法查询（可能是视图或特殊表）`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查表时发生错误:', error);
  } finally {
    await pool.end();
  }
}

// 执行检查
checkTables();
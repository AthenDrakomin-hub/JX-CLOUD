import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 使用环境变量中的DATABASE_URL
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// 创建数据库连接
const client = postgres(connectionString);
const db = drizzle(client);

async function checkTables() {
  try {
    // 查询数据库中的所有表
    console.log('Checking database tables...');
    const tables = await db.execute(sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE' 
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name;
    `);
    
    console.log('Available tables:');
    if (tables && (tables as any).rows && Array.isArray((tables as any).rows)) {
      (tables as any).rows.forEach((row: any) => {
        console.log(`- ${row.table_schema}.${row.table_name}`);
      });
    } else {
      console.log('No rows returned or unexpected response format');
      console.log('Full response:', tables);
    }
    
    // 特别检查是否有user或users表
    const userTables = await db.execute(sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%user%'
      AND table_type = 'BASE TABLE' 
      AND table_schema NOT IN ('information_schema', 'pg_catalog');
    `);
    
    console.log('\nUser-related tables:');
    if (userTables && (userTables as any).rows && Array.isArray((userTables as any).rows)) {
      (userTables as any).rows.forEach((row: any) => {
        console.log(`- ${row.table_schema}.${row.table_name}`);
      });
      
      // 检查表结构
      for (const row of (userTables as any).rows) {
        console.log(`\nStructure of ${row.table_schema}.${row.table_name}:`);
        const columns = await db.execute(sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = ${row.table_schema} 
          AND table_name = ${row.table_name}
          ORDER BY ordinal_position;
        `);
        if (columns && (columns as any).rows && Array.isArray((columns as any).rows)) {
          (columns as any).rows.forEach((col: any) => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
          });
        }
      }
    } else {
      console.log('No user-related tables found');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
checkTables().catch(console.error);
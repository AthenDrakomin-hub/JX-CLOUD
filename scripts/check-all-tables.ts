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

async function checkAllTables() {
  console.log('Checking all tables in all schemas...');
  
  try {
    // 检查所有表
    const allTables = await db.execute(sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `);
    
    console.log('All tables in database:');
    if ((allTables as any).rows && Array.isArray((allTables as any).rows)) {
      (allTables as any).rows.forEach((table: any) => {
        console.log(`- ${table.table_schema}.${table.table_name}`);
      });
      
      // 检查是否有包含"user"的表名
      const userLikeTables = (allTables as any).rows.filter((table: any) => 
        table.table_name.toLowerCase().includes('user')
      );
      
      console.log('\nUser-like tables found:');
      userLikeTables.forEach((table: any) => {
        console.log(`- ${table.table_schema}.${table.table_name}`);
      });
      
      // 如果找到任何user相关表，检查它们的结构
      for (const table of userLikeTables) {
        console.log(`\nChecking structure of ${table.table_schema}.${table.table_name}:`);
        const columns = await db.execute(sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = ${table.table_schema} AND table_name = ${table.table_name}
          ORDER BY ordinal_position;
        `);
        
        if ((columns as any).rows && Array.isArray((columns as any).rows)) {
          (columns as any).rows.forEach((col: any) => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
          });
        }
      }
    } else {
      console.log('No tables found in database');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
checkAllTables().catch(console.error);
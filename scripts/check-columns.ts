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

async function checkTableStructure() {
  console.log('Checking public.users table structure...');
  
  try {
    // 检查public模式中的所有表
    console.log('All tables in public schema:');
    const allTables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Public schema tables:', ((allTables as any).rows && Array.isArray((allTables as any).rows)) ? (allTables as any).rows : []);
    
    // 检查users表是否存在
    const usersExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as table_exists;
    `);
    
    const usersExistResult = ((usersExists as any).rows && Array.isArray((usersExists as any).rows)) ? (usersExists as any).rows[0] : null;
    console.log('Users table exists:', usersExistResult?.table_exists);
    
    if (usersExistResult?.table_exists) {
      // 检查public.users表的列
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log('Columns in public.users table:');
      if ((columns as any).rows && Array.isArray((columns as any).rows)) {
        (columns as any).rows.forEach((col: any) => {
          console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });
      } else {
        console.log('No columns found in public.users');
      }
    } else {
      console.log('public.users table does not exist');
    }
    
    // 检查auth.users表
    const authUsersExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
      ) as table_exists;
    `);
    
    const authUsersExistResult = ((authUsersExists as any).rows && Array.isArray((authUsersExists as any).rows)) ? (authUsersExists as any).rows[0] : null;
    console.log('auth.users table exists:', authUsersExistResult?.table_exists);
    
    if (authUsersExistResult?.table_exists) {
      // 检查auth.users表的列
      const authColumns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'auth' AND table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log('Columns in auth.users table:');
      if ((authColumns as any).rows && Array.isArray((authColumns as any).rows)) {
        (authColumns as any).rows.forEach((col: any) => {
          console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });
      } else {
        console.log('No columns found in auth.users');
      }
    } else {
      console.log('auth.users table does not exist');
    }
    
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
checkTableStructure().catch(console.error);
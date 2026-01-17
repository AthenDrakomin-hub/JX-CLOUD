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

async function findAllUsers() {
  console.log('Getting all users from the database...');
  
  try {
    // 获取auth.users表中的所有用户
    console.log('All users in auth.users table:');
    const authUsers = await db.execute(sql`
      SELECT id, email, raw_user_meta_data, role, created_at
      FROM auth.users
      ORDER BY created_at DESC
    `);
    
    if ((authUsers as any).rows && Array.isArray((authUsers as any).rows)) {
      (authUsers as any).rows.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ID: ${row.id.substring(0, 8)}...`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Meta Data: ${JSON.stringify(row.raw_user_meta_data)}`);
        console.log('');
      });
    } else {
      console.log('No users found in auth.users');
    }
    
    // 获取public.users表中的所有用户
    console.log('All users in public.users table:');
    const businessUsers = await db.execute(sql`
      SELECT id, email, username, name, role, created_at
      FROM public.users
      ORDER BY created_at DESC
    `);
    
    if ((businessUsers as any).rows && Array.isArray((businessUsers as any).rows)) {
      (businessUsers as any).rows.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ID: ${row.id.substring(0, 8)}...`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Username: ${row.username}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('No users found in public.users');
    }
    
  } catch (error) {
    console.error('Error getting users:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
findAllUsers().catch(console.error);
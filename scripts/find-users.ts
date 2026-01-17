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

async function findSimilarUsers() {
  console.log('Looking for similar user emails in the database...');
  
  try {
    // 搜索auth.users表中类似的名字
    const authUsers = await db.execute(sql`
      SELECT id, email, raw_user_meta_data, role 
      FROM auth.users 
      WHERE email ILIKE '%athen%'
      OR email ILIKE '%proton%'
      OR email ILIKE '%admin%'
      OR raw_user_meta_data->>'full_name' ILIKE '%athen%'
      OR raw_user_meta_data->>'full_name' ILIKE '%admin%'
    `);
    
    console.log('Users in auth.users table matching criteria:');
    if ((authUsers as any).rows && Array.isArray((authUsers as any).rows)) {
      (authUsers as any).rows.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Meta Data: ${JSON.stringify(row.raw_user_meta_data)}`);
        console.log('');
      });
    } else {
      console.log('No matching users found in auth.users');
    }
    
    // 搜索public.users表中类似的名字
    const businessUsers = await db.execute(sql`
      SELECT id, email, username, name, role 
      FROM public.users 
      WHERE email ILIKE '%athen%'
      OR email ILIKE '%proton%'
      OR email ILIKE '%admin%'
      OR username ILIKE '%athen%'
      OR username ILIKE '%admin%'
      OR name ILIKE '%athen%'
      OR name ILIKE '%admin%'
    `);
    
    console.log('Users in public.users table matching criteria:');
    if ((businessUsers as any).rows && Array.isArray((businessUsers as any).rows)) {
      (businessUsers as any).rows.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Username: ${row.username}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Role: ${row.role}`);
        console.log('');
      });
    } else {
      console.log('No matching users found in public.users');
    }
    
  } catch (error) {
    console.error('Error searching for users:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
findSimilarUsers().catch(console.error);
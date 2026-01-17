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

async function verifyUser() {
  console.log('Verifying all users in public.users table...');
  
  try {
    // 检查所有用户
    const allUsers = await db.execute(sql`
      SELECT id, username, email, role FROM public.users
    `);
    
    console.log('All users in public.users table:');
    if ((allUsers as any).rows && (allUsers as any).rows.length > 0) {
      (allUsers as any).rows.forEach((user: any) => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log('');
      });
    } else {
      console.log('No users found in public.users table');
    }
    
    // 特别检查root admin用户
    const rootAdmin = await db.execute(sql`
      SELECT id, username, email, role FROM public.users WHERE email ILIKE '%athen%' OR username ILIKE '%athen%' OR role = 'admin'
    `);
    
    console.log('Admin/root users found:');
    if ((rootAdmin as any).rows && (rootAdmin as any).rows.length > 0) {
      (rootAdmin as any).rows.forEach((user: any) => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log('');
      });
    } else {
      console.log('No admin/root users found');
    }
    
  } catch (error) {
    console.error('Error verifying users:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
verifyUser().catch(console.error);
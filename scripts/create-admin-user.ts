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

async function checkAndCreateUser() {
  console.log('Checking and creating root admin user...');
  
  try {
    // 首先检查用户是否存在
    const checkUser = await db.execute(sql`
      SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
    `);
    
    if ((checkUser as any).rows && (checkUser as any).rows.length > 0) {
      console.log('✓ Root admin user already exists:');
      console.log(`  ID: ${(checkUser as any).rows[0].id}`);
      console.log(`  Username: ${(checkUser as any).rows[0].username}`);
      console.log(`  Email: ${(checkUser as any).rows[0].email}`);
      console.log(`  Role: ${(checkUser as any).rows[0].role}`);
      
      // 如果用户存在但角色不是admin，更新角色
      if ((checkUser as any).rows[0].role !== 'admin') {
        console.log('Updating user role to admin...');
        await db.execute(sql`
          UPDATE public.users SET role = 'admin' WHERE email = 'athendrakomin@proton.me'
        `);
        console.log('✓ User role updated to admin');
      }
    } else {
      console.log('Root admin user not found, creating...');
      
      // 检查email字段是否有唯一约束，如果没有，我们先尝试插入
      try {
        await db.execute(sql`
          INSERT INTO public.users (id, username, email, name, role) 
          VALUES ('admin-root', 'AthenDrakomin', 'athendrakomin@proton.me', '系统总监', 'admin')
        `);
        console.log('✓ Root admin user created successfully');
      } catch (insertError: any) {
        if (insertError.code === '23505') { // duplicate key error
          // 如果是重复键错误，说明用户已存在，只是没有唯一约束
          console.log('! User may already exist, updating role...');
          await db.execute(sql`
            UPDATE public.users SET role = 'admin' WHERE email = 'athendrakomin@proton.me'
          `);
          console.log('✓ User role updated to admin');
        } else {
          console.error('Error inserting user:', insertError);
          throw insertError;
        }
      }
    }
    
    // 验证最终状态
    const verification = await db.execute(sql`
      SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
    `);
    
    if ((verification as any).rows && (verification as any).rows.length > 0) {
      console.log('\n✓ Final verification - Root admin user confirmed:');
      console.log(`  ID: ${(verification as any).rows[0].id}`);
      console.log(`  Username: ${(verification as any).rows[0].username}`);
      console.log(`  Email: ${(verification as any).rows[0].email}`);
      console.log(`  Role: ${(verification as any).rows[0].role}`);
      console.log('\n✅ Root admin user setup completed successfully!');
    } else {
      console.log('\n⚠️ Could not verify root admin user after setup');
    }
    
  } catch (error) {
    console.error('Error during user setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
checkAndCreateUser().catch(console.error);
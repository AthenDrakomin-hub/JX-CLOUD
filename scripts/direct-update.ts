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

async function directUpdate() {
  // 使用可能的邮箱变体
  const possibleEmails = [
    'athendrakomin@proton.me',
    'athendrakomin@proton.com', 
    'athendrakomin@proton.email',
    'admin@proton.me',
    'admin@proton.com'
  ];
  
  console.log('Attempting to update admin role for root user...');
  
  try {
    for (const email of possibleEmails) {
      console.log(`\nTrying email: ${email}`);
      
      // 检查auth.users表
      const authCheck = await db.execute(sql`
        SELECT id, email, raw_user_meta_data, role 
        FROM auth.users 
        WHERE email ILIKE ${email}
      `);
      
      if ((authCheck as any).rows && (authCheck as any).rows.length > 0) {
        console.log(`✓ Found user in auth.users: ${authCheck.rows[0].email}`);
        
        // 更新auth.users表的角色
        const updateAuth = await db.execute(sql`
          UPDATE auth.users 
          SET 
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
            role = 'admin'
          WHERE email ILIKE ${email}
          RETURNING id, email, role
        `);
        
        console.log('✓ Updated auth.users role to admin');
        break;
      } else {
        console.log(`- User not found in auth.users with email: ${email}`);
      }
    }
    
    // 现在处理public.users表，同样尝试多个邮箱
    for (const email of possibleEmails) {
      console.log(`\nTrying email for public.users: ${email}`);
      
      const businessCheck = await db.execute(sql`
        SELECT id, email, username, role 
        FROM public.users 
        WHERE email ILIKE ${email}
      `);
      
      if ((businessCheck as any).rows && (businessCheck as any).rows.length > 0) {
        console.log(`✓ Found user in public.users: ${businessCheck.rows[0].email}`);
        
        // 更新public.users表的角色
        const updateBusiness = await db.execute(sql`
          UPDATE public.users 
          SET role = 'admin'
          WHERE email ILIKE ${email}
          RETURNING id, email, username, role
        `);
        
        console.log('✓ Updated public.users role to admin');
        break;
      } else {
        console.log(`- User not found in public.users with email: ${email}`);
      }
    }
    
    console.log('\n✅ Attempt to update admin roles completed.');
    
  } catch (error) {
    console.error('Error during update:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
directUpdate().catch(console.error);
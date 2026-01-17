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

async function simpleUpdate() {
  const email = 'athendrakomin@proton.me';
  const username = 'AthenDrakomin';
  const name = 'System Administrator';
  
  console.log('Performing simple admin role update...');
  
  try {
    // 1. 尝试更新auth.users表
    console.log('1. Updating auth.users table...');
    
    // 首先检查用户是否存在
    const checkAuth = await db.execute(sql`
      SELECT id, email, raw_user_meta_data, role 
      FROM auth.users 
      WHERE email = ${email}
    `);
    
    if ((checkAuth as any).rows && Array.isArray((checkAuth as any).rows) && (checkAuth as any).rows.length > 0) {
      // 用户存在，更新角色
      console.log('   User exists, updating role...');
      await db.execute(sql`
        UPDATE auth.users 
        SET 
          raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin'),
          role = 'admin'
        WHERE email = ${email}
      `);
      console.log('   ✓ Updated auth.users role to admin');
    } else {
      console.log('   User not found in auth.users, skipping update');
    }
    
    // 2. 更新public.users表
    console.log('2. Updating public.users table...');
    
    const checkBusiness = await db.execute(sql`
      SELECT id, email, role 
      FROM public.users 
      WHERE email = ${email}
    `);
    
    if ((checkBusiness as any).rows && Array.isArray((checkBusiness as any).rows) && (checkBusiness as any).rows.length > 0) {
      // 用户存在，更新角色
      console.log('   User exists, updating role...');
      await db.execute(sql`
        UPDATE public.users 
        SET role = 'admin'
        WHERE email = ${email}
      `);
      console.log('   ✓ Updated public.users role to admin');
    } else {
      console.log('   User not found in public.users, skipping update');
    }
    
    // 3. 如果两个表都没有该用户，输出提示信息
    const authCount = (checkAuth as any).rows ? (checkAuth as any).rows.length : 0;
    const businessCount = (checkBusiness as any).rows ? (checkBusiness as any).rows.length : 0;
    
    if (authCount === 0 && businessCount === 0) {
      console.log('\n⚠️  Warning: No user found with email ' + email);
      console.log('   You may need to create the user first through the application');
      console.log('   or manually in the database.');
    } else {
      // 只有在找到用户时才进行验证
      console.log('\n3. Verifying update...');
      const verification = await db.execute(sql`
        SELECT 
          au.email as auth_email,
          COALESCE(au.raw_user_meta_data->>'role', au.role) as auth_role,
          pu.role as business_role
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE au.email = ${email}
      `);
      
      if ((verification as any).rows && Array.isArray((verification as any).rows) && (verification as any).rows.length > 0) {
        console.log('   ✓ Verification successful:');
        console.log(`     Auth Role: ${(verification as any).rows[0].auth_role}`);
        console.log(`     Business Role: ${(verification as any).rows[0].business_role}`);
      } else {
        console.log('   - No user found for verification');
      }
    }
    
    console.log('\n✅ Simple update completed!');
    
  } catch (error) {
    console.error('Error during update:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
simpleUpdate().catch(console.error);
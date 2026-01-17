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

async function checkAndFixUser() {
  const email = 'athendrakomin@proton.me';
  
  console.log(`Checking user: ${email}`);
  
  try {
    // 检查auth.users表中的用户
    console.log('1. Checking auth.users table...');
    const authUsers = await db.execute(sql`
      SELECT id, email, raw_user_meta_data, role 
      FROM auth.users 
      WHERE email ILIKE ${email}
    `);
    
    console.log('Auth users found:', (authUsers as any).rows?.length || 0);
    if ((authUsers as any).rows && (authUsers as any).rows.length > 0) {
      console.log('Auth user details:', (authUsers as any).rows[0]);
      
      // 更新auth.users表中的角色
      console.log('Updating role in auth.users...');
      const updateAuth = await db.execute(sql`
        UPDATE auth.users 
        SET 
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
          role = 'admin'
        WHERE email ILIKE ${email}
        RETURNING id, email, raw_user_meta_data, role
      `);
      
      console.log('Auth user updated:', (updateAuth as any).rows[0]);
    } else {
      console.log('No user found in auth.users table');
    }
    
    // 检查public.users表中的用户
    console.log('\n2. Checking public.users table...');
    const businessUsers = await db.execute(sql`
      SELECT id, email, username, role 
      FROM public.users 
      WHERE email ILIKE ${email}
    `);
    
    console.log('Business users found:', (businessUsers as any).rows?.length || 0);
    if ((businessUsers as any).rows && (businessUsers as any).rows.length > 0) {
      console.log('Business user details:', (businessUsers as any).rows[0]);
      
      // 更新public.users表中的角色
      console.log('Updating role in public.users...');
      const updateBusiness = await db.execute(sql`
        UPDATE public.users 
        SET role = 'admin'
        WHERE email ILIKE ${email}
        RETURNING id, email, username, role
      `);
      
      console.log('Business user updated:', (updateBusiness as any).rows[0]);
    } else {
      console.log('No user found in public.users table');
      
      // 尝试查找auth.users表中的用户ID并创建业务用户
      const authUserResult = await db.execute(sql`
        SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as name
        FROM auth.users 
        WHERE email ILIKE ${email}
      `);
      
      if ((authUserResult as any).rows && (authUserResult as any).rows.length > 0) {
        const authUser = (authUserResult as any).rows[0];
        
        console.log('Creating business user based on auth user...');
        const insertBusiness = await db.execute(sql`
          INSERT INTO public.users (
            id, email, username, name, role, partner_id, auth_type, 
            email_verified, is_active, created_at, updated_at
          ) VALUES (
            ${authUser.id},
            ${authUser.email},
            split_part(${authUser.email}, '@', 1),
            ${authUser.name},
            'admin',
            NULL,
            'credentials',
            TRUE,
            TRUE,
            NOW(),
            NOW()
          )
          ON CONFLICT (id) 
          DO UPDATE SET 
            role = 'admin',
            updated_at = NOW()
          RETURNING id, email, username, role
        `);
        
        console.log('Business user created/updated:', (insertBusiness as any).rows[0]);
      } else {
        console.log('No matching user found in auth.users to create business user');
      }
    }
    
    // 最终验证
    console.log('\n3. Final verification...');
    const finalCheck = await db.execute(sql`
      SELECT 
        au.id as auth_id,
        au.email as auth_email,
        COALESCE(au.raw_user_meta_data->>'role', au.role) as auth_role,
        pu.role as business_role,
        pu.username as business_username
      FROM auth.users au
      LEFT JOIN public.users pu ON au.id = pu.id
      WHERE au.email ILIKE ${email}
    `);
    
    if ((finalCheck as any).rows && (finalCheck as any).rows.length > 0) {
      console.log('Final verification result:', (finalCheck as any).rows[0]);
      console.log('\n✅ User roles successfully updated to admin in both tables!');
    } else {
      console.log('No user found after update');
    }
    
  } catch (error) {
    console.error('Error during update:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
checkAndFixUser().catch(console.error);
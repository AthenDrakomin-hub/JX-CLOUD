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

async function fixAdminRole() {
  const email = 'athendrakomin@proton.me';
  
  console.log(`Updating admin role for user: ${email}`);
  
  try {
    // 首先检查用户是否在auth表中存在
    console.log('Checking if user exists in auth.users table...');
    const checkAuthUserResult = await db.execute(sql`
      SELECT id, email, raw_user_meta_data->>'full_name' as name, raw_user_meta_data->>'role' as role 
      FROM auth.users 
      WHERE email = ${email}
    `);
    
    console.log('Found auth user records:', (checkAuthUserResult as any).rows?.length || 0);
    
    if ((checkAuthUserResult as any).rows && Array.isArray((checkAuthUserResult as any).rows) && (checkAuthUserResult as any).rows.length > 0) {
      // 用户存在，更新认证表中的角色
      console.log('User found, updating role in auth.users table...');
      const updateAuthResult = await db.execute(sql`
        UPDATE auth.users 
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin')
        WHERE email = ${email} 
        RETURNING id, email, raw_user_meta_data->>'role' as role
      `);
      
      console.log('Auth users table updated:', (updateAuthResult as any).rows);
      
      // 更新业务表中的角色
      const userRecord = (checkAuthUserResult as any).rows[0];
      console.log('Updating public.users table...');
      await db.execute(sql`
        INSERT INTO public.users (id, email, username, name, role, partner_id, auth_type, email_verified, is_active, created_at, updated_at)
        VALUES (
          ${userRecord.id}, 
          ${userRecord.email}, 
          ${userRecord.email.split('@')[0]}, 
          COALESCE(${userRecord.name}, ${userRecord.email.split('@')[0]}), 
          'admin', 
          NULL, 
          'credentials', 
          true, 
          true, 
          NOW(), 
          NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
          role = 'admin',
          updated_at = NOW()
      `);
      
      console.log('Public users table updated successfully');
    } else {
      console.log('User not found in auth.users table, creating new admin user...');
      
      // 用户不存在，创建新用户
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 在认证表中创建用户
      await db.execute(sql`
        INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at) 
        VALUES (
          ${newUserId}, 
          ${email}, 
          jsonb_build_object('role', 'admin', 'full_name', 'System Administrator'), 
          NOW(), 
          NOW()
        )
      `);
      
      // 在业务表中也创建记录
      await db.execute(sql`
        INSERT INTO public.users (id, email, username, name, role, partner_id, auth_type, email_verified, is_active, created_at, updated_at)
        VALUES (
          ${newUserId},
          ${email},
          'AthenDrakomin',
          'System Administrator',
          'admin',
          NULL,
          'credentials',
          true,
          true,
          NOW(),
          NOW()
        )
      `);
      
      console.log('New admin user created in both tables');
    }
    
    // 验证更新结果
    console.log('\nVerifying the update...');
    const verification = await db.execute(sql`
      SELECT 
        au.id as auth_id,
        au.email as auth_email,
        au.raw_user_meta_data->>'role' as auth_role,
        pu.role as business_role,
        pu.username as business_username
      FROM auth.users au
      LEFT JOIN public.users pu ON au.id = pu.id
      WHERE au.email = ${email}
    `);
    
    console.log('Verification result:', verification.rows);
    
    console.log('\nAdmin role fix completed successfully!');
    
  } catch (error) {
    console.error('Error updating admin role:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
fixAdminRole().catch(console.error);
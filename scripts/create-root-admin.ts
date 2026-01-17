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

async function createRootAdmin() {
  const email = 'athendrakomin@proton.me';
  const username = 'AthenDrakomin';
  const name = 'System Administrator';
  
  console.log('Creating root admin user if not exists...');
  
  try {
    // 检查用户是否已存在
    const checkAuthUser = await db.execute(sql`
      SELECT id, email, role 
      FROM auth.users 
      WHERE email ILIKE ${email}
    `);
    
    let userId: string;
    
    if ((checkAuthUser as any).rows && (checkAuthUser as any).rows.length > 0) {
      // 用户已存在，更新其角色
      console.log('User already exists in auth.users, updating role...');
      const updateResult = await db.execute(sql`
        UPDATE auth.users 
        SET 
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin', 'full_name', ${name}),
          role = 'admin',
          email_confirmed_at = NOW()
        WHERE email ILIKE ${email}
        RETURNING id, email, role
      `);
      
      userId = updateResult.rows[0].id;
      console.log(`✓ Updated existing user in auth.users with ID: ${userId}`);
    } else {
      // 用户不存在，创建新用户
      console.log('Creating new user in auth.users...');
      
      // 使用PostgreSQL的gen_random_uuid()函数创建用户
      const insertAuthUser = await db.execute(sql`
        INSERT INTO auth.users (
          id, 
          email, 
          encrypted_password,
          email_confirmed_at,
          raw_user_meta_data,
          created_at,
          updated_at,
          role
        ) VALUES (
          gen_random_uuid(), -- 使用PostgreSQL的UUID生成函数
          ${email},
          NULL, -- 密码为空，因为将使用passkey
          NOW(), -- 确认邮箱
          jsonb_build_object('role', 'admin', 'full_name', ${name}::text, 'username', ${username}::text)::jsonb,
          NOW(),
          NOW(),
          'admin'
        )
        ON CONFLICT (email) DO UPDATE SET
          raw_user_meta_data = EXCLUDED.raw_user_meta_data || jsonb_build_object('role', 'admin'),
          role = 'admin'
        RETURNING id
      `);
      
      userId = insertAuthUser.rows[0].id;
      console.log(`✓ Created new user in auth.users with ID: ${userId}`);
    }
    
    // 现在在public.users表中创建或更新用户
    const checkBusinessUser = await db.execute(sql`
      SELECT id, email, role 
      FROM public.users 
      WHERE email ILIKE ${email}
    `);
    
    if ((checkBusinessUser as any).rows && (checkBusinessUser as any).rows.length > 0) {
      // 用户已存在，更新其角色
      console.log('User already exists in public.users, updating role...');
      const updateResult = await db.execute(sql`
        UPDATE public.users 
        SET 
          role = 'admin',
          username = ${username},
          name = ${name},
          updated_at = NOW()
        WHERE email ILIKE ${email}
        RETURNING id, email, role
      `);
      
      console.log(`✓ Updated existing user in public.users with ID: ${updateResult.rows[0].id}`);
    } else {
      // 用户不存在，创建新用户
      console.log('Creating new user in public.users...');
      const insertBusinessUser = await db.execute(sql`
        INSERT INTO public.users (
          id, email, username, name, role, partner_id, auth_type, 
          email_verified, is_active, created_at, updated_at
        ) VALUES (
          ${userId}, -- 使用auth.users中的相同ID
          ${email},
          ${username},
          ${name},
          'admin',
          NULL,
          'passkey', -- 使用passkey认证
          TRUE,
          TRUE,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          role = 'admin',
          updated_at = NOW()
        RETURNING id, email, role
      `);
      
      console.log(`✓ Created new user in public.users with ID: ${insertBusinessUser.rows[0].id}`);
    }
    
    // 验证最终结果
    console.log('\nVerifying the root admin user...');
    const verification = await db.execute(sql`
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
    
    if ((verification as any).rows && (verification as any).rows.length > 0) {
      console.log('✓ Root admin user verified successfully:');
      console.log(`  Auth Role: ${verification.rows[0].auth_role}`);
      console.log(`  Business Role: ${verification.rows[0].business_role}`);
      console.log(`  Username: ${verification.rows[0].business_username}`);
      console.log('\n✅ Root admin user successfully created/updated in both tables!');
    } else {
      console.log('⚠️ Warning: Could not verify user after creation');
    }
    
  } catch (error) {
    console.error('Error creating root admin:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
createRootAdmin().catch(console.error);
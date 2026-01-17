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

async function forceCreateAdmin() {
  console.log('Force creating root admin user in both tables...');
  
  try {
    // 确保public.users表存在
    console.log('Ensuring public.users table exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY, 
        username TEXT UNIQUE, 
        email TEXT UNIQUE, 
        name TEXT, 
        role TEXT DEFAULT 'staff', 
        partner_id TEXT, 
        auth_type TEXT DEFAULT 'credentials', 
        email_verified BOOLEAN DEFAULT false, 
        is_active BOOLEAN DEFAULT true, 
        module_permissions JSONB, 
        created_at TIMESTAMPTZ DEFAULT NOW(), 
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ public.users table ensured');
    
    // 检查并创建函数和触发器
    try {
      // 首先创建函数
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
      `);
      
      // 然后创建触发器（如果不存在）
      await db.execute(sql`
        CREATE OR REPLACE TRIGGER users_updated_at_trigger
            BEFORE UPDATE ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
      `);
      console.log('✓ Function and trigger ensured');
    } catch (triggerError) {
      console.log('Info: Function/triggers may already exist, continuing...');
    }
    
    // 检查用户是否已存在
    const checkUser = await db.execute(sql`
      SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
    `);
    
    if ((checkUser as any).rows && (checkUser as any).rows.length > 0) {
      // 用户存在，更新角色
      console.log('Root admin user exists, updating role to admin...');
      await db.execute(sql`
        UPDATE public.users 
        SET role = 'admin', name = '系统总监', username = 'AthenDrakomin'
        WHERE email = 'athendrakomin@proton.me'
      `);
      console.log('✓ Root admin user updated in public.users');
    } else {
      // 用户不存在，创建用户
      console.log('Creating root admin user in public.users...');
      await db.execute(sql`
        INSERT INTO public.users (
          id, username, email, name, role, partner_id, auth_type, 
          email_verified, is_active, created_at, updated_at
        ) VALUES (
          'admin-root-' || EXTRACT(EPOCH FROM NOW())::TEXT,
          'AthenDrakomin',
          'athendrakomin@proton.me',
          '系统总监',
          'admin',
          NULL,
          'passkey',
          TRUE,
          TRUE,
          NOW(),
          NOW()
        )
      `);
      console.log('✓ Root admin user created in public.users');
    }
    
    // 现在处理auth.users表，确保表存在
    console.log('Ensuring auth.users table exists...');
    try {
      // 这里我们假设Supabase Auth已经存在，尝试更新或插入
      const checkAuthUser = await db.execute(sql`
        SELECT id, email, role FROM auth.users WHERE email = 'athendrakomin@proton.me'
      `);
      
      if ((checkAuthUser as any).rows && (checkAuthUser as any).rows.length > 0) {
        // 用户存在，更新角色
        console.log('Root admin user exists in auth.users, updating role...');
        await db.execute(sql`
          UPDATE auth.users 
          SET 
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin', 'full_name', '系统总监'),
            role = 'admin'
          WHERE email = 'athendrakomin@proton.me'
        `);
        console.log('✓ Root admin user updated in auth.users');
      } else {
        console.log('User not found in auth.users (expected if using external auth service)');
      }
    } catch (authError) {
      console.log('Info: auth.users table may not be accessible (depends on Supabase Auth setup)');
      console.log('This is normal if using external auth service');
    }
    
    // 最终验证
    console.log('\nFinal verification:');
    const verification = await db.execute(sql`
      SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
    `);
    
    if ((verification as any).rows && (verification as any).rows.length > 0) {
      console.log('✅ SUCCESS: Root admin user verified in public.users:');
      console.log(`   ID: ${(verification as any).rows[0].id}`);
      console.log(`   Username: ${(verification as any).rows[0].username}`);
      console.log(`   Email: ${(verification as any).rows[0].email}`);
      console.log(`   Role: ${(verification as any).rows[0].role}`);
      console.log('\n🚀 You can now log in with athendrakomin@proton.me as admin!');
    } else {
      console.log('❌ Root admin user was not found after creation');
    }
    
  } catch (error) {
    console.error('Error during admin creation:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
forceCreateAdmin().catch(console.error);
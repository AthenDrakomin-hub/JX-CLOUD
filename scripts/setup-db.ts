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

async function executeSqlSetup() {
  console.log('Executing database setup script...');
  
  try {
    // 检查并创建handle_updated_at函数
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Function handle_updated_at created/updated');
    
    // 检查并创建public.user表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN DEFAULT false,
        image TEXT,
        role TEXT DEFAULT 'user',
        partner_id TEXT,
        module_permissions JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Table public.user created/verified');
    
    // 检查并创建public.session表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        token TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✓ Table public.session created/verified');
    
    // 检查并创建其他业务表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.system_config (
        id TEXT PRIMARY KEY DEFAULT 'global', 
        hotel_name TEXT DEFAULT '江西云厨酒店', 
        version TEXT DEFAULT '8.8.0', 
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ Table public.system_config created/verified');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY, 
        username TEXT UNIQUE NOT NULL, 
        email TEXT, 
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
    console.log('✓ Table public.users created/verified');
    
    // 创建触发器
    await db.execute(sql`
      CREATE OR REPLACE TRIGGER users_updated_at_trigger
          BEFORE UPDATE ON public.users
          FOR EACH ROW
          EXECUTE FUNCTION handle_updated_at();
    `);
    console.log('✓ Trigger users_updated_at_trigger created/verified');
    
    // 创建根管理员用户
    await db.execute(sql`
      INSERT INTO public.users (id, username, email, name, role) VALUES 
      ('admin-root', 'AthenDrakomin', 'athendrakomin@proton.me', '系统总监', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✓ Root admin user created/verified');
    
    // 验证用户是否已创建
    const verification = await db.execute(sql`
      SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
    `);
    
    if ((verification as any).rows && (verification as any).rows.length > 0) {
      console.log('✓ Root admin user verified:');
      console.log(`  ID: ${(verification as any).rows[0].id}`);
      console.log(`  Username: ${(verification as any).rows[0].username}`);
      console.log(`  Email: ${(verification as any).rows[0].email}`);
      console.log(`  Role: ${(verification as any).rows[0].role}`);
    } else {
      console.log('⚠️ Root admin user was not created');
    }
    
    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error during database setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 运行函数
executeSqlSetup().catch(console.error);
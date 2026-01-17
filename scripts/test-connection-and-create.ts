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

async function testConnection() {
  console.log('Testing connection and checking for tables...');
  
  try {
    // 简单查询测试连接
    const result = await db.execute(sql`SELECT version();`);
    console.log('✓ Database connection successful');
    if (result && (result as any).rows && (result as any).rows.length > 0) {
      console.log('Version info:', (result as any).rows[0]);
    } else {
      console.log('Could not get version info');
    }
    
    // 查询所有表（使用sql标签函数）
    const tablesResult = await db.execute(sql`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `);
    console.log('\nTables found in database:');
    
    if ((tablesResult as any).rows && Array.isArray((tablesResult as any).rows) && (tablesResult as any).rows.length > 0) {
      (tablesResult as any).rows.forEach((row: any) => {
        console.log(`- ${row.schemaname}.${row.tablename}`);
      });
      
      // 检查特定的表是否存在
      const usersTableExists = (tablesResult as any).rows.some((row: any) => 
        row.tablename === 'users' && row.schemaname === 'public'
      );
      
      if (usersTableExists) {
        console.log('\n✓ public.users table exists!');
        
        // 尝试查询用户
        try {
          // 首先尝试创建根用户
          console.log('Creating root admin user...');
          await db.execute(sql`
            INSERT INTO public.users (id, username, email, name, role) 
            VALUES ('admin-root', 'AthenDrakomin', 'athendrakomin@proton.me', '系统总监', 'admin')
            ON CONFLICT (email) DO UPDATE SET role = 'admin'
          `);
          
          console.log('✓ Root admin user created/updated successfully');
          
          // 验证用户
          const userResult = await db.execute(sql`
            SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
          `);
          
          if ((userResult as any).rows && Array.isArray((userResult as any).rows) && (userResult as any).rows.length > 0) {
            console.log('\n✅ SUCCESS: Root admin user verified:');
            console.log(`   ID: ${(userResult as any).rows[0].id}`);
            console.log(`   Username: ${(userResult as any).rows[0].username}`);
            console.log(`   Email: ${(userResult as any).rows[0].email}`);
            console.log(`   Role: ${(userResult as any).rows[0].role}`);
            console.log('\n🚀 You can now log in with athendrakomin@proton.me as admin!');
          } else {
            console.log('\n❌ Root admin user was not found after creation');
          }
        } catch (userError: any) {
          console.error('Error creating user:', userError.message);
          if (userError.code) {
            console.log('Error code:', userError.code);
          }
        }
      } else {
        console.log('\n❌ public.users table does not exist');
        if ((tablesResult as any).rows) {
          console.log('Available tables:', (tablesResult as any).rows.map((row: any) => `${row.schemaname}.${row.tablename}`));
        }
      }
    } else {
      console.log('No custom tables found in database');
    }
    
  } catch (error) {
    console.error('Error during connection test:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
testConnection().catch(console.error);
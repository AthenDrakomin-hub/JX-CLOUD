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

async function checkTablesDirect() {
  console.log('Checking tables using direct postgres client...');
  
  try {
    // 直接使用postgres客户端查询所有表
    const result = await client`SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
      ORDER BY table_schema, table_name`;
    
    console.log('All tables in database:');
    if (Array.isArray(result) && result.length > 0) {
      result.forEach((row: any) => {
        console.log(`- ${row.table_schema}.${row.table_name}`);
      });
      
      // 特别检查是否有users表
      const usersTables = result.filter((row: any) => 
        row.table_name.toLowerCase().includes('user')
      );
      
      console.log('\nUser-related tables:');
      usersTables.forEach((row: any) => {
        console.log(`- ${row.table_schema}.${row.table_name}`);
      });
      
      // 如果存在users表，检查其内容
      const hasPublicUsers = usersTables.some((row: any) => 
        row.table_name === 'users' && row.table_schema === 'public'
      );
      
      if (hasPublicUsers) {
        console.log('\nChecking public.users table content...');
        const userCheck = await client`SELECT id, username, email, role FROM public.users LIMIT 10`;
        
        console.log('Users in public.users table:');
        if (Array.isArray(userCheck) && userCheck.length > 0) {
          userCheck.forEach((user: any) => {
            console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
          });
          
          // 检查是否有所需的管理员账户
          const adminCheck = await client`SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'`;
          
          if (Array.isArray(adminCheck) && adminCheck.length > 0) {
            console.log('\n✅ Root admin user FOUND:');
            adminCheck.forEach((user: any) => {
              console.log(`   ID: ${user.id}`);
              console.log(`   Username: ${user.username}`);
              console.log(`   Email: ${user.email}`);
              console.log(`   Role: ${user.role}`);
            });
            console.log('\n🚀 You can now log in with athendrakomin@proton.me as admin!');
          } else {
            console.log("\n❌ Root admin user 'athendrakomin@proton.me' not found");
            
            // 创建管理员用户
            console.log('Creating root admin user...');
            try {
              await client`INSERT INTO public.users (id, username, email, name, role, partner_id, auth_type, email_verified, is_active, created_at, updated_at) 
                VALUES (${'admin-root-' + Date.now()}, ${'AthenDrakomin'}, ${'athendrakomin@proton.me'}, ${'系统总监'}, ${'admin'}, ${null}, ${'passkey'}, ${true}, ${true}, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET role = 'admin', updated_at = NOW()`;
              
              console.log('✓ Root admin user created/updated');
              
              // 验证创建结果
              const verification = await client`SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'`;
              
              if (Array.isArray(verification) && verification.length > 0) {
                console.log('\n✅ Root admin user verified:');
                verification.forEach((user: any) => {
                  console.log(`   ID: ${user.id}`);
                  console.log(`   Username: ${user.username}`);
                  console.log(`   Email: ${user.email}`);
                  console.log(`   Role: ${user.role}`);
                });
                console.log('\n🚀 You can now log in with athendrakomin@proton.me as admin!');
              }
            } catch (creationError: any) {
              console.error('Error creating admin user:', creationError.message);
            }
          }
        } else {
          console.log('No users found in public.users table');
          
          // 创建管理员用户
          console.log('Creating root admin user...');
          try {
            await client`INSERT INTO public.users (id, username, email, name, role, partner_id, auth_type, email_verified, is_active, created_at, updated_at) 
              VALUES (${'admin-root-' + Date.now()}, ${'AthenDrakomin'}, ${'athendrakomin@proton.me'}, ${'系统总监'}, ${'admin'}, ${null}, ${'passkey'}, ${true}, ${true}, NOW(), NOW())`;
            
            console.log('✓ Root admin user created');
            
            // 验证创建结果
            const verification = await client`SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'`;
            
            if (Array.isArray(verification) && verification.length > 0) {
              console.log('\n✅ Root admin user verified:');
              verification.forEach((user: any) => {
                console.log(`   ID: ${user.id}`);
                console.log(`   Username: ${user.username}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
              });
              console.log('\n🚀 You can now log in with athendrakomin@proton.me as admin!');
            }
          } catch (creationError: any) {
            console.error('Error creating admin user:', creationError.message);
            if (creationError.code === '23505') { // unique violation
              console.log('User might already exist, attempting update...');
              await client`UPDATE public.users SET role = 'admin' WHERE email = 'athendrakomin@proton.me'`;
              console.log('✓ User role updated to admin');
            }
          }
        }
      } else {
        console.log('\n❌ public.users table does not exist');
        console.log('Available tables:', result.map((row: any) => `${row.table_schema}.${row.table_name}`));
      }
    } else {
      console.log('No tables found in database');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
checkTablesDirect().catch(console.error);
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

async function checkActualStructure() {
  console.log('Checking actual structure of public.users table...');
  
  try {
    // 获取表的列信息
    const columns = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in public.users table:');
    if ((columns as any).rows && Array.isArray((columns as any).rows)) {
      (columns as any).rows.forEach((col: any) => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
      
      // 现在尝试插入用户，只使用存在的列
      console.log('\nAttempting to create root admin user with existing columns...');
      
      // 检查用户是否已存在
      const checkExisting = await db.execute(sql`
        SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
      `);
      
      if ((checkExisting as any).rows && (checkExisting as any).rows.length > 0) {
        // 用户存在，更新角色
        console.log('Root admin user exists, updating role to admin...');
        await db.execute(sql`
          UPDATE public.users 
          SET role = 'admin' 
          WHERE email = 'athendrakomin@proton.me'
        `);
        console.log('✓ Root admin user role updated');
      } else {
        // 用户不存在，创建用户
        // 构建INSERT语句，只包含实际存在的列
        const existingColumns = (columns as any).rows.map((col: any) => col.column_name);
        console.log('Available columns:', existingColumns);
        
        // 确定哪些是我们需要的列
        const hasId = existingColumns.includes('id');
        const hasUsername = existingColumns.includes('username');
        const hasEmail = existingColumns.includes('email');
        const hasName = existingColumns.includes('name');
        const hasRole = existingColumns.includes('role');
        const hasPartnerId = existingColumns.includes('partner_id');
        
        let insertQuery = 'INSERT INTO public.users (';
        const values: any[] = [];
        let valuePlaceholders: string[] = [];
        
        // 添加必须的列
        if (hasId) {
          insertQuery += 'id, ';
          values.push('admin-root-' + Date.now());
          valuePlaceholders.push('$1');
        }
        if (hasUsername) {
          insertQuery += 'username, ';
          values.push('AthenDrakomin');
          valuePlaceholders.push(hasId ? '$2' : '$1');
        }
        if (hasEmail) {
          insertQuery += 'email, ';
          values.push('athendrakomin@proton.me');
          valuePlaceholders.push(hasId ? (hasUsername ? '$3' : '$2') : (hasUsername ? '$2' : '$1'));
        }
        if (hasName) {
          insertQuery += 'name, ';
          values.push('系统总监');
          const pos = (hasId ? 1 : 0) + (hasUsername ? 1 : 0) + (hasEmail ? 1 : 0) + 1;
          valuePlaceholders.push(`$${pos}`);
        }
        if (hasRole) {
          insertQuery += 'role, ';
          values.push('admin');
          const pos = (hasId ? 1 : 0) + (hasUsername ? 1 : 0) + (hasEmail ? 1 : 0) + (hasName ? 1 : 0) + 1;
          valuePlaceholders.push(`$${pos}`);
        }
        if (hasPartnerId) {
          insertQuery += 'partner_id, ';
          values.push(null);
          const pos = (hasId ? 1 : 0) + (hasUsername ? 1 : 0) + (hasEmail ? 1 : 0) + (hasName ? 1 : 0) + (hasRole ? 1 : 0) + 1;
          valuePlaceholders.push(`$${pos}`);
        }
        
        // 移除最后的逗号和空格
        insertQuery = insertQuery.slice(0, -2);
        insertQuery += ') VALUES (' + valuePlaceholders.join(', ') + ')';
        
        if (hasId && hasUsername && hasEmail && hasRole) { // 至少要有这些基本列
          console.log('Executing insert with query:', insertQuery);
          try {
            await client.query(insertQuery, values);
            console.log('✓ Root admin user created successfully');
          } catch (insertError) {
            console.error('Error inserting user:', insertError);
          }
        } else {
          console.log('Required columns are missing, cannot create user');
        }
      }
      
      // 验证结果
      const verification = await db.execute(sql`
        SELECT id, username, email, role FROM public.users WHERE email = 'athendrakomin@proton.me'
      `);
      
      if ((verification as any).rows && (verification as any).rows.length > 0) {
        console.log('\n✅ SUCCESS: Root admin user verified:');
        console.log(`   ID: ${(verification as any).rows[0].id}`);
        console.log(`   Username: ${(verification as any).rows[0].username}`);
        console.log(`   Email: ${(verification as any).rows[0].email}`);
        console.log(`   Role: ${(verification as any).rows[0].role}`);
        console.log('\n🚀 You can now log in with athendrakomin@proton.me as admin!');
      } else {
        console.log('\n❌ Root admin user was not found after creation');
      }
    } else {
      console.log('No columns found in public.users table');
    }
    
  } catch (error) {
    console.error('Error checking structure:', error);
  } finally {
    await client.end();
  }
}

// 运行函数
checkActualStructure().catch(console.error);
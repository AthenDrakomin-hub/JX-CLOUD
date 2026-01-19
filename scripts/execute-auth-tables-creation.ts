import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量获取数据库连接信息
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 或 POSTGRES_URL 环境变量未设置');
  process.exit(1);
}

async function createMissingAuthTables() {
  console.log('🚀 开始创建缺失的 Better-Auth 表...');
  
  const sql = postgres(connectionString);
  
  try {
    // 读取 SQL 文件
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'create-missing-auth-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割成单独的语句执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 执行 ${statements.length} 个 SQL 语句...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('select')) {
        // 对于 SELECT 语句，执行并显示结果
        const result = await sql.unsafe(statement);
        console.log(`✅ 语句 ${i + 1}: ${result[0]?.status || '执行成功'}`);
      } else {
        // 对于其他语句，直接执行
        await sql.unsafe(statement);
        console.log(`✅ 语句 ${i + 1} 执行成功`);
      }
    }
    
    // 验证表是否创建成功
    console.log('\n🔍 验证新创建的表:');
    const newTables = ['account', 'verification', 'passkey'];
    
    for (const table of newTables) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          ) AS table_exists;
        `;
        
        if (result[0].table_exists) {
          console.log(`✅ ${table} 表已成功创建`);
          
          // 显示表结构
          const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = ${table} AND table_schema = 'public'
            ORDER BY ordinal_position;
          `;
          
          console.log(`   字段结构:`);
          columns.forEach(col => {
            console.log(`     ${col.column_name}: ${col.data_type}`);
          });
        } else {
          console.log(`❌ ${table} 表创建失败`);
        }
      } catch (error) {
        console.log(`❌ 验证 ${table} 表时出错: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Better-Auth 表创建和验证完成！');
    
    await sql.end();
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行创建表操作
createMissingAuthTables();
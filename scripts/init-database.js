import postgres from 'postgres';
import { readFileSync } from 'fs';

// 从环境变量获取数据库URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

async function initializeDatabase() {
  console.log('🚀 开始数据库初始化...');
  
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('✅ 数据库连接成功');
    
    // 测试连接
    await sql`SELECT 1`;
    console.log('✅ 数据库连接测试通过');
    
    // 读取并执行数据库初始化脚本
    const initSql = readFileSync('./database_setup.sql', 'utf8');
    console.log('📄 执行数据库初始化脚本...');
    // 将SQL脚本按分号分割并逐个执行
    const statements = initSql.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    console.log('✅ 数据库初始化完成');
    
    // 读取并执行翻译表脚本
    const translationsSql = readFileSync('./database/translations-table.sql', 'utf8');
    console.log('📄 执行翻译表初始化...');
    const translationStatements = translationsSql.split(';').filter(stmt => stmt.trim());
    for (const statement of translationStatements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    console.log('✅ 翻译表初始化完成');
    
    // 读取并执行注册请求表脚本
    const registrationSql = readFileSync('./database/registration-requests.sql', 'utf8');
    console.log('📄 执行注册请求表初始化...');
    const registrationStatements = registrationSql.split(';').filter(stmt => stmt.trim());
    for (const statement of registrationStatements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    console.log('✅ 注册请求表初始化完成');
    
    console.log('🎉 所有数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// 执行初始化
initializeDatabase().catch(console.error);
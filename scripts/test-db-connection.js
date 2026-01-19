import postgres from 'postgres';

// 使用.env文件中的远程数据库连接
const DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function testDatabaseConnection() {
  console.log('🚀 测试数据库连接...');
  
  const sql = postgres(DATABASE_URL, {
    ssl: 'require'
  });
  
  try {
    // 测试连接
    const result = await sql`SELECT version()`;
    console.log('✅ 数据库连接成功!');
    console.log(' PostgreSQL版本:', result[0].version);
    
    // 测试查询现有表
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 现有数据表:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('🎉 数据库连接测试完成！');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// 执行测试
testDatabaseConnection().catch(console.error);
import postgres from 'postgres';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量获取数据库连接信息
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 或 POSTGRES_URL 环境变量未设置');
  process.exit(1);
}

async function checkAndCleanDuplicateTables() {
  console.log('🔍 检查重复的通行密钥相关表...');
  
  const sql = postgres(connectionString);
  
  try {
    // 查找所有与通行密钥相关的表
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%passkey%' OR table_name ILIKE '%credential%' OR table_name ILIKE '%webauthn%')
      ORDER BY table_name;
    `;
    
    console.log('📋 找到的通行密钥相关表:');
    result.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    // 如果找到多个相关表，询问用户要保留哪个
    if (result.length > 1) {
      console.log('\n⚠️  发现多个通行密钥相关表，可能存在重复');
      
      // 显示每个表的详细信息
      for (const table of result) {
        try {
          const countResult = await sql`
            SELECT COUNT(*) as count FROM ${sql(table.table_name)}
          `;
          
          const columnsResult = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = ${table.table_name} AND table_schema = 'public'
            ORDER BY ordinal_position
          `;
          
          console.log(`\n📄 表: ${table.table_name}`);
          console.log(`   记录数: ${countResult[0].count}`);
          console.log(`   字段: ${columnsResult.map(col => col.column_name).join(', ')}`);
        } catch (error) {
          console.log(`\n📄 表: ${table.table_name} (无法获取详细信息)`);
        }
      }
      
      console.log('\n💡 建议保留字段更完整、记录数更多的表');
      console.log('请输入要删除的表名（谨慎操作！）:');
      
    } else if (result.length === 1) {
      console.log('\n✅ 只找到一个通行密钥表，无需清理');
    } else {
      console.log('\n❌ 未找到任何通行密钥相关表');
    }
    
    await sql.end();
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行检查
checkAndCleanDuplicateTables();
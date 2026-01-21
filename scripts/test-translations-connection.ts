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

async function testTranslationsConnection() {
  console.log('🚀 测试数据库连接和 translations 表...');
  
  const sql = postgres(connectionString!);
  
  try {
    // 查询 translations 表的前几条记录
    const result = await sql`
      SELECT key, language, value, namespace 
      FROM public.translations 
      LIMIT 5
    `;
    
    console.log(`✅ 成功连接到数据库，找到 ${result.length} 条翻译记录`);
    
    if (result.length > 0) {
      console.log('\n📋 示例翻译记录:');
      result.forEach((record, index) => {
        console.log(`  ${index + 1}. [${record.language}] ${record.namespace}:${record.key} = "${record.value}"`);
      });
    }
    
    // 检查不同语言的数量
    const langStats = await sql`
      SELECT language, COUNT(*) as count 
      FROM public.translations 
      GROUP BY language 
      ORDER BY language
    `;
    
    console.log('\n📊 翻译统计:');
    langStats.forEach(stat => {
      console.log(`  ${stat.language}: ${stat.count} 条`);
    });
    
    console.log('\n🎉 数据库连接和 translations 表测试成功！');
    
    await sql.end();
  } catch (error) {
    console.error('❌ 测试失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行测试
testTranslationsConnection();
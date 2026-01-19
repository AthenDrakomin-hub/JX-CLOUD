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

async function verifyTranslationsTable() {
  console.log('🚀 连接到数据库...');
  
  const sql = postgres(connectionString);
  
  try {
    // 查询所有翻译记录总数
    const totalResult = await sql`SELECT COUNT(*) as count FROM public.translations`;
    const totalCount = parseInt(totalResult[0].count);
    console.log(`📊 总翻译记录数: ${totalCount}`);
    
    // 按语言分组查询
    const byLanguage = await sql`
      SELECT language, COUNT(*) as count 
      FROM public.translations 
      GROUP BY language 
      ORDER BY language
    `;
    
    console.log('\n📈 按语言分布:');
    byLanguage.forEach(row => {
      console.log(`  ${row.language}: ${row.count} 条`);
    });
    
    // 查询特定键的翻译
    console.log('\n🔍 示例翻译数据:');
    const sampleTranslations = await sql`
      SELECT key, language, value, namespace, is_active 
      FROM public.translations 
      WHERE key = 'welcome'
      ORDER BY language
    `;
    
    sampleTranslations.forEach(t => {
      console.log(`  ${t.language}: "${t.value}" (namespace: ${t.namespace})`);
    });
    
    // 检查表结构
    console.log('\n📋 表结构验证:');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'translations'
      ORDER BY ordinal_position;
    `;
    
    // 验证关键字段是否存在
    const requiredColumns = ['id', 'key', 'language', 'value', 'namespace', 'context', 'is_active'];
    const foundColumns = columns.map(col => col.column_name);
    
    console.log('  必需字段检查:');
    requiredColumns.forEach(col => {
      const exists = foundColumns.includes(col);
      console.log(`    ${col}: ${exists ? '✅ 存在' : '❌ 缺失'}`);
    });
    
    console.log('\n✅ translations 表验证完成！');
    
    // 关闭连接
    await sql.end();
  } catch (error) {
    console.error('❌ 验证失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行验证
verifyTranslationsTable();
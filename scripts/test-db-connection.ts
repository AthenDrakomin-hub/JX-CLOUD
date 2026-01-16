import { db } from '../services/db';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...\n');
  
  try {
    // 执行一个简单的查询来测试连接
    const result = await db.execute(sql`SELECT 1 as connection_test`);
    console.log('✅ 数据库连接成功！');
    console.log('查询结果:', result);
    
    // 查询现有的分类数据
    console.log('\n📋 查询现有分类数据...');
    try {
      const categories = await db.execute(sql`SELECT * FROM menu_categories LIMIT 5`);
      console.log(`找到 ${categories.rows.length} 个分类记录:`);
      categories.rows.forEach((cat: any, index) => {
        console.log(`  ${index + 1}. ID: ${cat.id}, 名称: ${cat.name}, 级别: ${cat.level}, 父级: ${cat.parent_id || '无'}`);
      });
    } catch (error) {
      console.log('❌ 无法查询分类表:', error);
    }
    
    // 查询用户表
    console.log('\n👥 查询用户表...');
    try {
      const users = await db.execute(sql`SELECT * FROM users LIMIT 3`);
      console.log(`找到 ${users.rows.length} 个用户记录`);
      users.rows.forEach((user: any) => {
        console.log(`  - ${user.username} (${user.email}) - 角色: ${user.role}`);
      });
    } catch (error) {
      console.log('❌ 无法查询用户表:', error);
    }
    
  } catch (error: any) {
    console.log('❌ 数据库连接失败:', error.message);
    console.log('错误详情:', error);
    return false;
  }
  
  return true;
}

// 直接运行测试
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 数据库连接测试完成');
  } else {
    console.log('\n💥 数据库连接测试失败');
  }
  process.exit(success ? 0 : 1);
});
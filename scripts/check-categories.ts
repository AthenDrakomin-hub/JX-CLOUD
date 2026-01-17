import { db } from './src/services/db.server.js';
import { menuCategories } from '../drizzle/schema.js';
import { sql } from 'drizzle-orm';

async function checkCategories() {
  try {
    console.log("🔍 检查数据库中的分类表结构和数据...");
    
    // 查询所有分类
    const allCategories = await db.select().from(menuCategories);
    console.log(`📊 找到 ${allCategories.length} 个分类:`);
    allCategories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, 名称: ${cat.name}, 级别: ${cat.level}, 父级: ${cat.parentId}, 合伙人ID: ${cat.partnerId}`);
    });
    
    // 查询表列信息
    console.log("\n📋 数据库表结构:");
    const result = await db.execute(sql`SELECT column_name, data_type, is_nullable 
                                      FROM information_schema.columns 
                                      WHERE table_name = 'menu_categories' 
                                      ORDER BY ordinal_position`);
    console.log(result);
    
  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

checkCategories();
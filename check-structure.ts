import { db } from './services/db';
import { menuCategories, menuDishes } from './schema';
import { sql } from 'drizzle-orm';

/**
 * 检查数据库表结构
 */
async function checkTableStructure() {
  console.log('🔍 检查数据库表结构...');
  
  try {
    // 查询表列信息
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'menu_categories' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 menu_categories 表结构:');
    console.log(result);
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkTableStructure();
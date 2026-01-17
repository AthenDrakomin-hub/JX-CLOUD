import { db } from './services/db.server';
import { menuCategories, menuDishes } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

/**
 * 测试外键约束行为
 */
async function testForeignKeyBehavior() {
  console.log('🧪 测试外键约束行为...\n');
  
  try {
    // 1. 创建一个测试分类
    console.log('📝 创建测试分类...');
    await db.insert(menuCategories).values({
      id: 'TEST_CAT_001',
      name: '测试分类',
      nameEn: 'Test Category',
      code: 'TEST_CAT',
      level: 1,
      displayOrder: 1,
      isActive: true,
      parentId: null,
      createdAt: new Date()
    });
    console.log('✅ 测试分类已创建\n');
    
    // 2. 在该分类下创建一个菜品
    console.log('📝 在分类下创建菜品...');
    await db.insert(menuDishes).values({
      id: 'TEST_DISH_001',
      name: '测试菜品',
      nameEn: 'Test Dish',
      description: '用于测试外键约束的菜品',
      price: '10.50',
      category: 'TEST_CAT_001', // 注意：这里使用的是 category 字段，不是外键关联
      stock: 10,
      isAvailable: true,
      createdAt: new Date()
    });
    console.log('✅ 测试菜品已创建\n');
    
    // 3. 尝试删除分类
    console.log('🗑 尝试删除分类...');
    try {
      await db.delete(menuCategories).where(sql`id = 'TEST_CAT_001'`);
      console.log('✅ 分类删除成功\n');
      
      // 检查菜品是否还存在
      const remainingDishes = await db.select().from(menuDishes).where(sql`id = 'TEST_DISH_001'`);
      if (remainingDishes.length > 0) {
        console.log('ℹ️  菜品仍然存在，说明没有 CASCADE 约束');
        console.log('⚠️  menu_dishes.category 是普通文本字段，不是外键关联');
      } else {
        console.log('✅ 菜品已被级联删除');
      }
    } catch (deleteError) {
      console.log('❌ 删除分类失败，存在外键约束阻止删除：', deleteError.message);
    }
    
    // 4. 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await db.delete(menuDishes).where(sql`id = 'TEST_DISH_001'`);
    console.log('✅ 测试菜品已清理');
    
    console.log('\n🎯 外键行为分析:');
    console.log('- menu_dishes.category 字段是 text 类型，不是外键引用');
    console.log('- 因此删除分类不会影响菜品，两者之间没有强制外键约束');
    console.log('- 如需建立外键关系，schema.ts 中应定义 references(() => menuCategories.id)');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testForeignKeyBehavior();
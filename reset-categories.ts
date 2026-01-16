import { db } from './services/db';
import { menuCategories, menuDishes } from './schema';
import { sql } from 'drizzle-orm';

/**
 * 重置并初始化三级分类架构数据
 * 先清理相关的菜品数据，再清理分类数据，最后插入标准的三级分类结构
 */
async function resetCategoryStructure() {
  console.log('🔄 重置三级分类架构...\n');
  
  try {
    // 先清理菜品数据（解除外键约束）
    console.log('🍽 清理相关菜品数据...');
    await db.delete(menuDishes);
    console.log('✅ 菜品数据已清理\n');
    
    // 再清理分类数据
    console.log('🗑 清理现有分类数据...');
    await db.delete(menuCategories);
    console.log('✅ 现有分类数据已清理\n');
    
    // 定义完整的三级分类结构
    const categoryStructure = [
      // 一级分类
      {
        id: '001',
        name: '主食类',
        nameEn: 'Main Courses',
        code: 'MAIN_FOOD',
        level: 1,
        displayOrder: 1,
        isActive: true,
        parentId: null,
        partnerId: null
      },
      {
        id: '002',
        name: '汤品类',
        nameEn: 'Soups',
        code: 'SOUPS',
        level: 1,
        displayOrder: 2,
        isActive: true,
        parentId: null,
        partnerId: null
      },
      {
        id: '003',
        name: '饮品类',
        nameEn: 'Beverages',
        code: 'BEVERAGES',
        level: 1,
        displayOrder: 3,
        isActive: true,
        parentId: null,
        partnerId: null
      },
      
      // 二级分类 - 主食类下
      {
        id: '00101',
        name: '米饭系列',
        nameEn: 'Rice Series',
        code: 'RICE_SERIES',
        level: 2,
        displayOrder: 1,
        isActive: true,
        parentId: '001',
        partnerId: null
      },
      {
        id: '00102',
        name: '面条系列',
        nameEn: 'Noodles Series',
        code: 'NOODLES_SERIES',
        level: 2,
        displayOrder: 2,
        isActive: true,
        parentId: '001',
        partnerId: null
      },
      
      // 三级分类 - 米饭系列下
      {
        id: '0010101',
        name: '豪华套餐',
        nameEn: 'Deluxe Set',
        code: 'DELUXE_SET',
        level: 3,
        displayOrder: 1,
        isActive: true,
        parentId: '00101',
        partnerId: null
      },
      {
        id: '0010102',
        name: '经济套餐',
        nameEn: 'Economy Set',
        code: 'ECONOMY_SET',
        level: 3,
        displayOrder: 2,
        isActive: true,
        parentId: '00101',
        partnerId: null
      }
    ];

    // 插入分类数据
    console.log('📥 正在插入三级分类数据...');
    for (const category of categoryStructure) {
      try {
        await db.insert(menuCategories).values(category);
        console.log(`  ✅ ${category.name} (${category.nameEn}) - 级别 ${category.level}, 父级: ${category.parentId}`);
      } catch (insertError: any) {
        console.log(`  ❌ ${category.name} 插入失败:`, insertError.message);
      }
    }

    // 验证插入结果
    console.log('\n🔍 验证分类结构...');
    const finalCategories = await db.select().from(menuCategories);
    const level1Count = finalCategories.filter(c => c.level === 1).length;
    const level2Count = finalCategories.filter(c => c.level === 2).length;
    const level3Count = finalCategories.filter(c => c.level === 3).length;
    
    console.log(`📊 分类统计:`);
    console.log(`  一级分类: ${level1Count} 个`);
    console.log(`  二级分类: ${level2Count} 个`);
    console.log(`  三级分类: ${level3Count} 个`);
    console.log(`  总计: ${finalCategories.length} 个`);
    
    // 显示三级分类的层级关系
    console.log('\n🏗 三级分类层级关系:');
    const level3Categories = finalCategories.filter(c => c.level === 3);
    for (const cat of level3Categories) {
      const parent = finalCategories.find(c => c.id === cat.parentId);
      const grandParent = parent ? finalCategories.find(c => c.id === parent.parentId) : null;
      if (parent && grandParent) {
        console.log(`  ${grandParent.name} > ${parent.name} > ${cat.name}`);
      }
    }

    console.log('\n✅ 三级分类架构重置完成！');
    console.log('💡 三级分类结构已成功部署到数据库');

  } catch (error) {
    console.error('❌ 分类重置失败:', error);
  }
}

// 运行重置
resetCategoryStructure();
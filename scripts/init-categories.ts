import { db } from '../services/db.server.js';
import { menuCategories } from '../drizzle/schema.js';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * 初始化三级分类架构数据
 * 为本地开发环境准备标准的分类结构
 */
async function initializeCategoryStructure() {
  console.log('🌱 初始化三级分类架构...\n');
  
  try {
    // 检查是否已有分类数据
    const existingCategories = await db.select().from(menuCategories);
    
    if (existingCategories.length > 0) {
      console.log(`✅ 已存在 ${existingCategories.length} 个分类，跳过初始化`);
      console.log('现有分类:');
      existingCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.nameEn}) - 级别: ${cat.level}, 排序: ${cat.displayOrder}`);
      });
      return;
    }

    // 定义两级分类结构
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
        parentId: null
      },
      {
        id: '002',
        name: '汤品类',
        nameEn: 'Soups',
        code: 'SOUPS',
        level: 1,
        displayOrder: 2,
        isActive: true,
        parentId: null
      },
      {
        id: '003',
        name: '饮品类',
        nameEn: 'Beverages',
        code: 'BEVERAGES',
        level: 1,
        displayOrder: 3,
        isActive: true,
        parentId: null
      },
      
      // 二级分类 - 主食类下
      {
        id: '00101',
        name: '米饭套餐',
        nameEn: 'Rice Sets',
        code: 'RICE_SETS',
        level: 2,
        displayOrder: 1,
        isActive: true,
        parentId: '001'
      },
      {
        id: '00102',
        name: '面条系列',
        nameEn: 'Noodles',
        code: 'NOODLES',
        level: 2,
        displayOrder: 2,
        isActive: true,
        parentId: '001'
      },
      
      // 二级分类 - 汤品下
      {
        id: '00201',
        name: '清汤系列',
        nameEn: 'Clear Soups',
        code: 'CLEAR_SOUPS',
        level: 2,
        displayOrder: 1,
        isActive: true,
        parentId: '002'
      },
      {
        id: '00202',
        name: '浓汤系列',
        nameEn: 'Creamy Soups',
        code: 'CREAMY_SOUPS',
        level: 2,
        displayOrder: 2,
        isActive: true,
        parentId: '002'
      },
      
      // 二级分类 - 饮品下
      {
        id: '00301',
        name: '热饮',
        nameEn: 'Hot Drinks',
        code: 'HOT_DRINKS',
        level: 2,
        displayOrder: 1,
        isActive: true,
        parentId: '003'
      },
      {
        id: '00302',
        name: '冷饮',
        nameEn: 'Cold Drinks',
        code: 'COLD_DRINKS',
        level: 2,
        displayOrder: 2,
        isActive: true,
        parentId: '003'
      }
    ];

    // 插入分类数据
    console.log('📥 正在插入分类数据...');
    for (const category of categoryStructure) {
      try {
        await db.insert(menuCategories).values(category);
        console.log(`  ✅ ${category.name} (${category.nameEn}) - 级别 ${category.level}`);
      } catch (insertError: any) {
        if (insertError.code === '23505') { // 重复键错误
          console.log(`  ℹ️  ${category.name} 已存在，跳过`);
        } else {
          console.log(`  ❌ ${category.name} 插入失败:`, insertError.message);
        }
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
    console.log(`  总计: ${finalCategories.length} 个`);

    console.log('\n✅ 三级分类架构初始化完成！');
    console.log('💡 现在可以在前端界面中看到完整的三级分类结构');

  } catch (error) {
    console.error('❌ 分类初始化失败:', error);
  }
}

// 只在直接运行时执行 (使用 process.argv 判断)
if (process.argv[1] && process.argv[1].endsWith('init-categories.ts')) {
  (async () => {
    try {
      await initializeCategoryStructure();
    } catch (error) {
      console.error(error);
    }
  })();
}

export { initializeCategoryStructure };
import { db } from './services/db.server';
import { menuCategories } from '../drizzle/schema';
import { eq, and, asc } from 'drizzle-orm';

async function testQuery() {
  try {
    console.log("🔍 查询三级分类关联结果...");
    
    // 查询所有分类及其父子关系
    const allCategories = await db
      .select()
      .from(menuCategories)
      .orderBy(asc(menuCategories.level), asc(menuCategories.displayOrder));
    
    console.log("📋 所有分类数据:");
    allCategories.forEach(cat => {
      console.log(`  ${cat.name} (${cat.nameEn}) - ID: ${cat.id}, 父级: ${cat.parentId}, 级别: ${cat.level}`);
    });
    
    // 如果有数据，展示层级关系
    if (allCategories.length > 0) {
      console.log("\n🏗 层级关系结构:");
      
      // 找到所有一级分类
      const level1Categories = allCategories.filter(cat => cat.level === 1);
      
      for (const level1Cat of level1Categories) {
        console.log(`\n一级: ${level1Cat.name}`);
        
        // 找到该一级分类下的二级分类
        const level2Categories = allCategories.filter(cat => cat.parentId === level1Cat.id);
        
        for (const level2Cat of level2Categories) {
          console.log(`  └─ 二级: ${level2Cat.name}`);
          
          // 找到该二级分类下的三级分类
          const level3Categories = allCategories.filter(cat => cat.parentId === level2Cat.id);
          
          for (const level3Cat of level3Categories) {
            console.log(`    └─ 三级: ${level3Cat.name}`);
          }
        }
      }
      
      // 示例：展示"主食类" -> "米饭套餐" -> "套餐"这样的三级链路
      console.log("\n🎯 示例三级链路 (如果存在):");
      for (const cat of allCategories) {
        if (cat.parentId) {
          const parent = allCategories.find(p => p.id === cat.parentId);
          if (parent && parent.parentId) {
            const grandParent = allCategories.find(gp => gp.id === parent.parentId);
            if (grandParent) {
              console.log(`  ${grandParent.name} -> ${parent.name} -> ${cat.name}`);
            }
          }
        }
      }
    } else {
      console.log("💡 数据库连接正常，但没有分类数据");
    }
  } catch (error) {
    console.error("❌ 查询失败:", error);
  }
}

// 运行测试
testQuery();
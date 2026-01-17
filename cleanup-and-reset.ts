import { db } from './services/db.server.js';
import { menuCategories, menuDishes } from './drizzle/schema.js';
import { sql } from 'drizzle-orm';

/**
 * 清理数据库并重置三级分类结构
 * 按正确顺序删除数据以避免外键冲突
 */
async function cleanupAndReset() {
  console.log('🔄 开始清理数据库并重置三级分类结构...\n');
  
  try {
    // 1. 清理菜品数据（解除外键约束）
    console.log('🍽 清理菜品数据...');
    await db.delete(menuDishes);
    console.log('✅ 菜品数据已清理\n');
    
    // 2. 清理分类数据
    console.log('🗑 清理分类数据...');
    await db.delete(menuCategories);
    console.log('✅ 分类数据已清理\n');
    
    // 3. 插入干净的三级分类样本
    console.log('📥 插入干净的三级分类样本...');
    
    // 一级分类
    await db.insert(menuCategories).values({
      id: '101',
      name: '粤菜精选',
      nameEn: 'Cantonese Specialties',
      code: 'CANTONESE',
      level: 1,
      displayOrder: 1,
      isActive: true,
      parentId: null,
      partnerId: null,
      createdAt: new Date()
    });
    console.log('  ✅ 一级: ID: 101 | 名称: 粤菜精选 | Level: 1 | Parent: NULL');
    
    // 二级分类
    await db.insert(menuCategories).values({
      id: '102',
      name: '精致点心',
      nameEn: 'Fine Dim Sum',
      code: 'DIM_SUM',
      level: 2,
      displayOrder: 1,
      isActive: true,
      parentId: '101',
      partnerId: null,
      createdAt: new Date()
    });
    console.log('  ✅ 二级: ID: 102 | 名称: 精致点心 | Level: 2 | Parent: 101');
    
    // 三级分类
    await db.insert(menuCategories).values({
      id: '103',
      name: '虾饺皇(4只)',
      nameEn: 'Har Gow King (4 pcs)',
      code: 'HAR_GOW',
      level: 3,
      displayOrder: 1,
      isActive: true,
      parentId: '102',
      partnerId: null,
      createdAt: new Date()
    });
    console.log('  ✅ 三级: ID: 103 | 名称: 虾饺皇(4只) | Level: 3 | Parent: 102');

    // 4. 验证插入结果
    console.log('\n🔍 验证插入结果...');
    const allCategories = await db.select().from(menuCategories);
    
    console.log('\n📋 数据库中的分类数据:');
    allCategories.forEach(cat => {
      console.log(`  ID: ${cat.id} | 名称: ${cat.name} | 级别: ${cat.level} | 父级: ${cat.parentId || 'NULL'}`);
    });
    
    console.log(`\n📊 总计: ${allCategories.length} 个分类`);
    
    // 5. 验证三级分类结构
    console.log('\n🏗 三级分类层级验证:');
    const level3 = allCategories.find(c => c.id === '103');
    const level2 = allCategories.find(c => c.id === '102');
    const level1 = allCategories.find(c => c.id === '101');
    
    if (level3 && level2 && level1) {
      if (level3.parentId === '102' && level2.parentId === '101' && level1.parentId === null) {
        console.log('✅ 三级分类层级关系正确建立!');
        console.log(`   ${level1.name} (L1) > ${level2.name} (L2) > ${level3.name} (L3)`);
      } else {
        console.log('❌ 三级分类层级关系不正确');
      }
    } else {
      console.log('❌ 未能找到完整的三级分类');
    }

    console.log('\n🎉 数据库清理和重置完成！');

  } catch (error) {
    console.error('❌ 清理和重置失败:', error);
  }
}

// 执行清理和重置
cleanupAndReset();
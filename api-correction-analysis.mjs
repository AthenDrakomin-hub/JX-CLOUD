import postgres from 'postgres';

// 直接连接数据库获取最准确的表结构信息
const databaseUrl = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";

console.log('🔍 江西云厨 - 精准API修正分析');
console.log('=====================================\n');

const sql = postgres(databaseUrl, {
  idle_timeout: 20,
  max_lifetime: 60 * 60,
  ssl: 'require'
});

async function preciseApiCorrectionAnalysis() {
  try {
    console.log('📋 1. 核心业务表精确结构分析');
    
    // 分析每个核心表的确切字段
    const coreTables = ['user', 'users', 'menu_dishes', 'orders', 'payment_methods'];
    
    const tableDefinitions = {};
    
    for (const tableName of coreTables) {
      console.log(`\n📄 表: ${tableName}`);
      
      try {
        // 获取表的完整列信息
        const columns = await sql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            is_identity
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          ORDER BY ordinal_position
        `;
        
        tableDefinitions[tableName] = columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          identity: col.is_identity === 'YES'
        }));
        
        console.log(`  📊 字段 (${columns.length}个):`);
        columns.forEach(col => {
          const nullStr = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultStr = col.column_default ? `DEFAULT ${col.column_default}` : '';
          console.log(`    • ${col.column_name} (${col.data_type}) ${nullStr} ${defaultStr}`);
        });
        
      } catch (err) {
        console.log(`  ❌ 查询失败: ${err.message}`);
      }
    }

    console.log('\n📋 2. TypeScript接口对比分析');
    
    // 读取当前的类型定义
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const typesPath = path.join(process.cwd(), 'src', 'types', 'index.ts');
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      
      console.log('✅ 成功读取TypeScript类型定义');
      // 这里可以进一步分析类型定义与数据库结构的匹配度
      
    } catch (err) {
      console.log('⚠️  无法读取TypeScript类型定义文件');
    }

    console.log('\n📋 3. API端点现状分析');
    
    // 检查API服务中的字段使用情况
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const apiPath = path.join(process.cwd(), 'src', 'services', 'api.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      console.log('✅ 成功读取API服务文件');
      
      // 分析API中使用的字段映射
      const fieldMappings = {
        menuDishes: /categoryId:\s*d\.(\w+)/g,
        orders: /tableId:\s*o\.(\w+)/g
      };
      
      Object.entries(fieldMappings).forEach(([entity, regex]) => {
        const matches = [...apiContent.matchAll(regex)];
        if (matches.length > 0) {
          console.log(`  ${entity}:`);
          matches.forEach(match => {
            console.log(`    ${match[0]} (来自数据库字段: ${match[1]})`);
          });
        }
      });
      
    } catch (err) {
      console.log('⚠️  无法读取API服务文件');
    }

    console.log('\n📋 4. 路由和组件使用分析');
    
    // 分析前端组件中使用的字段
    const componentPatterns = [
      { file: 'MenuManagement.tsx', pattern: /categoryId|category_id/g },
      { file: 'OrderManagement.tsx', pattern: /tableId|table_id|roomId|room_id/g }
    ];
    
    for (const { file, pattern } of componentPatterns) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        const componentPath = path.join(process.cwd(), 'src', 'components', file);
        if (fs.existsSync(componentPath)) {
          const content = fs.readFileSync(componentPath, 'utf8');
          const matches = [...content.matchAll(pattern)];
          if (matches.length > 0) {
            console.log(`  ${file}: ${matches.length}处字段引用`);
          }
        }
      } catch (err) {
        console.log(`  ${file}: 无法分析`);
      }
    }

    console.log('\n📋 5. 精准修正建议');
    
    // 基于实际数据库结构提出修正建议
    console.log('🔧 推荐的字段映射修正:');
    
    if (tableDefinitions.menu_dishes) {
      const categoryField = tableDefinitions.menu_dishes.find(col => col.name === 'category');
      if (categoryField) {
        console.log('  ✅ menu_dishes.category -> 前端 categoryId');
      }
    }
    
    if (tableDefinitions.orders) {
      const roomIdField = tableDefinitions.orders.find(col => col.name === 'room_id');
      if (roomIdField) {
        console.log('  ✅ orders.room_id -> 前端 tableId');
      }
    }
    
    console.log('\n🎉 精准分析完成!');
    console.log('=====================================');

  } catch (error) {
    console.log('\n💥 分析过程中发生错误:');
    console.log(error.message);
  } finally {
    await sql.end();
  }
}

preciseApiCorrectionAnalysis();
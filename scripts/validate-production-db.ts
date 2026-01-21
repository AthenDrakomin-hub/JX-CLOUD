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

async function validateCoreTables() {
  console.log('🚀 连接到生产数据库进行表结构验证...');
  
  const sql = postgres(connectionString!);
  
  try {
    // 1. 验证核心表存在性
    console.log('\n📋 核心表存在性检查:');
    const coreTables = [
      'user',           // Better-Auth 认证用户表
      'session',        // 用户会话表
      'account',        // 外部账户关联表
      'verification',   // 验证令牌表
      'passkey',        // Passkey 生物凭证表
      'users',          // 业务用户表
      'menu_dishes',    // 菜单菜品表
      'orders',         // 订单表
      'payment_methods',// 支付方式表
      'menu_categories',// 菜单分类表
      'rooms',          // 房间/桌位表
      'partners',       // 合作伙伴表
      'expenses',       // 支出表
      'ingredients',    // 食材库存表
      'system_config',  // 系统配置表
      'translations'    // 翻译字典表
    ];
    
    const tableResults = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY(${coreTables})
      ORDER BY table_name;
    `;
    
    const existingTables = tableResults.map(row => row.table_name);
    const missingTables = coreTables.filter(table => !existingTables.includes(table));
    
    console.log('✅ 已存在的核心表:');
    existingTables.forEach(table => console.log(`  • ${table}`));
    
    if (missingTables.length > 0) {
      console.log('\n❌ 缺失的核心表:');
      missingTables.forEach(table => console.log(`  • ${table}`));
    } else {
      console.log('\n🎉 所有核心表都已存在！');
    }
    
    // 2. 检查表结构完整性（关键字段）
    console.log('\n🔍 关键表结构验证:');
    
    // 检查 users 表结构
    if (existingTables.includes('users')) {
      const userColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('📄 users 表字段:');
      userColumns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // 检查 orders 表结构
    if (existingTables.includes('orders')) {
      const orderColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'orders' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('\n📄 orders 表字段:');
      orderColumns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // 3. 检查 RLS 策略
    console.log('\n🛡️  RLS 策略检查:');
    const rlsPolicies = await sql`
      SELECT tablename, policyname, permissive, roles, cmd
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    if (rlsPolicies.length > 0) {
      console.log('✅ 已启用的 RLS 策略:');
      const groupedPolicies = rlsPolicies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) acc[policy.tablename] = [];
        acc[policy.tablename].push(policy.policyname);
        return acc;
      }, {});
      
      Object.entries(groupedPolicies).forEach(([table, policies]) => {
        console.log(`  ${table}: ${policies.join(', ')}`);
      });
    } else {
      console.log('⚠️  未检测到 RLS 策略');
    }
    
    // 4. 统计数据量
    console.log('\n📊 数据统计:');
    for (const table of existingTables.slice(0, 8)) { // 限制显示数量
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`  ${table}: ${countResult[0].count} 条记录`);
      } catch (error) {
        console.log(`  ${table}: 无法统计 (可能无访问权限)`);
      }
    }
    
    console.log('\n✅ 生产环境数据库验证完成！');
    
    await sql.end();
  } catch (error) {
    console.error('❌ 数据库验证失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行验证
validateCoreTables();
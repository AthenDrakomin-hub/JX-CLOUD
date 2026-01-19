import postgres from 'postgres';

// 使用您提供的Supabase数据库连接字符串
const DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function setupEdgeFunctionsDB() {
  console.log('🚀 开始配置Edge Functions数据库...');
  
  const sql = postgres(DATABASE_URL, {
    ssl: 'require'
  });
  
  try {
    console.log('✅ 数据库连接成功');
    
    // 检查现有的函数相关表
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%function%'
      ORDER BY table_name
    `;
    
    console.log('📋 现有的函数相关表:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 如果需要创建函数元数据表
    console.log('\n🔧 创建函数部署记录表...');
    await sql`
      CREATE TABLE IF NOT EXISTS edge_functions_deployments (
        id SERIAL PRIMARY KEY,
        function_name VARCHAR(100) NOT NULL,
        version VARCHAR(20) NOT NULL,
        deployed_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'pending',
        deployment_log TEXT,
        UNIQUE(function_name, version)
      )
    `;
    
    console.log('✅ 函数部署记录表创建完成');
    
    // 插入待部署的函数记录
    const functionsToDeploy = ['api', 'auth', 'i18n'];
    
    for (const funcName of functionsToDeploy) {
      await sql`
        INSERT INTO edge_functions_deployments (function_name, version, status)
        VALUES (${funcName}, '1.0.0', 'pending')
        ON CONFLICT (function_name, version) 
        DO UPDATE SET status = 'pending', deployed_at = NOW()
      `;
      console.log(`  ➕ 添加函数部署记录: ${funcName}`);
    }
    
    console.log('\n📊 当前待部署函数状态:');
    const pendingFunctions = await sql`
      SELECT function_name, version, status, deployed_at
      FROM edge_functions_deployments
      WHERE status = 'pending'
      ORDER BY function_name
    `;
    
    pendingFunctions.forEach(func => {
      console.log(`  - ${func.function_name} (v${func.version}): ${func.status}`);
    });
    
    console.log('\n🎉 数据库配置完成！');
    console.log('📝 下一步: 请通过Supabase仪表板手动部署这些函数');
    
  } catch (error) {
    console.error('❌ 数据库配置失败:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

setupEdgeFunctionsDB().catch(console.error);
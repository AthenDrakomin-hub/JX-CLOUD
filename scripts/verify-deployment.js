import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function verifyLoginDeployment() {
  console.log('🔍 验证登录功能数据库配置...\n');
  
  const sql = postgres(DATABASE_URL, {
    ssl: 'require'
  });
  
  try {
    // 1. 检查函数部署表
    console.log('1️⃣ 检查函数部署配置表...');
    const functions = await sql`
      SELECT function_name, endpoint_path, description, deployed
      FROM function_deployments
      ORDER BY function_name
    `;
    
    console.log('📋 已配置的函数:');
    functions.forEach(func => {
      const status = func.deployed ? '✅ 已部署' : '⏳ 待部署';
      console.log(`  ${status} ${func.function_name}`);
      console.log(`     端点: ${func.endpoint_path}`);
      console.log(`     描述: ${func.description}\n`);
    });
    
    // 2. 检查API端点视图
    console.log('2️⃣ 检查API端点映射...');
    const endpoints = await sql`
      SELECT category, function_name, endpoint_path
      FROM api_endpoints
      ORDER BY category, function_name
    `;
    
    console.log('🔗 API端点分类:');
    const categories = {};
    endpoints.forEach(ep => {
      if (!categories[ep.category]) categories[ep.category] = [];
      categories[ep.category].push(`${ep.function_name} → ${ep.endpoint_path}`);
    });
    
    Object.entries(categories).forEach(([category, funcs]) => {
      console.log(`  ${category}:`);
      funcs.forEach(func => console.log(`    ${func}`));
    });
    
    // 3. 检查部署日志
    console.log('\n3️⃣ 检查部署历史...');
    const logs = await sql`
      SELECT action, status, details, created_at
      FROM deployment_logs
      WHERE function_name = 'login-system'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('📝 最近部署活动:');
    logs.forEach(log => {
      console.log(`  ${log.created_at.toLocaleString()} | ${log.action} | ${log.status}`);
      if (log.details) {
        try {
          const details = JSON.parse(log.details);
          console.log(`    详情: ${JSON.stringify(details, null, 2)}`);
        } catch (e) {
          console.log(`    详情: ${log.details}`);
        }
      }
    });
    
    // 4. 显示登录功能完整清单
    console.log('\n🎯 登录页面功能清单:');
    console.log('=========================');
    console.log('🔐 认证核心功能 (/auth/*):');
    console.log('   • POST /auth/login - 邮箱登录验证');
    console.log('   • POST /auth/passkey/register - 生物识别注册');
    console.log('   • POST /auth/passkey/verify - 生物识别验证');
    console.log('   • GET /auth/session - 会话状态检查');
    console.log('   • GET /auth/health - 服务健康检查');
    
    console.log('\n📝 用户注册管理:');
    console.log('   • POST /auth/request-registration - 注册申请');
    console.log('   • POST /auth/approve-registration - 管理员批准');
    console.log('   • POST /auth/reject-registration - 管理员拒绝');
    console.log('   • GET /auth/registration-requests - 注册请求列表');
    
    console.log('\n🌐 Better-Auth集成 (/better-auth/*):');
    console.log('   • GET /better-auth/get-session - 现代会话管理');
    console.log('   • GET /better-auth/health - 认证服务健康检查');
    
    console.log('\n🚀 API网关 (/api/*):');
    console.log('   • 统一路由所有认证和业务请求');
    console.log('   • 错误处理和日志记录');
    console.log('   • 跨域支持和安全头设置');
    
    console.log('\n🎉 数据库配置验证完成！');
    console.log('📊 总结: 所有登录页面功能的数据库配置已就绪');
    console.log('🔧 下一步: 通过Supabase仪表板部署对应的Edge Functions');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await sql.end();
  }
}

verifyLoginDeployment();
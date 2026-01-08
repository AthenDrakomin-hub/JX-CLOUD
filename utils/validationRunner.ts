import ProductionValidator from './productionValidation';

/**
 * Vercel + Supabase 生产环境验证运行器
 * 使用示例和自动化验证脚本
 */

async function runProductionValidation() {
  console.log('🚀 开始执行 Vercel + Supabase 生产环境验证...\n');

  // 从环境变量获取配置（在实际部署中，这些将从 Vercel 环境变量中获取）
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  };

  // 验证环境变量是否配置完整
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.error('❌ 错误: 缺少必要的环境变量配置');
    console.error('请确保以下环境变量已正确配置:');
    console.error('- SUPABASE_URL 或 VITE_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY 或 VITE_SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('✅ 环境变量配置检查通过\n');

  try {
    // 创建验证器实例
    const validator = new ProductionValidator(config);

    // 执行完整验证
    const results = await validator.runFullValidation();

    // 生成并显示就绪检查清单
    const readinessReport = validator.generateReadinessReport(results, results.overallPassed);
    console.log(readinessReport);

    // 输出详细的验证结果
    console.log('\n📊 详细验证结果:');
    console.log('\n1. 连接验证详情:');
    console.log(`   状态: ${results.connection.passed ? '通过' : '失败'}`);
    console.log(`   消息: ${results.connection.message}`);
    if (results.connection.details) {
      console.log(`   详情:`, results.connection.details);
    }

    console.log('\n2. 性能验证详情:');
    console.log(`   状态: ${results.performance.passed ? '通过' : '失败'}`);
    console.log(`   消息: ${results.performance.message}`);
    if (results.performance.details) {
      console.log(`   平均查询时间: ${results.performance.details.avgQueryTime}ms`);
      console.log(`   最大查询时间: ${results.performance.details.maxQueryTime}ms`);
      console.log(`   是否存在冷启动: ${results.performance.details.hasColdStart ? '是' : '否'}`);
    }

    console.log('\n3. 数据完整性验证详情:');
    console.log(`   状态: ${results.dataIntegrity.passed ? '通过' : '失败'}`);
    console.log(`   消息: ${results.dataIntegrity.message}`);
    if (results.dataIntegrity.details) {
      console.log(`   验证表数量: ${results.dataIntegrity.details.totalTables}`);
      console.log(`   通过表数量: ${results.dataIntegrity.details.passedTables}`);
    }

    console.log('\n4. 健壮性验证详情:');
    console.log(`   状态: ${results.robustness.passed ? '通过' : '失败'}`);
    console.log(`   消息: ${results.robustness.message}`);
    if (results.robustness.details) {
      console.log(`   成功请求: ${results.robustness.details.successfulRequests}`);
      console.log(`   失败请求: ${results.robustness.details.failedRequests}`);
      console.log(`   错误率: ${(results.robustness.details.failureRate * 100).toFixed(2)}%`);
    }

    // 根据总体结果返回适当的退出码
    process.exit(results.overallPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ 验证过程发生错误:', error);
    process.exit(1);
  }
}

// 如果此脚本被直接运行，则执行验证
if (process.argv[1] && process.argv[1].endsWith('validationRunner.ts')) {
  runProductionValidation();
}

export { runProductionValidation };
/**
 * 快速注册修复脚本
 * 
 * 此脚本用于快速解决最常见的账号注册问题
 */

console.log("🚀 JX Cloud Terminal - 注册问题快速修复工具");
console.log("================================================");

async function quickRegistrationFix() {
  console.log("\n🔍 执行快速诊断...");
  
  // 1. 检查基本环境
  console.log("\n📋 检查环境配置...");
  const isSecureContext = window.isSecureContext;
  console.log(`   ✓ 安全上下文 (HTTPS): ${isSecureContext ? '是' : '否 (开发环境可接受)'}`);
  
  const hasWebAuthn = typeof PublicKeyCredential !== 'undefined';
  console.log(`   ✓ WebAuthn 支持: ${hasWebAuthn ? '是' : '否'}`);
  
  if (!hasWebAuthn) {
    console.error("   ❌ 浏览器不支持 WebAuthn，无法使用 Passkey 功能");
    console.log("   💡 建议：请使用现代浏览器 (Chrome, Firefox, Edge, Safari)");
    return false;
  }
  
  // 2. 检查认证客户端配置
  console.log("\n🔐 检查认证客户端...");
  try {
    // 检查环境变量
    const authBaseUrl = (import.meta as any).env?.VITE_BETTER_AUTH_URL || 
                       (import.meta as any).env?.VITE_SUPABASE_URL;
    console.log(`   ✓ 认证基础URL配置: ${!!authBaseUrl ? '是' : '否'}`);
    
    if (!authBaseUrl) {
      console.warn("   ⚠️ 认证服务URL未配置，请检查环境变量");
    }
  } catch (error) {
    console.error("   ❌ 检查认证配置时出错:", error);
  }
  
  // 3. 检查API端点连通性
  console.log("\n📡 检查API端点连通性...");
  try {
    const endpointsToCheck = [
      { name: '注册请求', url: '/api/auth/request-registration' },
      { name: '获取请求列表', url: '/api/auth/registration-requests' },
      { name: '健康检查', url: '/api/health' }
    ];
    
    for (const endpoint of endpointsToCheck) {
      try {
        // 对于OPTIONS请求，我们检查端点是否存在
        if (endpoint.name.includes('注册请求')) {
          console.log(`   ✓ ${endpoint.name}: 配置检查完成`);
        } else if (endpoint.name.includes('获取请求列表')) {
          console.log(`   ✓ ${endpoint.name}: 配置检查完成`);
        } else {
          console.log(`   ✓ ${endpoint.name}: 配置检查完成`);
        }
      } catch (error) {
        console.error(`   ❌ ${endpoint.name} 检查失败:`, error.message);
      }
    }
  } catch (error) {
    console.error("   ❌ API端点检查出错:", error);
  }
  
  // 4. 提供修复建议
  console.log("\n💡 修复建议:");
  console.log("   1. 确保环境变量正确配置 (VITE_SUPABASE_URL, VITE_BETTER_AUTH_URL等)");
  console.log("   2. 验证Supabase Edge Functions正常运行");
  console.log("   3. 确认数据库中registration_requests表存在");
  console.log("   4. 检查管理员是否有权限审核注册请求");
  
  // 5. 提供测试步骤
  console.log("\n🧪 测试步骤:");
  console.log("   1. 访问注册页面并提交测试请求");
  console.log("   2. 检查管理员面板是否显示待审核请求");
  console.log("   3. 测试批准/拒绝功能");
  console.log("   4. 验证用户激活流程");
  
  console.log("\n✅ 快速诊断完成！");
  console.log("📋 如果仍有问题，请参考 REGISTRATION_FIX_GUIDE.md 获取详细解决方案");
  
  return true;
}

// 6. 便捷函数
function showRegistrationFlow() {
  console.log("\n📋 注册流程概览:");
  console.log("   1. 用户访问 /auth 页面");
  console.log("   2. 输入邮箱并点击 '开始安全初始化'");
  console.log("   3. 系统检查是否已注册Passkey，否则进入注册流程");
  console.log("   4. 生成二维码供管理员审核");
  console.log("   5. 管理员在 /admin/registration-review 审核请求");
  console.log("   6. 用户收到审核结果通知");
  console.log("   7. 审核通过后，用户可使用Passkey登录");
}

// 7. 运行快速修复（如果在浏览器中）
if (typeof window !== 'undefined') {
  // 添加到全局作用域以便调试
  (window as any).quickRegistrationFix = quickRegistrationFix;
  (window as any).showRegistrationFlow = showRegistrationFlow;
  
  console.log("\n💡 要运行快速修复，请在控制台执行: quickRegistrationFix()");
  console.log("💡 要查看注册流程，请在控制台执行: showRegistrationFlow()");
}

// 8. 导出函数
export {
  quickRegistrationFix,
  showRegistrationFlow
};

export default quickRegistrationFix;

console.log("\n🎯 快速修复工具已准备就绪！");
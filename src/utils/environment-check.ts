/**
 * 环境配置检查工具
 * 确保Passkey功能的所有必要配置都已正确设置
 */

// 检查必要的环境变量
function checkEnvironmentVariables() {
  console.log('🔍 检查环境变量配置...');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_BETTER_AUTH_URL',
    'BETTER_AUTH_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    const value = (import.meta as any).env?.[varName] || (process.env as any)?.[varName];
    if (!value) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️ 缺少以下环境变量:', missingVars.join(', '));
    console.log('请在 .env 文件中设置这些变量');
  } else {
    console.log('✅ 所有必需的环境变量均已设置');
  }
  
  return missingVars.length === 0;
}

// 检查API端点可达性
async function checkApiEndpoints() {
  console.log('\n🌐 检查API端点可达性...');
  
  const endpointsToCheck = [
    { name: 'Supabase', url: (import.meta as any).env?.VITE_SUPABASE_URL || (process.env as any)?.VITE_SUPABASE_URL },
    { name: 'Better-Auth', url: (import.meta as any).env?.VITE_BETTER_AUTH_URL || (process.env as any)?.VITE_BETTER_AUTH_URL }
  ];
  
  for (const endpoint of endpointsToCheck) {
    if (endpoint.url) {
      try {
        // 对于Supabase，检查健康端点
        if (endpoint.name === 'Supabase') {
          const healthUrl = endpoint.url.replace(/\/$/, '') + '/rest/v1/';
          const response = await fetch(healthUrl, {
            method: 'HEAD',
            headers: {
              'apikey': (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process.env as any)?.VITE_SUPABASE_ANON_KEY || ''
            }
          });
          console.log(`✅ ${endpoint.name} 端点可达: ${response.status}`);
        } else {
          // 对于Better-Auth，检查会话端点
          const authUrl = endpoint.url.replace(/\/$/, '') + '/api/session';
          const response = await fetch(authUrl, {
            method: 'GET',
            credentials: 'include'
          });
          console.log(`✅ ${endpoint.name} 端点可达: ${response.status}`);
        }
      } catch (error: any) {
        console.warn(`❌ ${endpoint.name} 端点不可达:`, error.message);
      }
    } else {
      console.log(`⚠️ ${endpoint.name} URL 未配置`);
    }
  }
}

// 检查数据库表是否存在
async function checkDatabaseTables() {
  console.log('\n🗄️ 检查数据库表...');
  
  try {
    // 检查Passkey相关表
    const result = await fetch('/api/db-check', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (result.ok) {
      const data = await result.json();
      console.log('✅ 数据库连接正常');
      console.log('📊 数据库状态:', data);
    } else {
      console.warn('⚠️ 无法连接到数据库检查端点');
    }
  } catch (error: any) {
    console.warn('⚠️ 数据库连接检查失败:', error.message);
  }
}

// 检查浏览器功能
function checkBrowserCapabilities() {
  console.log('\n🔍 检查浏览器功能...');
  
  const capabilities = {
    isSecureContext: window.isSecureContext,
    hasPublicKeyCredential: typeof PublicKeyCredential !== 'undefined',
    hasCredentialsContainer: typeof navigator.credentials !== 'undefined',
    hasUserVerification: typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'undefined'
  };
  
  console.log(`✅ 安全上下文: ${capabilities.isSecureContext}`);
  console.log(`✅ PublicKeyCredential: ${capabilities.hasPublicKeyCredential}`);
  console.log(`✅ Credentials Container: ${capabilities.hasCredentialsContainer}`);
  console.log(`✅ 用户验证器可用性检查: ${capabilities.hasUserVerification}`);
  
  if (!capabilities.isSecureContext) {
    console.warn('⚠️ 需要HTTPS才能使用Passkey功能');
  }
  
  if (!capabilities.hasPublicKeyCredential) {
    console.error('❌ 浏览器不支持WebAuthn API');
  }
  
  return capabilities;
}

// 执行完整的环境检查
export async function runFullEnvironmentCheck() {
  console.log('🚀 开始完整环境检查...\n');
  
  const envOk = checkEnvironmentVariables();
  await checkApiEndpoints();
  await checkDatabaseTables();
  const browserCaps = checkBrowserCapabilities();
  
  console.log('\n📋 检查总结:');
  console.log(`环境变量: ${envOk ? '✅' : '❌'}`);
  console.log(`浏览器能力: ${browserCaps.hasPublicKeyCredential && browserCaps.isSecureContext ? '✅' : '❌'}`);
  
  const allOk = envOk && browserCaps.hasPublicKeyCredential && browserCaps.isSecureContext;
  
  if (allOk) {
    console.log('\n🎉 所有检查通过！Passkey功能应该可以正常工作');
  } else {
    console.log('\n⚠️ 存在问题，请按上述建议修复配置');
  }
  
  return {
    environmentOk: envOk,
    browserOk: browserCaps.hasPublicKeyCredential && browserCaps.isSecureContext,
    allOk
  };
}

// 自动运行检查（如果在浏览器中）
if (typeof window !== 'undefined' && window.location.search.includes('debug=1')) {
  setTimeout(runFullEnvironmentCheck, 1000);
}

export default runFullEnvironmentCheck;
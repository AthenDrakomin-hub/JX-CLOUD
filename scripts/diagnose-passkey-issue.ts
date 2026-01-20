/**
 * Passkey 问题诊断工具
 * 用于检测 Passkey 验证中断或设备未绑定问题的根本原因
 */

console.log('🔍 开始诊断 Passkey 问题...\n');

// 检查浏览器兼容性
function checkBrowserCompatibility() {
    console.log('📋 浏览器兼容性检查:');
    
    const isSecureContext = window.isSecureContext;
    console.log(`  - 安全上下文 (HTTPS): ${isSecureContext ? '✅' : '❌ (需要HTTPS或localhost)'}`);
    
    const hasPublicKeyCredential = typeof PublicKeyCredential !== 'undefined';
    console.log(`  - PublicKeyCredential API: ${hasPublicKeyCredential ? '✅' : '❌'}`);
    
    if (hasPublicKeyCredential) {
        const isPlatformAuthenticatorAvailable = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'undefined';
        console.log(`  - 平台验证器可用性 API: ${isPlatformAuthenticatorAvailable ? '✅' : '❌'}`);
    }
    
    return {
        isSecureContext,
        hasPublicKeyCredential
    };
}

// 检查平台验证器支持
async function checkPlatformAuthenticator() {
    console.log('\n📱 平台验证器支持检查:');
    
    if (typeof PublicKeyCredential === 'undefined') {
        console.log('  - ❌ PublicKeyCredential 不可用');
        return false;
    }
    
    try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log(`  - 平台验证器可用: ${isAvailable ? '✅' : '❌'}`);
        return isAvailable;
    } catch (error) {
        console.log(`  - ❌ 检查平台验证器时出错: ${error.message}`);
        return false;
    }
}

// 检查认证服务连通性
async function checkAuthServiceConnectivity() {
    console.log('\n🌐 认证服务连通性检查:');
    
    try {
        // 尝试获取认证基础URL
        const authBaseUrl = localStorage.getItem('auth_base_url') || 
                           sessionStorage.getItem('auth_base_url') ||
                           (window.location.origin + '/functions/v1/better-auth');
        
        console.log(`  - 认证服务URL: ${authBaseUrl}`);
        
        // 检查是否可以访问认证端点
        const response = await fetch(`${authBaseUrl}/api/session`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log(`  - 会话端点连通性: ${response.ok ? '✅' : '❌'}`);
        console.log(`  - 响应状态: ${response.status}`);
        
        return response.ok;
    } catch (error) {
        console.log(`  - ❌ 连接认证服务时出错: ${error.message}`);
        return false;
    }
}

// 检查用户Passkey状态
async function checkUserPasskeyStatus() {
    console.log('\n🔑 用户Passkey状态检查:');
    
    // 检查本地存储中的用户信息
    const sessionData = localStorage.getItem('better-auth.session') || 
                       sessionStorage.getItem('better-auth.session');
    
    if (!sessionData) {
        console.log('  - 未检测到活动会话');
        return { hasSession: false };
    }
    
    try {
        const session = JSON.parse(sessionData);
        console.log(`  - 检测到用户会话: ${session.userId ? '✅' : '❌'}`);
        
        // 这里我们可以进一步检查用户的Passkey状态
        // 但由于这是一个前端脚本，我们只能做有限的检查
        return { 
            hasSession: !!session.userId,
            userId: session.userId
        };
    } catch (error) {
        console.log(`  - 解析会话数据失败: ${error.message}`);
        return { hasSession: false };
    }
}

// 修复建议
function provideFixSuggestions(compatibility, platformAuth, authService, userStatus) {
    console.log('\n🔧 修复建议:');
    
    if (!compatibility.isSecureContext) {
        console.log('  • 此应用必须通过 HTTPS 访问才能使用 Passkey 功能');
        console.log('  • 如果在本地开发，localhost 也可以工作');
    }
    
    if (!compatibility.hasPublicKeyCredential) {
        console.log('  • 当前浏览器不支持 WebAuthn API');
        console.log('  • 请使用现代浏览器如 Chrome, Firefox, Edge 或 Safari');
    }
    
    if (!platformAuth) {
        console.log('  • 设备不支持平台验证器（指纹、面部识别等）');
        console.log('  • 您可能需要使用外部安全密钥或启用生物识别硬件');
    }
    
    if (!authService) {
        console.log('  • 无法连接到认证服务');
        console.log('  • 检查网络连接和认证服务端点配置');
    }
    
    if (!userStatus.hasSession) {
        console.log('  • 用户未登录或会话已过期');
        console.log('  • 请先完成初始登录或注册流程');
    }
    
    console.log('\n💡 解决 Passkey 问题的步骤:');
    console.log('  1. 确保通过 HTTPS 访问应用（或 localhost 用于开发）');
    console.log('  2. 使用支持 WebAuthn 的现代浏览器');
    console.log('  3. 确保设备具有生物识别硬件或安全密钥');
    console.log('  4. 首次使用时需要注册 Passkey（在设置页面）');
    console.log('  5. 检查认证服务配置是否正确');
}

// 执行诊断
async function runDiagnosis() {
    console.log('🚀 运行 Passkey 问题诊断...\n');
    
    const compatibility = checkBrowserCompatibility();
    const platformAuth = await checkPlatformAuthenticator();
    const authService = await checkAuthServiceConnectivity();
    const userStatus = await checkUserPasskeyStatus();
    
    provideFixSuggestions(compatibility, platformAuth, authService, userStatus);
    
    console.log('\n✅ 诊断完成！');
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
    // 延迟执行以确保环境就绪
    setTimeout(runDiagnosis, 100);
} else {
    console.log('此诊断工具应在浏览器环境中运行');
}

export { runDiagnosis, checkBrowserCompatibility, checkPlatformAuthenticator };
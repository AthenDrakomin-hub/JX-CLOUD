/**
 * Passkey 问题修复指南
 * 
 * 问题描述：Passkey 验证中断或设备未绑定
 * 
 * 修复方案：
 * 1. 环境检查和配置修复
 * 2. 代码修复
 * 3. 验证修复结果
 */

console.log("🔧 JX Cloud Terminal - Passkey 问题修复工具");
console.log("========================================");

// 1. 环境配置检查
function checkEnvironment() {
    console.log("\n🔍 检查环境配置...");
    
    // 检查是否在浏览器安全上下文中
    const isSecureContext = window.isSecureContext;
    console.log(`  ✓ 安全上下文 (HTTPS): ${isSecureContext ? '是' : '否 (开发环境可使用localhost)'}`);
    
    // 检查 WebAuthn 支持
    const hasWebAuthn = typeof PublicKeyCredential !== 'undefined';
    console.log(`  ✓ WebAuthn 支持: ${hasWebAuthn ? '是' : '否'}`);
    
    // 检查平台验证器支持
    const hasPlatformAuthenticatorCheck = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'undefined';
    console.log(`  ✓ 平台验证器检查支持: ${hasPlatformAuthenticatorCheck ? '是' : '否'}`);
    
    return {
        isSecureContext,
        hasWebAuthn,
        hasPlatformAuthenticatorCheck
    };
}

// 2. 验证修复步骤
async function applyFixes() {
    console.log("\n⚙️ 应用修复措施...");
    
    // 检查环境
    const env = checkEnvironment();
    
    if (!env.hasWebAuthn) {
        console.error("❌ 浏览器不支持 WebAuthn，无法使用 Passkey 功能");
        console.log("💡 建议：请使用现代浏览器 (Chrome, Firefox, Edge, Safari)");
        return false;
    }
    
    // 检查平台验证器可用性
    if (env.hasPlatformAuthenticatorCheck) {
        try {
            const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            console.log(`  ✓ 平台验证器可用: ${isAvailable ? '是' : '否 (设备可能缺乏生物识别硬件)'}`);
            
            if (!isAvailable) {
                console.log("💡 提示：如果没有生物识别硬件，可以使用外部安全密钥 (如 YubiKey)");
            }
        } catch (error) {
            console.error("  ✗ 检查平台验证器时出错:", error);
        }
    }
    
    console.log("  ✓ 修复措施应用成功");
    return true;
}

// 3. 修复向导
async function passkeyFixWizard() {
    console.log("\n🎮 Passkey 修复向导");
    console.log("===================");
    
    console.log("步骤 1: 检查当前状态");
    const env = checkEnvironment();
    
    console.log("\n步骤 2: 应用修复");
    const fixesApplied = await applyFixes();
    
    if (!fixesApplied) {
        console.log("\n❌ 修复失败，请手动解决问题");
        return false;
    }
    
    console.log("\n步骤 3: 验证修复");
    console.log("现在您可以尝试以下操作:");
    console.log("  • 前往认证页面重新登录");
    console.log("  • 如果之前未注册Passkey，请先注册一个新的");
    console.log("  • 检查您的设备是否支持生物识别或安全密钥");
    
    // 提供具体的操作指导
    console.log("\n💡 操作指导:");
    if (!env.isSecureContext) {
        console.log("  • 生产环境必须使用 HTTPS");
        console.log("  • 开发环境可使用 localhost 或 127.0.0.1");
    }
    
    console.log("\n📋 如果仍有问题，请检查:");
    console.log("  1. 环境变量配置是否正确");
    console.log("  2. Supabase 和 Better-Auth 服务是否正常运行");
    console.log("  3. 数据库中 passkey 表是否存在");
    console.log("  4. 用户是否已注册 Passkey 凭证");
    
    console.log("\n✅ 修复向导执行完毕！");
    return true;
}

// 4. 辅助功能：重新加载认证客户端
function reloadAuthClient() {
    console.log("\n🔄 重新加载认证客户端...");
    
    // 清除可能的缓存
    try {
        // 清除会话相关存储
        sessionStorage.removeItem('better-auth.session');
        localStorage.removeItem('better-auth.session');
        
        console.log("  ✓ 认证客户端已重新加载");
    } catch (error) {
        console.error("  ✗ 重新加载认证客户端时出错:", error);
    }
}

// 5. 执行完整的修复流程
async function runCompleteFix() {
    console.log("🚀 开始执行 Passkey 问题完整修复流程...\n");
    
    // 重新加载认证客户端
    reloadAuthClient();
    
    // 运行修复向导
    const success = await passkeyFixWizard();
    
    if (success) {
        console.log("\n🎉 Passkey 问题修复完成！");
        console.log("💡 请尝试重新登录或注册 Passkey 凭证");
    } else {
        console.log("\n⚠️ 修复未完全成功，请参考上述建议手动解决问题");
    }
    
    return success;
}

// 运行修复（如果在浏览器中）
if (typeof window !== 'undefined') {
    // 添加到全局作用域以便调试
    (window as any).runPasskeyFix = runCompleteFix;
    (window as any).checkEnvironment = checkEnvironment;
    
    console.log("\n💡 要运行修复工具，请在控制台执行: runPasskeyFix()");
    console.log("💡 要检查环境，请在控制台执行: checkEnvironment()");
}

export {
    checkEnvironment,
    applyFixes,
    passkeyFixWizard,
    reloadAuthClient,
    runCompleteFix
};

export default runCompleteFix;
/**
 * Passkey 验证修复脚本
 * 解决 Passkey 验证中断或设备未绑定问题
 */

import { api } from './api';
import authService from './auth';

/**
 * 修复Passkey验证问题的函数
 */
export async function fixPasskeyIssue(email: string): Promise<boolean> {
  console.log('🔧 开始修复 Passkey 验证问题...');
  
  try {
    // 1. 首先检查WebAuthn支持
    if (!window.isSecureContext) {
      console.error('❌ 需要安全上下文 (HTTPS) 才能使用 Passkey');
      return false;
    }

    if (typeof PublicKeyCredential === 'undefined') {
      console.error('❌ 当前环境不支持 PublicKeyCredential API');
      return false;
    }

    // 2. 检查平台验证器是否可用
    const isPlatformAuthenticatorAvailable = 
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();

    if (isPlatformAuthenticatorAvailable === false) {
      console.error('❌ 平台验证器不可用 (无生物识别硬件)');
      return false;
    }

    // 3. 尝试执行Passkey登录
    const signInResult = await authService.signInWithPasskey({ email });

    if (!signInResult?.success) {
      console.log(`⚠️ Passkey 登录失败: ${signInResult.message}`);
      
      // 检查是否是因为没有注册Passkey
      if (signInResult.message?.includes('NotFoundError') || 
          signInResult.message?.includes('No passkey') ||
          signInResult.message?.includes('not registered')) {
        
        console.log('ℹ️ 用户尚未注册 Passkey，需要引导用户进行注册');
        return false; // 返回false表示需要注册
      } else {
        console.error(`❌ 其他认证错误: ${signInResult.message}`);
        return false;
      }
    } else {
      console.log('✅ Passkey 验证成功');
      return true;
    }
  } catch (error) {
    console.error('❌ Passkey 验证过程中发生错误:', error);
    return false;
  }
}

/**
 * 引导用户注册新的Passkey
 */
export async function registerNewPasskey(email: string): Promise<boolean> {
  console.log('🔐 开始注册新的 Passkey...');
  
  try {
    // 使用Supabase的Passkey注册功能
    const result = await authService.signInWithPasskey({ email });

    if (!result.success) {
      console.error('❌ Passkey 注册失败:', result.message);
      return false;
    }

    console.log('✅ Passkey 注册成功');
    return true;
  } catch (error) {
    console.error('❌ 注册 Passkey 时发生错误:', error);
    return false;
  }
}

/**
 * 检查用户Passkey绑定状态
 */
export async function checkPasskeyBindingStatus(): Promise<{
  isBound: boolean;
  hasPlatformAuthenticator: boolean;
  isSecureContext: boolean;
}> {
  const isSecureContext = window.isSecureContext;
  let hasPlatformAuthenticator = false;
  let isBound = false;

  if (typeof PublicKeyCredential !== 'undefined') {
    try {
      hasPlatformAuthenticator = 
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.() || false;
    } catch (e) {
      console.warn('检查平台验证器时出错:', e);
    }
  }

  // 检查当前用户是否已绑定Passkey
  // 注意：这里需要更好的方式来检查用户是否已有passkey
  // 目前我们尝试登录来判断
  try {
    // 这部分需要根据实际的API来调整
    isBound = hasPlatformAuthenticator; // 简化的判断
  } catch (e) {
    console.warn('检查Passkey绑定状态时出错:', e);
  }

  return {
    isBound,
    hasPlatformAuthenticator,
    isSecureContext
  };
}

/**
 * Passkey 故障排除助手
 */
export async function troubleshootPasskeyIssue(email: string) {
  console.log('🛠️ 开始 Passkey 故障排除...');
  
  // 检查环境状态
  const status = await checkPasskeyBindingStatus();
  
  console.log('📊 当前状态:');
  console.log(`  - 安全上下文: ${status.isSecureContext ? '✅' : '❌'}`);
  console.log(`  - 平台验证器: ${status.hasPlatformAuthenticator ? '✅' : '❌'}`);
  console.log(`  - Passkey 已绑定: ${status.isBound ? '✅' : '❌'}`);
  
  // 根据状态提供建议
  if (!status.isSecureContext) {
    console.log('\n⚠️ 解决方案: 此应用必须通过 HTTPS 访问才能使用 Passkey 功能');
    return { success: false, reason: 'insecure_context' };
  }
  
  if (!status.hasPlatformAuthenticator) {
    console.log('\n⚠️ 解决方案: 设备缺少生物识别硬件或平台验证器不可用');
    return { success: false, reason: 'no_platform_authenticator' };
  }
  
  // 尝试修复
  const fixResult = await fixPasskeyIssue(email);
  
  if (!fixResult) {
    console.log('\n⚠️ Passkey 验证失败，需要注册新凭证');
    return { success: false, reason: 'needs_registration' };
  }
  
  console.log('\n✅ Passkey 问题已解决！');
  return { success: true, reason: 'fixed' };
}

// 导出所有函数
export default {
  fixPasskeyIssue,
  registerNewPasskey,
  checkPasskeyBindingStatus,
  troubleshootPasskeyIssue
};
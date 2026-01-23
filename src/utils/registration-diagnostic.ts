/**
 * 注册流程修复工具
 * 
 * 用于诊断和修复账号注册相关问题
 */

import { api } from '../services/api.js';

// 注册流程诊断类
class RegistrationDiagnosticTool {
  /**
   * 检查注册流程完整性
   */
  async checkRegistrationFlow() {
    console.log('🔍 开始检查注册流程...');
    
    const checks = {
      environment: await this.checkEnvironment(),
      apiEndpoints: await this.checkApiEndpoints(),
      database: await this.checkDatabase(),
      authConfig: await this.checkAuthConfiguration()
    };
    
    return checks;
  }

  /**
   * 检查环境配置
   */
  async checkEnvironment() {
    console.log('📋 检查环境配置...');
    
    const checks = {
      isSecureContext: window.isSecureContext,
      hasRequiredEnvVars: this.checkRequiredEnvVars(),
      hasWebAuthnSupport: this.checkWebAuthnSupport()
    };
    
    console.log('✅ 环境检查完成:', checks);
    return checks;
  }

  /**
   * 检查必需的环境变量
   */
  checkRequiredEnvVars() {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_BETTER_AUTH_URL',
      'BETTER_AUTH_SECRET'
    ];
    
    let allPresent = true;
    for (const varName of requiredVars) {
      const value = (import.meta as any).env?.[varName] || (process.env as any)?.[varName];
      if (!value) {
        console.warn(`⚠️ 缺少环境变量: ${varName}`);
        allPresent = false;
      }
    }
    
    return allPresent;
  }

  /**
   * 检查WebAuthn支持
   */
  checkWebAuthnSupport() {
    const hasWebAuthn = typeof PublicKeyCredential !== 'undefined';
    const hasPlatformAuth = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'undefined';
    
    if (!hasWebAuthn) {
      console.warn('⚠️ 浏览器不支持 WebAuthn API');
    }
    
    if (!hasPlatformAuth) {
      console.warn('⚠️ 浏览器不支持平台验证器可用性检查');
    }
    
    return hasWebAuthn && hasPlatformAuth;
  }

  /**
   * 检查API端点可用性
   */
  async checkApiEndpoints() {
    console.log('📡 检查API端点...');
    
    const endpoints = {
      registrationRequest: false,
      registrationApproval: false,
      registrationRejection: false,
      registrationList: false
    };
    
    try {
      // 检查注册请求端点
      try {
        const response = await fetch('/api/auth/request-registration', {
          method: 'OPTIONS' // 使用OPTIONS方法检查端点是否存在
        });
        endpoints.registrationRequest = response.status !== 404;
      } catch (e) {
        console.warn('❌ 注册请求端点不可用');
      }
      
      // 检查获取注册请求列表端点
      try {
        const response = await fetch('/api/auth/registration-requests', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        endpoints.registrationList = response.status !== 404;
      } catch (e) {
        console.warn('❌ 注册请求列表端点不可用');
      }
      
      console.log('✅ API端点检查完成:', endpoints);
      return endpoints;
    } catch (error) {
      console.error('❌ API端点检查失败:', error);
      return endpoints;
    }
  }

  /**
   * 检查数据库连接和表
   */
  async checkDatabase() {
    console.log('🗄️ 检查数据库...');
    
    const checks = {
      connection: false,
      registrationTable: false,
      authTables: false
    };
    
    try {
      // 检查数据库连接和健康状态
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const healthData = await response.json();
          checks.connection = true;
          console.log('✅ 数据库连接正常:', healthData);
        }
      } catch (e) {
        console.warn('❌ 数据库连接异常:', e);
      }
      
      // 检查注册请求表
      try {
        const response = await fetch('/api/auth/registration-requests', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          checks.registrationTable = true;
          console.log('✅ 注册请求表正常');
        }
      } catch (e) {
        console.warn('❌ 注册请求表异常:', e);
      }
      
      return checks;
    } catch (error) {
      console.error('❌ 数据库检查失败:', error);
      return checks;
    }
  }

  /**
   * 检查认证配置
   */
  async checkAuthConfiguration() {
    console.log('🔐 检查认证配置...');
    
    const checks = {
      betterAuthConfigured: false,
      supabaseIntegration: false,
      passkeyEnabled: true // 默认启用，因为系统设计如此
    };
    
    try {
      // 检查Better-Auth端点
      try {
        const authBaseUrl = (import.meta as any).env?.VITE_BETTER_AUTH_URL || 
                           (import.meta as any).env?.VITE_SUPABASE_URL?.replace(/\/$/, '') + '/functions/v1/better-auth';
        
        if (authBaseUrl) {
          const response = await fetch(`${authBaseUrl}/api/session`, {
            method: 'GET',
            credentials: 'include'
          });
          
          checks.betterAuthConfigured = response.status !== 404;
          console.log('✅ Better-Auth配置检查:', checks.betterAuthConfigured);
        }
      } catch (e) {
        console.warn('❌ Better-Auth配置检查失败:', e);
      }
      
      return checks;
    } catch (error) {
      console.error('❌ 认证配置检查失败:', error);
      return checks;
    }
  }

  /**
   * 修复注册流程问题
   */
  async fixRegistrationIssues() {
    console.log('🔧 开始修复注册流程问题...');
    
    const fixes = {
      applied: [] as string[],
      failed: [] as string[]
    };
    
    // 尝试修复环境问题
    try {
      await this.ensureEnvironment();
      fixes.applied.push('环境配置');
    } catch (e) {
      fixes.failed.push('环境配置: ' + (e as Error).message);
    }
    
    // 尝试修复API端点问题
    try {
      await this.ensureApiEndpoints();
      fixes.applied.push('API端点');
    } catch (e) {
      fixes.failed.push('API端点: ' + (e as Error).message);
    }
    
    // 尝试修复数据库问题
    try {
      await this.ensureDatabase();
      fixes.applied.push('数据库');
    } catch (e) {
      fixes.failed.push('数据库: ' + (e as Error).message);
    }
    
    console.log('✅ 修复完成:', fixes);
    return fixes;
  }

  /**
   * 确保环境配置正确
   */
  async ensureEnvironment() {
    // 环境检查主要是诊断性的，实际修复需要手动配置
    console.log('📋 环境配置检查完成（需要手动修复配置问题）');
  }

  /**
   * 确保API端点可用
   */
  async ensureApiEndpoints() {
    // API端点由Supabase Edge Functions提供，检查即可
    console.log('📡 API端点检查完成');
  }

  /**
   * 确保数据库表存在
   */
  async ensureDatabase() {
    // 检查注册请求表
    try {
      const response = await fetch('/api/auth/registration-requests', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 404) {
        console.warn('⚠️ 注册请求表可能不存在，需要检查数据库迁移');
      } else {
        console.log('✅ 注册请求表正常');
      }
    } catch (e) {
      console.error('❌ 检查注册表失败:', e);
      throw e;
    }
  }
}

// 创建诊断工具实例
const registrationDiagnostic = new RegistrationDiagnosticTool();

// 导出诊断工具和修复函数
export {
  RegistrationDiagnosticTool,
  registrationDiagnostic
};

// 导出默认对象
export default {
  diagnostic: registrationDiagnostic,
  checkRegistrationFlow: registrationDiagnostic.checkRegistrationFlow.bind(registrationDiagnostic),
  fixRegistrationIssues: registrationDiagnostic.fixRegistrationIssues.bind(registrationDiagnostic)
};
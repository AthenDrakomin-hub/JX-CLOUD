/**
 * 账号注册问题修复方案
 * 
 * 当前系统注册流程分析：
 * 1. 用户提交注册请求 (request-registration)
 * 2. 管理员审核 (approve/reject)
 * 3. 用户激活账户 (StaffActivation)
 * 
 * 问题可能出现在以下环节：
 * - 注册请求提交失败
 * - 管理员审核流程问题
 * - 用户激活流程问题
 * - 数据库表缺失或配置错误
 */

import { api } from '../services/api';
import authClient from '../services/frontend/auth-client.frontend';

// 修复注册请求提交问题
export async function fixRegistrationRequest(email: string, name: string) {
  try {
    console.log('📝 提交注册请求:', { email, name });
    
    // 检查输入参数
    if (!email || !name) {
      throw new Error('邮箱和姓名不能为空');
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('邮箱格式不正确');
    }
    
    // 调用API提交注册请求
    const result = await api.registration.request(email, name);
    
    console.log('✅ 注册请求提交成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 注册请求提交失败:', error);
    throw error;
  }
}

// 修复管理员审核流程
export async function fixAdminApproval(requestId: string) {
  try {
    console.log('✅ 批准注册请求:', requestId);
    
    const result = await api.registration.approve(requestId);
    console.log('✅ 注册请求批准成功:', result);
    
    return result;
  } catch (error) {
    console.error('❌ 注册请求批准失败:', error);
    throw error;
  }
}

// 修复注册拒绝流程
export async function fixAdminRejection(requestId: string, reason?: string) {
  try {
    console.log('❌ 拒绝注册请求:', requestId, reason);
    
    const result = await api.registration.reject(requestId, reason);
    console.log('✅ 注册请求拒绝成功:', result);
    
    return result;
  } catch (error) {
    console.error('❌ 注册请求拒绝失败:', error);
    throw error;
  }
}

// 修复用户激活流程
export async function fixUserActivation(token: string) {
  try {
    console.log('🔐 激活用户账户:', token);
    
    // 解码并验证令牌
    let decodedInfo;
    try {
      const decoded = atob(token);
      decodedInfo = JSON.parse(decoded);
    } catch (e) {
      throw new Error('无效的激活令牌');
    }
    
    // 使用Better-Auth进行Passkey注册
    const result = await (authClient.signUp as any).passkey({
      email: decodedInfo.email,
      name: decodedInfo.name,
    });
    
    if (result.error) {
      throw new Error(result.error.message || '用户激活失败');
    }
    
    console.log('✅ 用户激活成功');
    return result;
  } catch (error) {
    console.error('❌ 用户激活失败:', error);
    throw error;
  }
}

// 检查注册相关数据库表
export async function checkRegistrationTables() {
  try {
    console.log('🔍 检查注册相关数据库表...');
    
    // 检查注册请求表是否存在
    const response = await fetch('/api/auth/registration-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      console.log('✅ 注册请求表正常');
      return true;
    } else {
      console.error('❌ 注册请求表异常:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 检查注册表时出错:', error);
    return false;
  }
}

// 获取所有待审核的注册请求
export async function getPendingRegistrations() {
  try {
    console.log('📋 获取待审核注册请求...');
    
    const requests = await api.registration.getAll();
    const pendingRequests = requests.filter((req: any) => req.status === 'pending');
    
    console.log(`✅ 找到 ${pendingRequests.length} 个待审核请求`);
    return pendingRequests;
  } catch (error) {
    console.error('❌ 获取待审核请求失败:', error);
    throw error;
  }
}

// 注册流程完整诊断
export async function diagnoseRegistrationFlow() {
  console.log('🔧 开始注册流程诊断...');
  
  const diagnosis = {
    tablesOk: false,
    canSubmitRequest: false,
    canFetchRequests: false,
    hasPendingRequests: false
  };
  
  try {
    // 检查数据库表
    diagnosis.tablesOk = await checkRegistrationTables();
    
    // 尝试获取待审核请求
    try {
      const pending = await getPendingRegistrations();
      diagnosis.canFetchRequests = true;
      diagnosis.hasPendingRequests = pending.length > 0;
    } catch (e) {
      console.error('获取请求失败:', e);
    }
    
    console.log('📋 诊断结果:', diagnosis);
    return diagnosis;
  } catch (error) {
    console.error('诊断过程出错:', error);
    return diagnosis;
  }
}

// 修复建议
export function getRegistrationFixRecommendations(diagnosis: any) {
  const recommendations = [];
  
  if (!diagnosis.tablesOk) {
    recommendations.push('❌ 注册相关数据库表缺失，需要创建registration_requests表');
  }
  
  if (!diagnosis.canFetchRequests) {
    recommendations.push('❌ 无法获取注册请求，检查API端点和权限设置');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ 注册流程基本正常');
    if (diagnosis.hasPendingRequests) {
      recommendations.push('📋 发现待审核请求，管理员需要及时处理');
    } else {
      recommendations.push('📋 暂无待审核请求');
    }
  }
  
  return recommendations;
}

export default {
  fixRegistrationRequest,
  fixAdminApproval,
  fixAdminRejection,
  fixUserActivation,
  checkRegistrationTables,
  getPendingRegistrations,
  diagnoseRegistrationFlow,
  getRegistrationFixRecommendations
};
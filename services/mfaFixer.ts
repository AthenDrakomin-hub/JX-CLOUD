/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { api } from './api';
import { User } from '../types';

/**
 * MFA状态修复工具
 * 用于修复MFA配置不一致的问题
 */
export const mfaFixer = {
  /**
   * 检查用户的MFA状态一致性
   */
  checkMFAStatus: async (userId: string): Promise<{
    userId: string;
    twoFactorEnabled: boolean;
    hasMFASecret: boolean;
    isConsistent: boolean;
    issue: string | null;
  }> => {
    try {
      const users = await api.users.getAll();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return {
          userId,
          twoFactorEnabled: false,
          hasMFASecret: false,
          isConsistent: false,
          issue: '用户不存在'
        };
      }
      
      const twoFactorEnabled = user.twoFactorEnabled || false;
      const hasMFASecret = !!user.mfaSecret && user.mfaSecret.trim() !== '';
      
      // 检查一致性：如果启用了MFA但没有密钥，则不一致
      const isConsistent = 
        (twoFactorEnabled && hasMFASecret) || 
        (!twoFactorEnabled && !hasMFASecret);
      
      let issue = null;
      if (twoFactorEnabled && !hasMFASecret) {
        issue = 'MFA已启用但缺少密钥';
      } else if (!twoFactorEnabled && hasMFASecret) {
        issue = '存在MFA密钥但未启用MFA';
      }
      
      return {
        userId,
        twoFactorEnabled,
        hasMFASecret,
        isConsistent,
        issue
      };
    } catch (error) {
      console.error('检查MFA状态失败:', error);
      return {
        userId,
        twoFactorEnabled: false,
        hasMFASecret: false,
        isConsistent: false,
        issue: `检查失败: ${(error as Error).message}`
      };
    }
  },

  /**
   * 修复用户的MFA状态
   */
  fixMFAStatus: async (user: User): Promise<{ success: boolean; message: string }> => {
    try {
      const updatedUser = { ...user };
      const hasMFASecret = !!updatedUser.mfaSecret && updatedUser.mfaSecret.trim() !== '';
      
      // 如果有MFA密钥但未启用MFA，则启用MFA
      if (hasMFASecret && !updatedUser.twoFactorEnabled) {
        updatedUser.twoFactorEnabled = true;
      }
      // 如果没有MFA密钥但启用了MFA，则禁用MFA
      else if (!hasMFASecret && updatedUser.twoFactorEnabled) {
        updatedUser.twoFactorEnabled = false;
      }
      
      // 更新用户信息
      await api.users.update(updatedUser);
      
      return {
        success: true,
        message: 'MFA状态已修复'
      };
    } catch (error) {
      console.error('修复MFA状态失败:', error);
      return {
        success: false,
        message: `修复失败: ${(error as Error).message}`
      };
    }
  },

  /**
   * 批量检查所有用户的MFA状态
   */
  checkAllUsersMFAStatus: async (): Promise<Array<{
    userId: string;
    username: string;
    name: string;
    twoFactorEnabled: boolean;
    hasMFASecret: boolean;
    isConsistent: boolean;
    issue: string | null;
  }>> => {
    try {
      const users = await api.users.getAll();
      const results = [];
      
      for (const user of users) {
        const status = await mfaFixer.checkMFAStatus(user.id);
        results.push({
          ...status,
          username: user.username,
          name: user.name
        });
      }
      
      return results;
    } catch (error) {
      console.error('批量检查MFA状态失败:', error);
      return [];
    }
  },

  /**
   * 批量修复所有用户的MFA状态
   */
  fixAllUsersMFAStatus: async (): Promise<{
    successCount: number;
    failedCount: number;
    messages: string[];
  }> => {
    try {
      const users = await api.users.getAll();
      let successCount = 0;
      let failedCount = 0;
      const messages: string[] = [];
      
      for (const user of users) {
        const result = await mfaFixer.fixMFAStatus(user);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          messages.push(`用户 ${user.username}: ${result.message}`);
        }
      }
      
      return {
        successCount,
        failedCount,
        messages
      };
    } catch (error) {
      console.error('批量修复MFA状态失败:', error);
      return {
        successCount: 0,
        failedCount: 0,
        messages: [`批量修复失败: ${(error as Error).message}`]
      };
    }
  }
};
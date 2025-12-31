/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { TOTP } from './totp';

/**
 * MFA (多因素认证) 服务
 * 提供完整的双因素认证功能
 */
export const mfaService = {
  /**
   * 生成新的 MFA 配置
   * @param accountName 账户名称
   * @param issuer 发行者名称
   * @returns 包含密钥和 otpauth URL 的对象
   */
  generateMfaConfig: (accountName: string, issuer: string = 'JXCloud') => {
    const secret = TOTP.generateSecret();
    const otpauthUrl = TOTP.generateOtpAuthUrl(secret, accountName, issuer);
    
    return {
      secret,
      otpauthUrl
    };
  },

  /**
   * 验证 MFA 令牌
   * @param secret 用户的 MFA 密钥
   * @param token 用户输入的 6 位验证码
   * @returns 验证是否成功
   */
  verifyToken: async (secret: string, token: string): Promise<boolean> => {
    try {
      return await TOTP.verify(secret, token);
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  },

  /**
   * 生成当前有效的 TOTP 令牌 (主要用于测试)
   * @param secret 用户的 MFA 密钥
   * @returns 当前有效的 6 位验证码
   */
  generateCurrentToken: async (secret: string): Promise<string> => {
    try {
      return await TOTP.generate(secret);
    } catch (error) {
      console.error('MFA token generation error:', error);
      throw error;
    }
  },

  /**
   * 验证 MFA 设置
   * 在用户绑定新 MFA 时验证其输入的令牌
   */
  verifySetup: async (secret: string, token: string): Promise<boolean> => {
    return await mfaService.verifyToken(secret, token);
  }
};
import { supabase } from './supabaseClient';

/**
 * Supabase 认证服务封装
 * 提供 Magic Link 和 Passkey 无密码认证功能
 */

export interface SignInWithMagicLinkParams {
  email: string;
  redirectTo?: string;
}

export interface SignInWithPasskeyParams {
  email: string;
}

export interface SignUpParams {
  email: string;
  password?: string;
  redirectTo?: string;
}

/**
 * 通过 Magic Link 登录
 * 用户输入邮箱后，系统发送包含一次性链接的邮件
 */
export const signInWithMagicLink = async ({ 
  email, 
  redirectTo = window.location.origin 
}: SignInWithMagicLinkParams): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true // 如果用户不存在则自动创建
      }
    });

    if (error) {
      console.error('Magic link sign in error:', error);
      return { success: false, message: error.message };
    }

    // 成功发送邮件
    return { 
      success: true, 
      message: '登录链接已发送至您的邮箱，请查收邮件并点击链接完成登录。' 
    };
  } catch (err) {
    console.error('Unexpected error during magic link sign in:', err);
    return { success: false, message: '发生未知错误，请稍后重试。' };
  }
};

/**
 * 通过 Passkey (生物识别) 登录
 * 支持指纹、面部识别、Windows Hello 等设备内置认证方式
 */
export const signInWithPasskey = async ({ 
  email 
}: SignInWithPasskeyParams): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    // 检查浏览器是否支持 Passkey
    if (!window.PublicKeyCredential) {
      return { 
        success: false, 
        message: '您的浏览器不支持 Passkey 功能，请升级到最新版本或更换现代浏览器。' 
      };
    }

    const { data, error } = await supabase.auth.signInWithPasskey({
      email
    });

    if (error) {
      console.error('Passkey sign in error:', error);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: 'Passkey 认证成功！',
      data
    };
  } catch (err) {
    console.error('Unexpected error during passkey sign in:', err);
    return { success: false, message: 'Passkey 认证失败，请检查设备是否支持生物识别功能。' };
  }
};

/**
 * 注册新用户
 * 通过 OTP 方式注册，无需密码
 */
export const signUpWithEmail = async ({ 
  email, 
  password,
  redirectTo = window.location.origin 
}: SignUpParams): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password: password || Math.random().toString(36).slice(-12), // 生成随机密码
      options: {
        emailRedirectTo: redirectTo,
        data: {
          registration_method: 'email_otp'
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: '注册链接已发送至您的邮箱，请查收邮件并点击链接完成注册。' 
    };
  } catch (err) {
    console.error('Unexpected error during sign up:', err);
    return { success: false, message: '注册失败，请稍后重试。' };
  }
};

/**
 * 退出登录
 */
export const signOut = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: '已成功退出登录。' 
    };
  } catch (err) {
    console.error('Unexpected error during sign out:', err);
    return { success: false, message: '退出登录时发生错误。' };
  }
};

/**
 * 获取当前会话
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Get session error:', error);
    return null;
  }
  
  return session;
};

/**
 * 获取当前用户
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Get user error:', error);
    return null;
  }
  
  return user;
};

/**
 * 监听认证状态变化
 */
export const onAuthStateChange = (callback: (event: any, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * 验证 OTP (一次性密码)
 */
export const verifyOtp = async (params: {
  email: string;
  token: string;
  type: 'email' | 'sms';
}) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: params.email,
      token: params.token,
      type: params.type
    });

    if (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      data 
    };
  } catch (err) {
    console.error('Unexpected error during OTP verification:', err);
    return { success: false, message: 'OTP 验证失败。' };
  }
};

export default {
  signInWithMagicLink,
  signInWithPasskey,
  signUpWithEmail,
  signOut,
  getCurrentSession,
  getCurrentUser,
  onAuthStateChange,
  verifyOtp
};
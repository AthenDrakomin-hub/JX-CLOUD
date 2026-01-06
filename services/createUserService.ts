import { User, UserCreatePayload } from '../types';

/**
 * 与 Supabase Edge Function create-user 集成的服务
 * 用于通过 API 创建用户记录
 */
export interface CreateUserResponse extends User {
  id: string;
  created_at: string;
}

/**
 * 通过 Supabase Edge Function 创建用户
 * @param userData 用户创建数据
 * @param supabaseUrl Supabase 项目 URL
 * @param jwt 可选的 JWT token（如果启用了 verify_jwt）
 * @returns 创建的用户对象
 */
export const createUserService = async (
  userData: UserCreatePayload,
  jwt?: string
): Promise<CreateUserResponse> => {
  // 从环境变量获取 Supabase 项目 URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL 环境变量未配置');
  }

  // 从 Supabase URL 提取项目 ID（URL 格式为 https://[project-id].supabase.co）
  const urlParts = supabaseUrl.replace('https://', '').split('.');
  const projectId = urlParts[0];
  
  if (!projectId) {
    throw new Error('无法从 Supabase URL 中提取项目 ID');
  }

  const edgeFunctionUrl = `https://${projectId}.functions.supabase.co/create-user`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`创建用户失败: ${response.status} - ${errorData}`);
  }

  const result: CreateUserResponse = await response.json();
  return result;
};

/**
 * 验证用户创建数据的有效性
 * @param userData 用户创建数据
 * @returns 验证错误信息，如果没有错误则返回 null
 */
export const validateUserCreatePayload = (userData: UserCreatePayload): string | null => {
  if (!userData.email) {
    return '邮箱是必需的';
  }

  // 基本邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return '请输入有效的邮箱地址';
  }

  if (userData.role && !['admin', 'staff', 'maintainer', 'viewer'].includes(userData.role)) {
    return '角色必须是 admin, staff, maintainer 或 viewer 之一';
  }

  return null;
};
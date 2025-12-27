import { supabase } from './supabaseClient';

/**
 * JX Cloud Storage Service
 * 用于处理图片素材上传和管理
 */

// 定义存储桶名称
const BUCKET_NAME = 'materials';

// Supabase项目URL和函数端点
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTION_ENDPOINT = `${PROJECT_URL}/functions/v1/set-owner-id`;

/**
 * 上传文件到Supabase存储桶
 * @param file 要上传的文件
 * @param fileName 文件名
 * @param userId 用户ID（用于所有权验证）
 * @returns 上传结果
 */
export const uploadFile = async (file: File, fileName: string, userId?: string) => {
  try {
    // 准备元数据，确保包含所有者信息以满足RLS策略
    const fileMetadata = {
      owner: userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
      fileName: file.name,
      size: file.size,
      type: file.type,
      // 确保owner信息在metadata中，以满足RLS策略
      owner_id: userId || 'anonymous'
    };

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
        metadata: fileMetadata
      });

    if (error) {
      throw error;
    }

    // 如果用户ID存在，调用Edge Function设置owner_id列
    if (userId) {
      try {
        // 获取当前用户的会话
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          // 调用Edge Function设置owner_id列
          const response = await fetch(FUNCTION_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'JX-Cloud/1.0'
            },
            body: JSON.stringify({
              bucket_id: BUCKET_NAME,
              object_name: `public/${fileName}`
            })
          });

          if (!response.ok) {
            console.warn('设置owner_id失败:', await response.text());
          }
        }
      } catch (funcError) {
        console.warn('调用set-owner-id函数失败:', funcError);
      }
    }

    return data;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

/**
 * 获取公开URL
 * @param fileName 文件名
 * @returns 公开访问URL
 */
export const getPublicUrl = (fileName: string) => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`public/${fileName}`);
  
  return data?.publicUrl;
};

/**
 * 删除存储桶中的文件
 * @param fileName 文件名
 * @returns 删除结果
 */
export const deleteFile = async (fileName: string) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`public/${fileName}`]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('文件删除失败:', error);
    throw error;
  }
};

/**
 * 列出存储桶中的文件
 * @param path 路径，默认为'public/'
 * @returns 文件列表
 */
export const listFiles = async (path = 'public/') => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('文件列表获取失败:', error);
    throw error;
  }
};

/**
 * 从存储桶下载文件
 * @param fileName 文件名
 * @returns 下载结果
 */
export const downloadFile = async (fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`public/${fileName}`);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
};

/**
 * 生成签名URL（用于临时访问私有文件）
 * @param fileName 文件名
 * @param expiresIn URL有效时间（秒）
 * @returns 签名URL
 */
export const getSignedUrl = async (fileName: string, expiresIn: number = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(`public/${fileName}`, expiresIn);

    if (error) {
      throw error;
    }

    return data?.signedUrl;
  } catch (error) {
    console.error('生成签名URL失败:', error);
    throw error;
  }
};
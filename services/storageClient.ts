import { supabase } from './supabaseClient';

/**
 * JX Cloud Storage Service
 * 用于处理图片素材上传和管理
 */

// 定义存储桶名称
const BUCKET_NAME = 'materials';

/**
 * 上传文件到Supabase存储桶
 * @param file 要上传的文件
 * @param fileName 文件名
 * @returns 上传结果
 */
export const uploadFile = async (file: File, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
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
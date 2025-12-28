import { supabase, isDemoMode } from './supabaseClient';
import { MaterialImage } from '../types';

/**
 * Supabase Storage 服务 - 处理云端素材库上传和管理
 */
export const storageService = {
  /**
   * 上传文件到Supabase存储桶
   * @param file 要上传的文件
   * @param bucketName 存储桶名称
   * @param filePath 文件路径
   * @returns 上传结果
   */
  uploadFile: async (file: File, bucketName: string = 'materials', filePath?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (isDemoMode) {
      // 演示模式：返回模拟数据
      return {
        success: true,
        url: URL.createObjectURL(file) // 创建本地URL用于预览
      };
    }

    try {
      // 如果没有指定文件路径，则生成一个唯一路径
      // 替换文件名中的特殊字符，保留字母、数字、点和连字符
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = filePath || `${Date.now()}-${sanitizedFileName}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // 如果文件已存在不覆盖
        });

      if (error) {
        console.error('文件上传失败:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // 获取公开URL
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: publicData.publicUrl
      };
    } catch (error: any) {
      console.error('上传过程中发生错误:', error);
      return {
        success: false,
        error: error.message || '上传失败'
      };
    }
  },

  /**
   * 从Supabase存储桶删除文件
   * @param filePath 文件路径
   * @param bucketName 存储桶名称
   */
  deleteFile: async (filePath: string, bucketName: string = 'materials'): Promise<boolean> => {
    if (isDemoMode) {
      return true;
    }

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('文件删除失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除过程中发生错误:', error);
      return false;
    }
  },

  /**
   * 从文件路径获取文件名
   */
  getFileNameFromPath: (filePath: string): string => {
    return filePath.split('/').pop() || filePath;
  },

  /**
   * 获取文件扩展名
   */
  getFileExtension: (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  /**
   * 验证文件类型是否为图像
   */
  isValidImageFile: (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    const fileType = file.type.toLowerCase();
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    return validTypes.includes(fileType) || validExtensions.includes(fileExtension);
  },

  /**
   * 验证文件大小（最大10MB）
   */
  isValidFileSize: (file: File, maxSizeInMB: number = 10): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024; // 10MB in bytes
    return file.size <= maxSizeInBytes;
  }
};

export default storageService;
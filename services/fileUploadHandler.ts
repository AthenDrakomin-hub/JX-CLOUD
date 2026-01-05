/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { ErrorHandler, ErrorCode } from './errorHandler';

// 文件上传错误处理工具
export class FileUploadHandler {
  // 验证文件类型
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    return allowedTypes.some(allowedType => {
      if (allowedType.startsWith('.')) {
        // 检查扩展名
        return fileExtension === allowedType.substring(1).toLowerCase();
      } else {
        // 检查 MIME 类型
        return fileType.startsWith(allowedType);
      }
    });
  }

  // 验证文件大小
  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024; // 转换为字节
    return file.size <= maxSizeInBytes;
  }

  // 处理文件上传错误
  static handleUploadError(error: any, context?: string): void {
    const appError = ErrorHandler.logError(error, `FileUpload-${context || 'General'}`);
    
    // 根据错误类型提供用户友好的消息
    if (error.code === ErrorCode.INVALID_FILE_TYPE) {
      throw new Error('不支持的文件类型，请上传正确的文件格式');
    } else if (error.code === ErrorCode.FILE_SIZE_EXCEEDED) {
      throw new Error(`文件大小超出限制，请上传小于指定大小的文件`);
    } else if (error.code === ErrorCode.FILE_UPLOAD_ERROR) {
      throw new Error('文件上传失败，请检查网络连接后重试');
    } else {
      throw new Error('文件上传过程中发生错误，请稍后重试');
    }
  }

  // 上传文件的通用方法
  static async uploadFile(
    file: File, 
    uploadUrl: string, 
    allowedTypes: string[] = [],
    maxSizeInMB: number = 10
  ): Promise<any> {
    try {
      // 验证文件类型
      if (allowedTypes.length > 0 && !this.validateFileType(file, allowedTypes)) {
        const error = new Error(`Invalid file type: ${file.type}`);
        (error as any).code = ErrorCode.INVALID_FILE_TYPE;
        throw error;
      }

      // 验证文件大小
      if (!this.validateFileSize(file, maxSizeInMB)) {
        const error = new Error(`File size exceeds limit: ${maxSizeInMB}MB`);
        (error as any).code = ErrorCode.FILE_SIZE_EXCEEDED;
        throw error;
      }

      // 创建 FormData 并上传文件
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.handleUploadError(error, 'uploadFile');
    }
  }
}

// 导出常用的文件类型验证
export const CommonFileTypes = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', '.jpg', '.jpeg', '.png', '.webp', '.gif'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.pdf', '.doc', '.docx'],
  VIDEOS: ['video/mp4', 'video/quicktime', 'video/x-msvideo', '.mp4', '.mov', '.avi']
};
/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { ErrorLogger } from './errorLogger';

// 错误类型定义
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  stack?: string;
}

// 错误码枚举
export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // 认证错误
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  
  // 业务逻辑错误
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
  
  // 文件上传错误
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  
  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误处理工具类
export class ErrorHandler {
  // 记录错误日志
  static logError(error: any, context?: string): AppError {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: { ...error.details, context } || { context },
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    // 在开发环境中打印详细错误信息
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context || 'Error Handler'}]`, appError);
    }

    // 记录到错误日志器
    ErrorLogger.logError(appError);

    // 生产环境中可以发送错误信息到监控服务
    // this.sendToMonitoringService(appError);

    return appError;
  }

  // 根据错误对象获取错误码
  private static getErrorCode(error: any): string {
    if (error.code) {
      return error.code;
    }

    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }

    // 超时错误
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return ErrorCode.TIMEOUT_ERROR;
    }

    // 认证错误
    if (error.status === 401 || error.message.includes('unauthorized')) {
      return ErrorCode.AUTHENTICATION_ERROR;
    }

    // 授权错误
    if (error.status === 403) {
      return ErrorCode.AUTHORIZATION_ERROR;
    }

    // 数据库错误
    if (error.message.includes('database') || error.message.includes('sql')) {
      return ErrorCode.DATABASE_ERROR;
    }

    // 记录未找到错误
    if (error.status === 404) {
      return ErrorCode.RECORD_NOT_FOUND;
    }

    // 未知错误
    return ErrorCode.UNKNOWN_ERROR;
  }

  // 根据错误对象获取用户友好的错误消息
  private static getErrorMessage(error: any): string {
    // 如果错误对象本身有中文消息，优先使用
    if (error.userMessage) {
      return error.userMessage;
    }

    // 根据错误码返回中文错误消息
    const errorCode = this.getErrorCode(error);
    switch (errorCode) {
      case ErrorCode.NETWORK_ERROR:
        return '网络连接失败，请检查网络设置后重试';
      case ErrorCode.TIMEOUT_ERROR:
        return '请求超时，请稍后重试';
      case ErrorCode.AUTHENTICATION_ERROR:
        return '身份验证失败，请重新登录';
      case ErrorCode.AUTHORIZATION_ERROR:
        return '权限不足，无法执行此操作';
      case ErrorCode.SESSION_EXPIRED:
        return '会话已过期，请重新登录';
      case ErrorCode.DATABASE_ERROR:
        return '数据操作失败，请稍后重试';
      case ErrorCode.VALIDATION_ERROR:
        return '输入数据验证失败，请检查输入内容';
      case ErrorCode.RECORD_NOT_FOUND:
        return '未找到相关数据';
      case ErrorCode.INSUFFICIENT_STOCK:
        return '库存不足';
      case ErrorCode.INVALID_ORDER_STATUS:
        return '订单状态无效';
      case ErrorCode.FILE_UPLOAD_ERROR:
        return '文件上传失败';
      case ErrorCode.INVALID_FILE_TYPE:
        return '文件类型不支持';
      case ErrorCode.FILE_SIZE_EXCEEDED:
        return '文件大小超出限制';
      default:
        return error.message || '发生未知错误，请稍后重试';
    }
  }

  // 处理API调用错误
  static async handleApiError(response: Response, context?: string): Promise<AppError> {
    let errorMessage = `API请求失败: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // 如果无法解析JSON响应，使用默认错误消息
    }

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).userMessage = this.getErrorMessage(error);

    return this.logError(error, context);
  }

  // 检查网络连接状态
  static isNetworkError(error: any): boolean {
    return error.code === ErrorCode.NETWORK_ERROR || 
           error.name === 'TypeError' || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('NetworkError');
  }

  // 检查是否为认证错误
  static isAuthError(error: any): boolean {
    return error.code === ErrorCode.AUTHENTICATION_ERROR || 
           error.status === 401;
  }

  // 检查是否为授权错误
  static isAuthorizationError(error: any): boolean {
    return error.code === ErrorCode.AUTHORIZATION_ERROR || 
           error.status === 403;
  }
}

// 错误重试工具
export class RetryHandler {
  static async retryAsync<T>(
    asyncFn: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error;
        
        // 如果是认证错误，不应重试
        if (ErrorHandler.isAuthError(error)) {
          throw error;
        }

        // 如果是网络错误，进行重试
        if (ErrorHandler.isNetworkError(error) && i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // 指数退避
        } else {
          break; // 非网络错误或达到最大重试次数，停止重试
        }
      }
    }

    throw lastError;
  }
}

// 全局错误事件处理
export const GlobalErrorHandler = {
  init() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise拒绝:', event.reason);
      ErrorHandler.logError(event.reason, 'Unhandled Promise Rejection');
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('全局JavaScript错误:', event.error);
      ErrorHandler.logError(event.error, 'Global JavaScript Error');
    });
  }
};
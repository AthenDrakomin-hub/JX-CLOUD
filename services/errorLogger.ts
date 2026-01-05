/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { AppError } from './errorHandler';

// 错误日志记录器
export class ErrorLogger {
  private static logs: AppError[] = [];
  private static readonly MAX_LOGS = 100; // 最大日志数量

  // 记录错误到本地存储
  static logError(error: AppError): void {
    // 添加到日志数组
    this.logs.push(error);
    
    // 限制日志数量
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
    
    // 保存到本地存储
    try {
      localStorage.setItem('jx_error_logs', JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to save error logs to localStorage:', e);
    }
  }

  // 获取错误日志
  static getLogs(): AppError[] {
    return [...this.logs];
  }

  // 清除错误日志
  static clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('jx_error_logs');
    } catch (e) {
      console.warn('Failed to clear error logs from localStorage:', e);
    }
  }

  // 从本地存储加载错误日志
  static loadLogs(): void {
    try {
      const storedLogs = localStorage.getItem('jx_error_logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        if (Array.isArray(parsedLogs)) {
          this.logs = parsedLogs;
        }
      }
    } catch (e) {
      console.warn('Failed to load error logs from localStorage:', e);
      this.logs = [];
    }
  }

  // 发送错误日志到服务器（用于生产环境）
  static async sendLogsToServer(): Promise<boolean> {
    try {
      const logs = this.getLogs();
      if (logs.length === 0) {
        return true; // 没有日志需要发送
      }

      // 在生产环境中，这里会发送日志到服务器
      // 为了安全起见，我们不会发送敏感信息
      const sanitizedLogs = logs.map(log => ({
        code: log.code,
        message: log.message,
        timestamp: log.timestamp,
        context: log.details?.context || undefined
      }));

      // 这里可以添加发送到服务器的逻辑
      // await fetch('/api/error-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(sanitizedLogs)
      // });

      console.log(`已准备发送 ${sanitizedLogs.length} 条错误日志到服务器`);
      return true;
    } catch (e) {
      console.error('发送错误日志到服务器失败:', e);
      return false;
    }
  }
}

// 初始化错误日志记录器
ErrorLogger.loadLogs();

// 导出错误日志相关的工具
// ErrorLogger 已经默认导出，不需要再次导出
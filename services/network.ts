/**
 * JX Cloud 酒店管理系统 - 网络和错误处理函数
 * 包含网络请求处理、错误处理、重试机制等功能
 */

// 网络错误类型定义
export enum NetworkErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 网络错误接口
export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  code?: number;
  originalError?: any;
  timestamp: Date;
}

// 请求配置接口
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
}

// 网络响应接口
export interface NetworkResponse<T = any> {
  success: boolean;
  data?: T;
  error?: NetworkError;
  retryCount?: number;
}

// 网络状态接口
export interface NetworkStatus {
  online: boolean;
  since?: Date;
  connectionType?: string;
  downlink?: number;
  effectiveType?: string;
}

/**
 * 检测网络连接状态
 */
export const getNetworkStatus = (): NetworkStatus => {
  if (typeof navigator !== 'undefined') {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      since: new Date(), // 这里应该记录实际连接变化时间
      connectionType: connection?.type,
      downlink: connection?.downlink,
      effectiveType: connection?.effectiveType
    };
  }
  
  return {
    online: true,
    since: new Date()
  };
};

/**
 * 检查网络是否可用
 */
export const isNetworkAvailable = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // 服务端环境默认认为网络可用
};

/**
 * 检查是否为网络错误
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  // 检查是否为常见的网络错误
  const networkErrorMessages = [
    'Network Error',
    'Failed to fetch',
    'NetworkError when attempting to fetch resource',
    'TypeError: Failed to fetch',
    'Load failed'
  ];
  
  const errorMessage = error.message || error.toString();
  
  return networkErrorMessages.some(msg => errorMessage.includes(msg)) || 
         error.type === 'network_error' ||
         error.status === 0; // 状态码为0通常表示网络错误
};

/**
 * 将错误转换为标准化的网络错误
 */
export const normalizeError = (error: any): NetworkError => {
  if (error instanceof Error) {
    // 检查是否为网络错误
    if (isNetworkError(error)) {
      return {
        type: NetworkErrorType.NETWORK_ERROR,
        message: error.message || '网络连接失败',
        originalError: error,
        timestamp: new Date()
      };
    }
    
    // 检查是否为超时错误
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return {
        type: NetworkErrorType.TIMEOUT_ERROR,
        message: error.message || '请求超时',
        originalError: error,
        timestamp: new Date()
      };
    }
    
    // 检查HTTP状态码
    if ('status' in error && typeof error.status === 'number') {
      if (error.status >= 500) {
        return {
          type: NetworkErrorType.SERVER_ERROR,
          message: error.message || `服务器错误 (${error.status})`,
          code: error.status,
          originalError: error,
          timestamp: new Date()
        };
      } else if (error.status >= 400) {
        return {
          type: NetworkErrorType.CLIENT_ERROR,
          message: error.message || `客户端错误 (${error.status})`,
          code: error.status,
          originalError: error,
          timestamp: new Date()
        };
      }
    }
  }
  
  // 默认返回未知错误
  return {
    type: NetworkErrorType.UNKNOWN_ERROR,
    message: error?.message || error?.toString() || '未知错误',
    originalError: error,
    timestamp: new Date()
  };
};

/**
 * 延迟函数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 带重试机制的异步操作
 */
export const retryAsync = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000,
  shouldRetry?: (error: any, attempt: number) => boolean
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 如果是最后一次尝试或不应该重试，则抛出错误
      if (attempt === retries || (shouldRetry && !shouldRetry(error, attempt))) {
        throw error;
      }
      
      // 等待指定时间后重试
      await delay(delayMs * Math.pow(2, attempt)); // 指数退避
    }
  }
  
  throw lastError;
};

/**
 * 带超时的Promise
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`请求超时 (${timeoutMs}ms)`));
      }, timeoutMs);
    }) as Promise<T>
  ]);
};

/**
 * 安全的API调用函数，包含错误处理和重试机制
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  config: RequestConfig = {}
): Promise<NetworkResponse<T>> => {
  const {
    timeout = 30000, // 默认30秒超时
    retries = 2,     // 默认重试2次
    retryDelay = 1000 // 默认重试间隔1秒
  } = config;
  
  let retryCount = 0;
  
  try {
    // 检查网络连接
    if (!isNetworkAvailable()) {
      return {
        success: false,
        error: {
          type: NetworkErrorType.NETWORK_ERROR,
          message: '网络连接不可用',
          timestamp: new Date()
        }
      };
    }
    
    // 执行带超时的API调用
    const result = await withTimeout(apiCall(), timeout);
    
    return {
      success: true,
      data: result,
      retryCount
    };
  } catch (error) {
    // 如果配置了重试且错误是网络错误，则进行重试
    if (retries > 0 && isNetworkError(error)) {
      try {
        const retryResult = await retryAsync(
          apiCall,
          retries,
          retryDelay,
          (err) => isNetworkError(err) // 只对网络错误进行重试
        );
        
        return {
          success: true,
          data: retryResult,
          retryCount: retries
        };
      } catch (retryError) {
        return {
          success: false,
          error: normalizeError(retryError)
        };
      }
    }
    
    return {
      success: false,
      error: normalizeError(error)
    };
  }
};

/**
 * Supabase错误处理函数
 */
export const handleSupabaseError = (error: any): NetworkError => {
  if (error) {
    // Supabase特定错误处理
    if (error.message?.includes('fetch')) {
      return {
        type: NetworkErrorType.NETWORK_ERROR,
        message: '无法连接到数据库服务',
        originalError: error,
        timestamp: new Date()
      };
    }
    
    if (error.code === '23505') { // 唯一约束违反
      return {
        type: NetworkErrorType.CLIENT_ERROR,
        message: '数据已存在',
        code: 409,
        originalError: error,
        timestamp: new Date()
      };
    }
    
    if (error.code === '23503') { // 外键约束违反
      return {
        type: NetworkErrorType.CLIENT_ERROR,
        message: '关联数据不存在',
        code: 400,
        originalError: error,
        timestamp: new Date()
      };
    }
    
    // 一般性Supabase错误
    return {
      type: NetworkErrorType.SERVER_ERROR,
      message: error.message || '数据库操作失败',
      code: error.code,
      originalError: error,
      timestamp: new Date()
    };
  }
  
  return {
    type: NetworkErrorType.UNKNOWN_ERROR,
    message: '未知错误',
    timestamp: new Date()
  };
};

/**
 * 网络连接监控
 */
export class NetworkMonitor {
  private online: boolean = true;
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private intervalId?: NodeJS.Timeout;
  
  constructor() {
    this.init();
  }
  
  private init() {
    if (typeof window !== 'undefined') {
      // 监听网络状态变化
      window.addEventListener('online', () => {
        this.online = true;
        this.notifyListeners();
      });
      
      window.addEventListener('offline', () => {
        this.online = false;
        this.notifyListeners();
      });
    }
  }
  
  public isOnline(): boolean {
    return this.online && navigator.onLine;
  }
  
  public addListener(callback: (status: NetworkStatus) => void): void {
    this.listeners.push(callback);
  }
  
  public removeListener(callback: (status: NetworkStatus) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
  
  public getStatus(): NetworkStatus {
    return {
      online: this.isOnline(),
      since: new Date()
    };
  }
  
  public startPeriodicCheck(interval: number = 5000): void {
    this.intervalId = setInterval(() => {
      const currentOnline = this.isOnline();
      if (currentOnline !== this.online) {
        this.online = currentOnline;
        this.notifyListeners();
      }
    }, interval);
  }
  
  public stopPeriodicCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

// 创建全局网络监控实例
export const networkMonitor = new NetworkMonitor();

/**
 * 网络请求统计
 */
export interface RequestStats {
  total: number;
  successful: number;
  failed: number;
  networkErrors: number;
  serverErrors: number;
  clientErrors: number;
  averageResponseTime: number;
  lastRequestTime: Date;
}

export class RequestTracker {
  private stats: RequestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    networkErrors: 0,
    serverErrors: 0,
    clientErrors: 0,
    averageResponseTime: 0,
    lastRequestTime: new Date(0)
  };
  
  private responseTimes: number[] = [];
  private readonly maxResponseTimes = 100; // 只保留最近100个响应时间
  
  public recordRequest(success: boolean, error?: NetworkError, responseTime?: number): void {
    this.stats.total++;
    this.stats.lastRequestTime = new Date();
    
    if (success) {
      this.stats.successful++;
      if (responseTime !== undefined) {
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > this.maxResponseTimes) {
          this.responseTimes.shift();
        }
        
        // 重新计算平均响应时间
        if (this.responseTimes.length > 0) {
          const sum = this.responseTimes.reduce((a, b) => a + b, 0);
          this.stats.averageResponseTime = sum / this.responseTimes.length;
        }
      }
    } else {
      this.stats.failed++;
      if (error) {
        switch (error.type) {
          case NetworkErrorType.NETWORK_ERROR:
          case NetworkErrorType.TIMEOUT_ERROR:
            this.stats.networkErrors++;
            break;
          case NetworkErrorType.SERVER_ERROR:
            this.stats.serverErrors++;
            break;
          case NetworkErrorType.CLIENT_ERROR:
            this.stats.clientErrors++;
            break;
        }
      }
    }
  }
  
  public getStats(): RequestStats {
    return { ...this.stats };
  }
  
  public reset(): void {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      networkErrors: 0,
      serverErrors: 0,
      clientErrors: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date(0)
    };
    this.responseTimes = [];
  }
}

// 创建全局请求跟踪实例
export const requestTracker = new RequestTracker();

/**
 * 显示网络错误通知
 */
export const showNetworkErrorNotification = (error: NetworkError): void => {
  console.error('Network Error:', error);
  
  // 在浏览器环境中显示通知
  if (typeof window !== 'undefined') {
    // 这里可以集成实际的通知系统
    const message = getErrorMessage(error);
    console.warn(`网络错误: ${message}`);
    
    // 如果支持浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('网络错误', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }
};

/**
 * 获取错误的用户友好消息
 */
export const getErrorMessage = (error: NetworkError): string => {
  switch (error.type) {
    case NetworkErrorType.CONNECTION_ERROR:
      return '无法连接到服务器，请检查网络连接';
    case NetworkErrorType.TIMEOUT_ERROR:
      return '请求超时，请稍后重试';
    case NetworkErrorType.SERVER_ERROR:
      return `服务器错误 (${error.code || '500'})，请稍后重试`;
    case NetworkErrorType.CLIENT_ERROR:
      return `请求错误 (${error.code || '400'})，请检查输入`;
    case NetworkErrorType.NETWORK_ERROR:
      return '网络连接失败，请检查网络设置';
    default:
      return error.message || '发生未知错误';
  }
};

/**
 * 离线数据缓存
 */
export class OfflineCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  public set(key: string, data: any, ttl: number = 300000): void { // 默认5分钟TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  public get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    return Date.now() - item.timestamp <= item.ttl;
  }
  
  public delete(key: string): void {
    this.cache.delete(key);
  }
  
  public clear(): void {
    this.cache.clear();
  }
  
  public cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 创建全局离线缓存实例
export const offlineCache = new OfflineCache();
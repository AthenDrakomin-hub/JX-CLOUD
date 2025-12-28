import React from 'react';

/**
 * JX Cloud 酒店管理系统 - 性能监控工具
 * 提供页面加载时间、API响应时间、组件渲染性能等监控功能
 */

export interface PerformanceMetrics {
  pageLoadTime?: number;
  apiResponseTime?: number;
  componentRenderTime?: number;
  memoryUsage?: number;
  fps?: number;
}

export interface PerformanceEvent {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

class PerformanceMonitor {
  private events: PerformanceEvent[] = [];
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private isMonitoring: boolean = false;
  
  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    this.isMonitoring = true;
    this.setupPerformanceObservers();
  }
  
  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.clearPerformanceObservers();
  }
  
  /**
   * 开始记录一个性能事件
   */
  startEvent(name: string, metadata?: Record<string, any>): string {
    const id = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const event: PerformanceEvent = {
      id,
      name,
      startTime: performance.now(),
      timestamp: Date.now(),
      metadata
    };
    
    this.events.push(event);
    return id;
  }
  
  /**
   * 结束记录一个性能事件
   */
  endEvent(id: string): PerformanceEvent | null {
    const eventIndex = this.events.findIndex(e => e.id === id);
    if (eventIndex === -1) return null;
    
    const event = this.events[eventIndex];
    event.endTime = performance.now();
    event.duration = event.endTime - event.startTime;
    
    // 如果性能指标超过阈值，触发警报
    if (event.duration > 1000) { // 超过1秒的事件
      this.triggerPerformanceAlert(event);
    }
    
    return event;
  }
  
  /**
   * 记录API响应时间
   */
  recordApiResponse(url: string, startTime: number, responseTime: number): void {
    const duration = responseTime - startTime;
    const event = this.startEvent('api-response', { url, duration });
    const perfEvent: PerformanceEvent = {
      id: event,
      name: 'api-response',
      startTime,
      endTime: responseTime,
      duration,
      metadata: { url, duration },
      timestamp: Date.now()
    };
    
    // 替换临时事件
    const index = this.events.findIndex(e => e.id === event);
    if (index !== -1) {
      this.events[index] = perfEvent;
    }
    
    // 如果API响应时间超过阈值，触发警报
    if (duration > 2000) { // 超过2秒的API响应
      this.triggerPerformanceAlert(perfEvent);
    }
  }
  
  /**
   * 获取性能指标摘要
   */
  getMetrics(): PerformanceMetrics {
    const recentEvents = this.events.filter(e => e.duration !== undefined);
    if (recentEvents.length === 0) return {};
    
    const durations = recentEvents.map(e => e.duration as number);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    // 获取内存使用情况（如果可用）
    let memoryUsage: number | undefined;
    if ((performance as any).memory) {
      memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
    
    return {
      apiResponseTime: avgDuration,
      memoryUsage
    };
  }
  
  /**
   * 订阅性能指标变化
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(callback);
    
    // 返回取消订阅函数
    return () => {
      this.observers.delete(callback);
    };
  }
  
  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    // 监听页面加载完成事件
    if (document.readyState === 'complete') {
      this.recordPageLoadTime();
    } else {
      window.addEventListener('load', () => {
        this.recordPageLoadTime();
      });
    }
    
    // 监听导航事件
    if ('navigation' in window) {
      (window as any).navigation.addEventListener('navigate', () => {
        // 重置性能事件列表
        this.events = [];
      });
    }
  }
  
  /**
   * 清除性能观察器
   */
  private clearPerformanceObservers(): void {
    // 目前不需要特殊清理
  }
  
  /**
   * 记录页面加载时间
   */
  private recordPageLoadTime(): void {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    const event = this.startEvent('page-load');
    
    const perfEvent: PerformanceEvent = {
      id: event,
      name: 'page-load',
      startTime: performance.timing.navigationStart,
      endTime: performance.timing.loadEventEnd,
      duration: loadTime,
      metadata: { loadTime },
      timestamp: Date.now()
    };
    
    // 替换临时事件
    const index = this.events.findIndex(e => e.id === event);
    if (index !== -1) {
      this.events[index] = perfEvent;
    }
    
    // 如果页面加载时间超过阈值，触发警报
    if (loadTime > 5000) { // 超过5秒的页面加载
      this.triggerPerformanceAlert(perfEvent);
    }
  }
  
  /**
   * 触发性能警报
   */
  private triggerPerformanceAlert(event: PerformanceEvent): void {
    console.warn(`Performance Alert: ${event.name} took ${event.duration}ms`, event);
    
    // 这里可以集成到错误监控系统或发送通知
    // 例如，可以记录到Sentry或发送到监控服务
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(
        `Performance Alert: ${event.name} took ${event.duration}ms`, 
        'warning'
      );
    }
  }
  
  /**
   * 获取最近的性能事件
   */
  getRecentEvents(limit: number = 50): PerformanceEvent[] {
    if (!this.events || !Array.isArray(this.events)) {
      return [];
    }
    return this.events
      .filter((e: any) => e && typeof e === 'object' && e.duration !== undefined)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 在开发模式下自动启动性能监控
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}

/**
 * 性能监控装饰器 - 用于监控函数执行时间
 */
export function performanceTrack(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    const event = performanceMonitor.startEvent(`${target.constructor.name}.${propertyKey}`);
    const result = originalMethod.apply(this, args);
    
    // 如果是同步函数
    if (result && typeof result.then === 'function') {
      // 如果是异步函数，监控Promise完成时间
      return result.then((res: any) => {
        performanceMonitor.endEvent(event);
        return res;
      }).catch((err: any) => {
        performanceMonitor.endEvent(event);
        throw err;
      });
    } else {
      performanceMonitor.endEvent(event);
      return result;
    }
  };
  
  return descriptor;
}

/**
 * 性能监控Hook - 用于React组件
 */
export function usePerformanceMonitor(componentName: string) {
  const componentStartEvent = performanceMonitor.startEvent(`component-render-${componentName}`);
  
  // 在组件卸载时记录渲染时间
  React.useEffect(() => {
    return () => {
      performanceMonitor.endEvent(componentStartEvent);
    };
  }, []);
}
// API缓存管理器
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // 设置缓存
  set(key: string, data: any, ttl: number = 30000) { // 默认30秒缓存
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  // 获取缓存
  get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    // 清除过期缓存
    this.cache.delete(key);
    return null;
  }
  
  // 清除特定缓存
  clear(key: string) {
    this.cache.delete(key);
  }
  
  // 清除所有缓存
  clearAll() {
    this.cache.clear();
  }
  
  // 清除过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCache();
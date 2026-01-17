// 连接池监控中间件 - 用于检测连接泄漏
// 江西云厨 v4.0.0-STATELESS

import { pool } from '../src/services/db.server.js';

class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private interval: NodeJS.Timeout | null = null;
  private lastStats: any = null;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  startMonitoring() {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.checkConnectionLeaks();
    }, 30000); // 每30秒检查一次

    // 立即执行一次检查
    setTimeout(() => this.checkConnectionLeaks(), 5000);
  }

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkConnectionLeaks() {
    try {
      if (!pool) return;

      const stats = await pool.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      const currentStats = {
        total: parseInt(stats.rows[0].total),
        active: parseInt(stats.rows[0].active),
        idle: parseInt(stats.rows[0].idle),
        timestamp: new Date().toISOString()
      };

      // 检查连接数是否异常增长
      if (this.lastStats) {
        const totalDiff = currentStats.total - this.lastStats.total;
        const activeDiff = currentStats.active - this.lastStats.active;
        
        if (totalDiff > 2 || currentStats.total > 8) { // 超过8个连接警戒线
          console.warn('🚨 连接数异常增长警告:', {
            current: currentStats,
            previous: this.lastStats,
            diff: { total: totalDiff, active: activeDiff }
          });
          
          // 如果连接数过多，主动清理空闲连接
          if (currentStats.total > 9) {
            console.log('🔧 主动清理空闲连接...');
            await this.cleanupIdleConnections();
          }
        }
      }

      this.lastStats = currentStats;
      
      // 正常日志
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 连接池状态:', currentStats);
      }

    } catch (error) {
      console.error('❌ 连接监控失败:', error);
    }
  }

  private async cleanupIdleConnections() {
    try {
      const result = await pool.query(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE state = 'idle' 
        AND backend_start < NOW() - INTERVAL '2 minutes'
        AND pid <> pg_backend_pid()
      `);
      
      console.log(`✅ 清理了 ${result.rowCount} 个空闲连接`);
    } catch (error) {
      console.error('❌ 清理空闲连接失败:', error);
    }
  }

  getStats() {
    return this.lastStats;
  }
}

// 在服务启动时自动初始化监控
const monitor = ConnectionMonitor.getInstance();

export { ConnectionMonitor, monitor };
// 连接池监控和优化脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

class ConnectionPoolMonitor {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5, // 限制最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
    
    this.maxConnections = 5;
    this.warningThreshold = 3;
  }
  
  async checkConnectionHealth() {
    try {
      console.log('🏥 执行连接池健康检查...');
      
      // 1. 基础连接测试
      const heartbeat = await this.pool.query('SELECT 1 as heartbeat');
      console.log('✅ 心跳测试:', heartbeat.rows[0]);
      
      // 2. 连接统计
      const stats = await this.pool.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      const connectionStats = {
        total: parseInt(stats.rows[0].total),
        active: parseInt(stats.rows[0].active),
        idle: parseInt(stats.rows[0].idle)
      };
      
      console.log('📊 连接统计:', connectionStats);
      
      // 3. 连接池状态评估
      this.evaluateConnectionStatus(connectionStats);
      
      return {
        healthy: true,
        heartbeat: heartbeat.rows[0].heartbeat,
        stats: connectionStats
      };
      
    } catch (error) {
      console.error('❌ 连接池健康检查失败:', error.message);
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  evaluateConnectionStatus(stats) {
    console.log('\n🔍 连接池状态评估:');
    
    if (stats.total >= this.maxConnections) {
      console.log('🔴 警告: 达到最大连接限制!');
      console.log(`   当前: ${stats.total}/${this.maxConnections}`);
    } else if (stats.total >= this.warningThreshold) {
      console.log('🟡 注意: 连接数接近限制');
      console.log(`   当前: ${stats.total}/${this.maxConnections}`);
    } else {
      console.log('🟢 正常: 连接数在安全范围内');
      console.log(`   当前: ${stats.total}/${this.maxConnections}`);
    }
    
    if (stats.active > stats.idle) {
      console.log('🟡 注意: 活跃连接比例较高');
    }
  }
  
  async optimizeConnections() {
    try {
      console.log('\n⚙️  执行连接优化...');
      
      // 清理长时间空闲的连接
      const cleanupResult = await this.pool.query(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE state = 'idle' 
        AND backend_start < NOW() - INTERVAL '1 hour'
        AND pid <> pg_backend_pid()
      `);
      
      console.log(`✅ 清理了 ${cleanupResult.rowCount} 个过期连接`);
      
      // 重置连接池
      await this.pool.query('SELECT 1'); // 确保至少有一个活动连接
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ 连接优化失败:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  async close() {
    await this.pool.end();
  }
}

// 执行监控
async function runMonitoring() {
  const monitor = new ConnectionPoolMonitor();
  
  try {
    console.log('🚀 启动连接池监控...\n');
    
    // 1. 健康检查
    const health = await monitor.checkConnectionHealth();
    
    // 2. 如果需要，执行优化
    if (!health.healthy || health.stats?.total >= 3) {
      console.log('\n🔧 执行连接优化...');
      await monitor.optimizeConnections();
      
      // 再次检查
      console.log('\n🔄 重新检查优化效果...');
      await monitor.checkConnectionHealth();
    }
    
    console.log('\n✅ 监控完成');
    
  } catch (error) {
    console.error('❌ 监控过程中出错:', error.message);
  } finally {
    await monitor.close();
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitoring();
}

export { ConnectionPoolMonitor };
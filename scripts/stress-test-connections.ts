// 连接泄漏压力测试脚本
// 模拟高并发请求来检测连接管理是否正确

process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function stressTestConnections() {
  console.log('💣 开始连接泄漏压力测试...\n');
  
  const testConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 3000
  };
  
  const pool = new Pool(testConfig);
  
  // 监控连接状态
  let connectionStats = { total: 0, active: 0, idle: 0 };
  
  const monitorInterval = setInterval(async () => {
    try {
      const stats = await pool.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      connectionStats = {
        total: parseInt(stats.rows[0].total),
        active: parseInt(stats.rows[0].active),
        idle: parseInt(stats.rows[0].idle)
      };
      
      console.log(`📊 当前连接: 总计${connectionStats.total}, 活跃${connectionStats.active}, 空闲${connectionStats.idle}`);
      
      // 警告阈值
      if (connectionStats.total > 12) {
        console.warn('🚨 连接数超标! 可能存在泄漏');
      }
      
    } catch (error) {
      console.error('监控查询失败:', error.message);
    }
  }, 2000);
  
  // 执行压力测试
  const testPromises = [];
  const testCount = 50; // 50个并发请求
  
  console.log(`🚀 发起 ${testCount} 个并发数据库请求...`);
  
  for (let i = 0; i < testCount; i++) {
    const promise = pool.query('SELECT pg_sleep(0.1), 1 as test_id')
      .then(result => {
        console.log(`✅ 请求 ${i + 1} 完成`);
        return result;
      })
      .catch(error => {
        console.error(`❌ 请求 ${i + 1} 失败:`, error.message);
        throw error;
      });
    
    testPromises.push(promise);
  }
  
  try {
    // 等待所有请求完成
    await Promise.all(testPromises);
    console.log('\n✅ 所有请求完成');
    
  } catch (error) {
    console.error('\n❌ 压力测试过程中出现错误:', error.message);
  } finally {
    // 清理
    clearInterval(monitorInterval);
    
    // 等待一段时间观察连接回收情况
    console.log('\n⏳ 等待连接回收...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // 最终状态检查
    try {
      const finalStats = await pool.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      const finalConnectionStats = {
        total: parseInt(finalStats.rows[0].total),
        active: parseInt(finalStats.rows[0].active),
        idle: parseInt(finalStats.rows[0].idle)
      };
      
      console.log('\n🏁 最终连接状态:');
      console.log(`  总计: ${finalConnectionStats.total}`);
      console.log(`  活跃: ${finalConnectionStats.active}`);
      console.log(`  空闲: ${finalConnectionStats.idle}`);
      
      // 评估结果
      if (finalConnectionStats.total <= 3) {
        console.log('✅ 连接管理良好，无泄漏');
      } else if (finalConnectionStats.total <= 6) {
        console.log('⚠️ 连接回收较慢，但可接受');
      } else {
        console.log('❌ 存在明显的连接泄漏问题');
      }
      
    } catch (error) {
      console.error('最终检查失败:', error.message);
    }
    
    // 关闭连接池
    await pool.end();
    console.log('🔌 连接池已关闭');
  }
}

stressTestConnections();
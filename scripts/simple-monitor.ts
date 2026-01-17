// 简化的连接监控脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function simpleMonitor() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5
  });
  
  try {
    console.log('🏥 简化连接监控开始...\n');
    
    // 心跳测试
    const heartbeat = await pool.query('SELECT 1 as test');
    console.log('✅ 心跳测试通过:', heartbeat.rows[0]);
    
    // 连接统计
    const stats = await pool.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    const s = stats.rows[0];
    console.log('📊 连接统计:');
    console.log(`   总连接: ${s.total}`);
    console.log(`   活跃连接: ${s.active}`);
    console.log(`   空闲连接: ${s.idle}`);
    
    // 状态评估
    if (parseInt(s.total) >= 5) {
      console.log('🔴 连接数已达上限!');
    } else if (parseInt(s.total) >= 3) {
      console.log('🟡 连接数偏高');
    } else {
      console.log('🟢 连接数正常');
    }
    
    console.log('\n✅ 监控完成');
    
  } catch (error) {
    console.error('❌ 监控失败:', error.message);
  } finally {
    await pool.end();
  }
}

simpleMonitor();
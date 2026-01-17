// 连接池使用情况诊断脚本
process.env.DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require";

import { Pool } from 'pg';

async function diagnoseConnectionUsage() {
  console.log('🔍 诊断连接池使用情况...\n');
  
  // 使用单一连接池进行诊断
  const diagnosticPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2, // 诊断用小连接池
    idleTimeoutMillis: 5000
  });
  
  try {
    // 1. 检查当前所有连接
    console.log('1️⃣ 检查当前数据库连接:');
    const allConnections = await diagnosticPool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        backend_start,
        state,
        query
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND state IS NOT NULL
      ORDER BY backend_start DESC
    `);
    
    console.log(`📊 当前活跃连接数: ${allConnections.rows.length}`);
    allConnections.rows.forEach((conn, index) => {
      console.log(`  ${index + 1}. PID:${conn.pid} State:${conn.state} App:${conn.application_name || 'unknown'}`);
    });
    
    // 2. 检查连接来源
    console.log('\n2️⃣ 分析连接来源:');
    const connectionSources = await diagnosticPool.query(`
      SELECT 
        application_name,
        count(*) as connection_count,
        string_agg(pid::text, ', ') as pids
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND state IS NOT NULL
      GROUP BY application_name
      ORDER BY connection_count DESC
    `);
    
    connectionSources.rows.forEach(source => {
      console.log(`  ${source.application_name || 'unknown'}: ${source.connection_count} 连接 (PIDs: ${source.pids})`);
    });
    
    // 3. 检查长时间运行的查询
    console.log('\n3️⃣ 检查长时间运行的查询:');
    const longQueries = await diagnosticPool.query(`
      SELECT 
        pid,
        now() - query_start as duration,
        state,
        query
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND state = 'active'
      AND now() - query_start > interval '1 second'
      ORDER BY query_start
    `);
    
    if (longQueries.rows.length > 0) {
      console.log('⚠️ 发现长时间运行的查询:');
      longQueries.rows.forEach(query => {
        console.log(`  PID ${query.pid}: ${query.duration} - ${query.query.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ 无长时间运行的查询');
    }
    
    // 4. 检查空闲连接
    console.log('\n4️⃣ 检查空闲连接:');
    const idleConnections = await diagnosticPool.query(`
      SELECT 
        pid,
        now() - state_change as idle_duration,
        application_name
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND state = 'idle'
      AND now() - state_change > interval '30 seconds'
      ORDER BY state_change
    `);
    
    if (idleConnections.rows.length > 0) {
      console.log(`⚠️ 发现 ${idleConnections.rows.length} 个长时间空闲连接:`);
      idleConnections.rows.forEach(conn => {
        console.log(`  PID ${conn.pid}: 空闲 ${conn.idle_duration} (应用: ${conn.application_name || 'unknown'})`);
      });
    } else {
      console.log('✅ 无异常空闲连接');
    }
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  } finally {
    await diagnosticPool.end();
  }
}

diagnoseConnectionUsage();
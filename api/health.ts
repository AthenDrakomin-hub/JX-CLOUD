// 江西云厨 - 无状态健康检查API (v4.0.0-STATELESS)
// 完全无状态，使用共享连接池，执行完立即归还连接

import { db } from '../src/services/db.server.js';
import { systemConfig, orders } from '../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const startTime = Date.now();
  
  let dbConnected = false;
  let dbResponse = null;
  let connectionStats = null;
  let errorMessage = null;

  try {
    // 1. 使用共享db实例执行心跳检查（无状态）
    console.log('🏥 执行无状态数据库心跳检查...');
    dbResponse = await db.execute(sql`SELECT 1 as heartbeat`);
    
    if (dbResponse.rows[0].heartbeat === 1) {
      dbConnected = true;
      console.log('✅ 数据库心跳正常');
    }
    
    // 2. 获取系统配置（使用ORM，自动管理连接）
    const configResult = await db.select().from(systemConfig).where(eq(systemConfig.id, 'global')).limit(1);
    
    // 3. 获取订单统计（使用ORM，自动管理连接）
    const orderCountResult = await db.select({ count: sql`COUNT(*)` }).from(orders);
    
    // 4. 获取连接统计信息（使用单独的查询）
    try {
      const statsResult = await db.execute(sql`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      connectionStats = {
        total: parseInt(String(statsResult.rows[0]?.total_connections || '0')),
        active: parseInt(String(statsResult.rows[0]?.active_connections || '0')),
        idle: parseInt(String(statsResult.rows[0]?.idle_connections || '0'))
      };
      
      console.log('📊 连接统计:', connectionStats);
    } catch (statsError) {
      console.warn('⚠️ 无法获取连接统计:', statsError.message);
    }
    
    // 连接自动归还给池，无需手动处理
    
  } catch (error: any) {
    errorMessage = error.message;
    console.error('❌ 数据库连接失败:', error.message);
  }

  // 构建响应数据
  const responseData = {
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'JX Cloud Enterprise Hospitality Suite',
    version: '4.0.0-STATELESS', // 新版本标识
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
    db_connected: dbConnected,
    db_heartbeat: dbResponse?.rows[0]?.heartbeat || null,
    connection_stats: connectionStats,
    system_info: {
      hotel_name: configResult?.[0]?.hotelName || 'Unknown',
      active_orders: parseInt(String(orderCountResult?.[0]?.count || '0'))
    },
    error: errorMessage
  };

  // 根据健康状态设置HTTP状态码
  const httpStatus = dbConnected ? 200 : 503;

  return new Response(
    JSON.stringify(responseData),
    {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Version': '4.0.0-STATELESS'
      },
    }
  );
}
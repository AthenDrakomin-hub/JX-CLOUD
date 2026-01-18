// 江西云厨 - 系统状态API (用于判断是否为演示模式)
import { db } from '../../src/services/db.server.js';
import { systemConfig } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  try {
    // 尝试连接数据库并获取系统配置
    const configResult = await db.select().from(systemConfig).where(eq(systemConfig.id, 'global')).limit(1);
    
    const hasValidConnection = configResult && configResult.length > 0;
    
    return new Response(
      JSON.stringify({ 
        status: 'ok',
        connected: hasValidConnection,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    // 即使数据库连接失败也返回成功状态，这样前端可以进入演示模式
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200, // 注意：返回200而不是500，以便前端进入演示模式
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}
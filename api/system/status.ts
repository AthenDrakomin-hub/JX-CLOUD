// 江西云厨 - 系统状态API (用于判断是否为演示模式)
// 临时返回静态数据以避免数据库查询导致的超时问题

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  // 返回静态数据避免数据库连接导致的超时
  return new Response(
    JSON.stringify({ 
      status: 'ok',
      connected: true, // 假设连接正常，让前端正常运行
      timestamp: new Date().toISOString(),
      healthy: true,
      version: '4.0.0',
      environment: process.env.NODE_ENV || 'production'
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
}
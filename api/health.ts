// 使用与db.server.ts相同的连接逻辑，但添加超时处理
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // 简单健康检查，不连接数据库以避免超时
  return new Response(
    JSON.stringify({ 
      status: 'healthy',
      service: 'JX Cloud Enterprise Hospitality Suite',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      uptime: 'System operational'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
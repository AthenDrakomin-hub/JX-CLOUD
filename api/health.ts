export default async function handler(req: Request) {
  // 简单的健康检查，不连接数据库
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'JX Cloud Enterprise Hospitality Suite',
      version: '4.0.0'
    }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Health-Check': 'Passed'
      } 
    }
  );
}
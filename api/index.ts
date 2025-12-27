
/**
 * 江西酒店管理 - 统一 API 网关 (Vercel Edge Runtime)
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  // 支持 /api/test 或 /api/index 等多种路径访问
  const path = url.pathname.replace(/^\/api/, '');
  const method = req.method;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, max-age=0', // API 接口不建议缓存
    'X-JX-Cloud-Version': '3.1.0-prod'
  };

  // 处理跨域预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 健康检查及测试接口
    if (path === '/health' || path === '/test-connection' || path === '' || path === '/') {
      return new Response(JSON.stringify({ 
        status: 'healthy',
        service: 'JX Cloud Gateway',
        timestamp: new Date().toISOString(),
        node: 'Edge-Global'
      }), { status: 200, headers });
    }

    // 默认回执
    return new Response(JSON.stringify({ 
      success: true,
      message: "Edge API 节点已触达。",
      path,
      method,
      note: "API 网关目前处于安全中继模式。"
    }), { status: 200, headers });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: '网关内部异常',
      message: error.message 
    }), { 
      status: 500, 
      headers 
    });
  }
}

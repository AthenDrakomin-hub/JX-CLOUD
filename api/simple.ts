// 极简API测试 - 不依赖任何外部服务
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      message: 'API function working',
      timestamp: new Date().toISOString()
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
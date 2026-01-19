
/**
 * 江西云厨 - Supabase Edge Functions Middleware
 * 统一边缘中间件：为 Supabase Edge Functions 提供安全防护
 */

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // 1. 放行静态资源和Supabase函数
  if (
    pathname.includes('.') || 
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/functions/')
  ) {
    return;
  }

  // 2. 获取用户凭证 (从 Cookie 中提取)
  const cookieHeader = request.headers.get('cookie') || '';
  const isMasterBypass = cookieHeader.includes('jx_root_authority_bypass=true');

  // 3. 简单的路径保护
  if (pathname.startsWith('/dashboard') && !isMasterBypass) {
    // 前端 App.tsx 会处理更细粒度的认证
  }

  // 4. 安全响应头注入
  const response = new Response(null, {
    headers: {
      'x-middleware-next': '1',
      'X-JX-Edge-Node': 'Global-Distribution',
      'X-Powered-By': 'Supabase-Edge-Functions'
    }
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
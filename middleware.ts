/**
 * 江西云厨 - Vercel Edge Middleware
 * 极简版中间件：完全纯净，不引用任何数据库相关模块
 */

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // 放行静态资源
  if (
    pathname.includes('.') || 
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots')
  ) {
    return;
  }

  // 检查 Better Auth 会话令牌
  const cookieHeader = request.headers.get('cookie') || '';
  const hasSessionToken = cookieHeader.includes('better-auth.session-token');
  const isMasterBypass = cookieHeader.includes('jx_root_authority_bypass=true');

  // 极简权限检查
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/users')) {
    if (!hasSessionToken && !isMasterBypass) {
      // 重定向到根路径，App.tsx会渲染AuthPage组件
      return Response.redirect(new URL('/', request.url));
    }
  }

  // 返回基础响应
  return new Response(null, {
    headers: {
      'x-middleware-next': '1',
      'X-JX-Edge-Node': 'South-China-Alpha'
    }
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|public).*)'],
};
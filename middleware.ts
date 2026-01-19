
/**
 * 江西云厨 - Vercel Edge Middleware
 * 纯净版中间件：不依赖 Next.js 框架，直接运行于 Vercel 边缘节点
 */

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // 1. 放行静态资源
  if (
    pathname.includes('.') || 
    pathname.startsWith('/assets/')
  ) {
    return;
  }

  // 2. 获取用户凭证 (从 Cookie 中提取)
  // 提示：此处逻辑应与 App.tsx 的根权限旁路保持一致，或校验 Better-Auth 令牌
  const cookieHeader = request.headers.get('cookie') || '';
  const isMasterBypass = cookieHeader.includes('jx_root_authority_bypass=true');

  // 3. 简单的路径保护
  // 如果访问管理后台路径且没有旁路标记
  if (pathname.startsWith('/dashboard') && !isMasterBypass) {
    // 逻辑：在生产环境下，如果未检测到有效会话，重定向至登录页
    // 此处仅做逻辑占位，前端 App.tsx 会处理更细粒度的认证
  }

  // 4. API 安全响应头注入
  const response = new Response(null, {
    headers: {
      'x-middleware-next': '1',
      'X-JX-Edge-Node': 'South-China-Alpha'
    }
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

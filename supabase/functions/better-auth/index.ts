// Supabase Edge Functions - Better Auth 认证路由 (独立版本)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { betterAuth } from 'https://esm.sh/better-auth@1.0.22';

// 配置Better Auth - 使用连接字符串而非直接的Drizzle实例
const auth = betterAuth({
  secret: Deno.env.get('BETTER_AUTH_SECRET') || (() => {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
  })(),
  baseURL: Deno.env.get('BETTER_AUTH_URL') || `https://${Deno.env.get('SUPABASE_PROJECT_REF')}.supabase.co/functions/v1/better-auth`,
  database: {
    provider: "postgresql",
    url: Deno.env.get('DATABASE_URL') || '',
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {},
  advanced: {
    useSecureCookies: true,
    crossOrigin: true
  }
});

// 导出处理函数
export const handler = async (req: Request): Promise<Response> => {
  // 处理认证请求
  const response = await auth.handler(req);
  
  // 添加CORS头部
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    headers
  });
};

// 兼容Deno serve
if (import.meta.main) {
  serve(handler);
}
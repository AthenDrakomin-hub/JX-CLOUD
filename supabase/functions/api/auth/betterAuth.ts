// Supabase Edge Functions - Better Auth 认证路由
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { betterAuth } from 'https://esm.sh/better-auth@1.4.15/supabase';
import { drizzle } from 'https://esm.sh/drizzle-orm@0.45.1/supabase';
import * as schema from '../../../drizzle/schema.js';

// 获取环境变量
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化Drizzle ORM
const db = drizzle(supabase, { schema });

// 配置Better Auth
const auth = betterAuth({
  secret: Deno.env.get('BETTER_AUTH_SECRET')!,
  url: Deno.env.get('BETTER_AUTH_URL')!,
  database: {
    connection: db,
    tables: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      passkey: schema.passkey,
    }
  },
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
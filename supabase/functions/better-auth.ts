// Supabase Edge Functions - Better-Auth 集成
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { betterAuth } from 'https://esm.sh/better-auth@1.4.15/supabase';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { drizzle } from 'https://esm.sh/drizzle-orm@0.45.1/supabase';
import * as schema from '../drizzle/schema.js';

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
  url: Deno.env.get('BETTER_AUTH_URL') || 'https://www.jiangxijiudian.store',
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
  emailAndPassword: {
    enabled: false, // 仅启用Passkey认证
  },
  advanced: {
    useSecureCookies: true,
    crossOrigin: true
  }
});

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // CORS 头部
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Auth-Service': 'jx-cloud-better-auth'
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 将请求代理到Better-Auth处理程序
    const response = await auth.handler(req);
    
    // 合并CORS头部
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      headers
    });

  } catch (error) {
    console.error('Better-Auth error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      service: 'jx-cloud-better-auth'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

if (import.meta.main) {
  serve(handler);
}
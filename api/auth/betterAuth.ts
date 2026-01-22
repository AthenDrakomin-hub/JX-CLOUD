// Vercel API Route - Better Auth 认证路由
import { createClient } from '@supabase/supabase-js';
import { betterAuth } from 'better-auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../schema';

// 获取环境变量
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化PostgreSQL连接和Drizzle ORM (用于BetterAuth)
const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

// 配置Better Auth
const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || `${process.env.VERCEL_URL ? 'https://' : 'http://'}${process.env.VERCEL_URL || 'localhost:3000'}`,
  database: {
    connection: db,
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      passkey: schema.passkey,
    }
  },
  advanced: {
    useSecureCookies: false, // 在 serverless 环境中设为 false
    crossOrigin: true
  }
});

// Vercel API Route 处理函数
export default async function handler(req: any, res: any) {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method; // 从 req 对象获取方法，而不是 URL 对象

    // 将 Next.js 请求转换为 fetch Request 对象
    const request = new Request(url, {
      method: method,
      headers: new Headers(req.headers as any),
      body: req.body ? JSON.stringify(req.body) : undefined
    });

    // 处理认证请求
    const response = await auth.handler(request);
    
    // 将 fetch Response 转换为 Next.js 响应
    const responseHeaders = Object.fromEntries(response.headers.entries());
    res.writeHead(response.status, responseHeaders);
    
    const responseBody = await response.text();
    res.end(responseBody);
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
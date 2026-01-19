
import { createClient } from '@supabase/supabase-js';
import { auth } from '../services/auth-server.js';

/**
 * 江西云厨 - 统一全栈 API 网关
 * 整合所有 API 路由以适配 Vercel Free Plan
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Engine': 'Unified-V2'
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  // 1. 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. 路由分发 (单一入口管理)
  
  // A. 原生认证流 (WebAuthn / Better-Auth)
  if (path.startsWith('/api/auth')) {
    const response = await auth.handler(req);
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(response.body, { status: response.status, headers: newHeaders });
  }

  // B. 数据库状态检查与健康诊断
  if (path === '/api/db-check' || path === '/api/health') {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      
      if (!supabaseUrl) throw new Error("Environment Not Ready");

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { count, error } = await supabase.from('user').select('*', { count: 'exact', head: true });
      
      if (error) throw error;

      return new Response(JSON.stringify({
        status: 'online',
        diagnostics: { rls: 'active', registry: count, region: process.env.VERCEL_REGION || 'edge' }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ status: 'error', message: e.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }

  // 3. 拦截未定义的 API 请求
  return new Response(JSON.stringify({ error: "API Node Not Found" }), { 
    status: 404, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}
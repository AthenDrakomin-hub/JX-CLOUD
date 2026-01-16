
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  const start = Date.now();
  
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 测试基础连接与延迟 (PostgreSQL 系统表)
    const { data: connTest, error: connError } = await supabase
      .from('pg_stat_activity')
      .select('state')
      .limit(1);

    const connectTime = Date.now() - start;
    if (connError) throw connError;

    // 2. 测试业务表读取正确性 (users 表)
    const { count, error: tableError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (tableError) throw tableError;

    const totalTime = Date.now() - start;

    return new Response(
      JSON.stringify({
        status: 'online',
        timestamp: new Date().toISOString(),
        metrics: {
          connect_ms: connectTime,
          query_ms: totalTime - connectTime,
          total_ms: totalTime,
        },
        diagnostics: {
          database_state: connTest?.[0]?.state || 'active',
          user_registry_count: count,
          edge_node: process.env.VERCEL_REGION || 'unknown',
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-JX-Diagnostic': 'Passed'
        } 
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        code: error.code || 'CONNECTION_FAILURE',
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}

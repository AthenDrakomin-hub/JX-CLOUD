// Supabase Edge Functions - 翻译服务API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', '');
  const method = req.method;

  // CORS配置
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Translation-Service': 'jx-cloud-i18n-edge'
  };

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 获取Supabase客户端
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 获取翻译资源包 - GET /api/translations/:lang
    if (path.startsWith('/api/translations/') && method === 'GET') {
      const lang = path.split('/')[3]; // /api/translations/zh -> zh
      const namespace = url.searchParams.get('namespace') || 'common';
      
      if (!lang) {
        return new Response(JSON.stringify({ 
          error: 'Language parameter is required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        // 查询指定语言和命名空间的活跃翻译
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language', lang)
          .eq('namespace', namespace)
          .eq('is_active', true);

        if (error) throw error;

        // 转换为键值对格式
        const translations = data.reduce((acc: Record<string, string>, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        return new Response(JSON.stringify({
          namespace,
          language: lang,
          translations,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // 5分钟缓存
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch translations',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 获取增量更新 - GET /api/translations/:lang/incremental
    if (path.match(/\/api\/translations\/[^\/]+\/incremental/) && method === 'GET') {
      const lang = path.split('/')[3]; // /api/translations/zh/incremental -> zh
      const lastUpdate = url.searchParams.get('lastUpdate') || '0';
      const namespace = url.searchParams.get('namespace') || 'common';
      
      try {
        // 查询自上次更新以来的变化
        const { data, error } = await supabase
          .from('translations')
          .select('key, value, updated_at')
          .eq('language', lang)
          .eq('namespace', namespace)
          .eq('is_active', true)
          .gt('updated_at', new Date(parseInt(lastUpdate)).toISOString());

        if (error) throw error;

        const translations = data.reduce((acc: Record<string, string>, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        return new Response(JSON.stringify({
          namespace,
          language: lang,
          translations,
          lastUpdate: Date.now().toString(),
          updatedCount: data.length
        }), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch incremental updates',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 管理员更新翻译 - POST /api/translations/admin
    if (path === '/api/translations/admin' && method === 'POST') {
      // 注意：这里需要实现管理员身份验证
      // 在实际部署中，需要验证JWT token或API密钥
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ 
          error: 'Authorization required' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const { translations, language, namespace = 'common' } = await req.json();

        if (!Array.isArray(translations) || !language) {
          return new Response(JSON.stringify({ 
            error: 'Invalid request format. Expected: { translations: [], language: string, namespace?: string }' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 批量插入/更新翻译
        const upsertData = translations.map((t: any) => ({
          key: t.key,
          language,
          value: t.value,
          namespace,
          context: t.context || null,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('translations')
          .upsert(upsertData, { onConflict: ['namespace', 'key', 'language'] });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          updatedCount: upsertData.length
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to update translations',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 404
    return new Response(JSON.stringify({ 
      error: 'Translation API route not found',
      path: path,
      service: 'jx-cloud-i18n-edge'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-i18n-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// 兼容Deno serve
if (import.meta.main) {
  serve(handler);
}
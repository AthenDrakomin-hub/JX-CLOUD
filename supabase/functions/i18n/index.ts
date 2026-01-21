// Supabase Edge Functions - 国际化服务
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', '');
  const method = req.method;

  // CORS头部
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-I18n-Service': 'jx-cloud-i18n-service'
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
    // 获取翻译
    if (path.startsWith('/i18n') && method === 'GET') {
      const searchParams = url.searchParams;
      const lang = searchParams.get('lang') || 'zh';
      const key = searchParams.get('key') || '';
      
      if (key) {
        // 获取特定键的翻译
        const { data, error } = await supabase
          .from('translations')
          .select('value')
          .eq('key', key)
          .eq('language', lang)
          .single();

        if (error) {
          return new Response(JSON.stringify({
            key: key,
            value: key, // 返回键本身作为后备值
            language: lang,
            service: 'jx-cloud-i18n-service'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          key: key,
          value: data.value,
          language: lang,
          service: 'jx-cloud-i18n-service'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // 获取所有翻译
        const { data, error } = await supabase
          .from('translations')
          .select('*')
          .eq('language', lang)
          .eq('is_active', true);

        if (error) {
          return new Response(JSON.stringify({
            error: 'Failed to fetch translations',
            service: 'jx-cloud-i18n-service'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 转换为键值对格式
        const translations = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        return new Response(JSON.stringify(translations), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 健康检查
    if (path === '/i18n/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy',
        service: 'jx-cloud-i18n-service',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 404
    return new Response(JSON.stringify({ 
      error: 'I18n route not found',
      path: path,
      service: 'jx-cloud-i18n-service'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-i18n-service'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

if (import.meta.main) {
  serve(handler);
}
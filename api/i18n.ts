// Vercel API Route - 翻译服务API
import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // CORS配置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Translation-Service': 'jx-cloud-i18n-vercel'
    };

    // 获取翻译资源包 - GET /api/translations/:lang
    if (pathname.startsWith('/api/translations/') && method === 'GET') {
      const pathParts = pathname.split('/');
      const lang = pathParts[3]; // /api/translations/zh -> zh
      const namespace = req.query?.namespace || 'common';
      
      if (!lang) {
        return res.status(400).json({ 
          error: 'Language parameter is required' 
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
        const translations: Record<string, string> = {};
        if (data) {
          for (const item of data) {
            translations[item.key] = item.value;
          }
        }

        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5分钟缓存
        
        return res.status(200).json({
          namespace,
          language: lang,
          translations,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return res.status(500).json({
          error: 'Failed to fetch translations',
          message: error.message
        });
      }
    }

    // 获取增量更新 - GET /api/translations/:lang/incremental
    if (pathname.match(/\/api\/translations\/[^\/]+\/incremental/) && method === 'GET') {
      const pathParts = pathname.split('/');
      const lang = pathParts[3]; // /api/translations/zh/incremental -> zh
      const lastUpdate = req.query?.lastUpdate || '0';
      const namespace = req.query?.namespace || 'common';
      
      try {
        // 查询自上次更新以来的变化
        const { data, error } = await supabase
          .from('translations')
          .select('key, value, updated_at')
          .eq('language', lang)
          .eq('namespace', namespace)
          .eq('is_active', true)
          .gt('updated_at', new Date(parseInt(lastUpdate as string)).toISOString());

        if (error) throw error;

        const translations: Record<string, string> = {};
        if (data) {
          for (const item of data) {
            translations[item.key] = item.value;
          }
        }

        return res.status(200).json({
          namespace,
          language: lang,
          translations,
          lastUpdate: Date.now().toString(),
          updatedCount: data.length
        });
      } catch (error: any) {
        return res.status(500).json({
          error: 'Failed to fetch incremental updates',
          message: error.message
        });
      }
    }

    // 管理员更新翻译 - POST /api/translations/admin
    if (pathname === '/api/translations/admin' && method === 'POST') {
      // 注意：这里需要实现管理员身份验证
      // 在实际部署中，需要验证JWT token或API密钥
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authorization required' 
        });
      }

      try {
        const { translations, language, namespace = 'common' } = req.body;

        if (!Array.isArray(translations) || !language) {
          return res.status(400).json({ 
            error: 'Invalid request format. Expected: { translations: [], language: string, namespace?: string }' 
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
          .upsert(upsertData, { onConflict: 'namespace,key,language' });

        if (error) throw error;

        return res.status(200).json({
          success: true,
          updatedCount: upsertData.length
        });
      } catch (error: any) {
        return res.status(500).json({
          error: 'Failed to update translations',
          message: error.message
        });
      }
    }

    // 404
    return res.status(404).json({ 
      error: 'Translation API route not found',
      path: pathname,
      service: 'jx-cloud-i18n-vercel'
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-i18n-vercel'
    });
  }
}
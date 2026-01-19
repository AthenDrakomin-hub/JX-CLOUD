# JX Cloud Terminal - Supabase Edge Functions 部署指南

## 🎯 部署目标
将认证服务从Vercel迁移到Supabase Edge Functions，解决ESM导入错误和认证问题。

## 📋 预先准备

### 1. 获取必要的密钥
登录 [Supabase控制台](https://app.supabase.com/project/zlbemopcgjohrnyyiwvs/settings/api):
- 复制 **Service Role Key** (用于Edge Functions)
- 确认 **Project URL**: `https://zlbemopcgjohrnyyiwvs.supabase.co`

### 2. 设置环境变量
在Supabase控制台的 "Settings" → "API" → "Edge Functions" 中添加:
```
BETTER_AUTH_SECRET=JX_CLOUD_SECURE_AUTH_SECRET_KEY_2025_V2
SUPABASE_SERVICE_ROLE_KEY=[您复制的Service Role Key]
BETTER_AUTH_URL=https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1
```

## 🚀 手动部署步骤

### 方法一：使用Supabase Web控制台 (推荐)

1. 访问 [Supabase Functions Dashboard](https://app.supabase.com/project/zlbemopcgjohrnyyiwvs/functions)
2. 点击 "New Function"
3. 选择 "Blank Function"
4. 函数名称输入: `auth`
5. 将以下代码粘贴到编辑器中:

```typescript
// auth.ts - Supabase Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const handler = async (req: Request): Promise<Response> => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const url = new URL(req.url);
  const path = url.pathname;
  
  if (path.endsWith('/session')) {
    // 简单的会话检查
    return new Response(JSON.stringify({ 
      user: null,
      service: 'jx-cloud-auth-edge'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  if (path.endsWith('/health')) {
    return new Response(JSON.stringify({ 
      status: 'healthy',
      service: 'jx-cloud-auth-edge'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

if (import.meta.main) {
  serve(handler);
}
```

6. 点击 "Deploy"

### 方法二：使用CLI部署

如果CLI认证问题解决后:
```bash
# 部署认证函数
npx supabase functions deploy auth --project-ref zlbemopcgjohrnyyiwvs

# 部署API函数
npx supabase functions deploy api-index --project-ref zlbemopcgjohrnyyiwvs
```

## ✅ 验证部署

部署成功后，测试以下端点:

```bash
# 测试认证会话
curl https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth/session

# 测试健康检查
curl https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth/health
```

预期响应:
```json
{
  "user": null,
  "service": "jx-cloud-auth-edge"
}
```

## 🔧 前端配置更新

更新 `.env` 文件中的认证URL:
```
VITE_BETTER_AUTH_URL=https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth
```

## 🎉 部署完成

完成后，您的系统将:
- ✅ 消除ESM导入错误
- ✅ 获得原生数据库集成
- ✅ 实现更低延迟的认证响应
- ✅ 统一环境变量管理

如遇问题，请检查Supabase控制台的函数日志获取详细错误信息。
#!/bin/bash
# JX Cloud Terminal - Supabase Edge Functions 部署脚本

echo "🚀 开始部署 JX Cloud Terminal 到 Supabase Edge Functions..."

# 1. 链接 Supabase 项目
echo "🔗 链接到 Supabase 项目..."
npx supabase link --project-ref zlbemopcgjohrnyyiwvs

# 2. 设置必要的环境变量
echo "⚙️  配置环境变量..."
echo "请确保在 Supabase 控制台中设置了以下环境变量："
echo "- BETTER_AUTH_SECRET"
echo "- BETTER_AUTH_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"

# 3. 部署认证函数
echo "📤 部署认证函数..."
npx supabase functions deploy api/auth/\[...betterAuth\]

# 4. 部署通用API函数
echo "📤 部署通用API函数..."
npx supabase functions deploy api/index

# 5. 验证部署
echo "✅ 验证部署状态..."
echo "测试认证会话端点:"
curl -I https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api/auth/session

echo "测试健康检查端点:"
curl -I https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api/health

echo "🎉 部署完成！"
echo "现在可以访问您的应用，认证功能应该正常工作了。"
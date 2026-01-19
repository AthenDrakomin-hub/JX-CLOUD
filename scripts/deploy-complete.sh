#!/bin/bash
# JX Cloud Terminal - Supabase Edge Functions 完整部署脚本

echo "🚀 开始完整部署 JX Cloud Terminal 到 Supabase Edge Functions..."

# 检查必要文件
echo "📋 检查必要文件..."
if [ ! -f ".env" ]; then
    echo "❌ 错误: 找不到 .env 文件"
    exit 1
fi

if [ ! -d "supabase/functions" ]; then
    echo "❌ 错误: 找不到 supabase/functions 目录"
    exit 1
fi

echo "✅ 文件检查通过"

# 链接项目
echo "🔗 链接 Supabase 项目..."
npx supabase link --project-ref zlbemopcgjohrnyyiwvs

if [ $? -ne 0 ]; then
    echo "❌ 项目链接失败"
    exit 1
fi

echo "✅ 项目链接成功"

# 提醒设置环境变量
echo "⚠️  重要提醒:"
echo "请确保在 Supabase 控制台中已设置以下环境变量:"
echo "  - BETTER_AUTH_SECRET"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""
read -p "确认已设置环境变量后按回车继续..."

# 部署所有函数
echo "📤 部署 Edge Functions..."

echo "正在部署主API函数..."
npx supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs
if [ $? -ne 0 ]; then
    echo "❌ API函数部署失败"
    exit 1
fi

echo "正在部署认证函数..."
npx supabase functions deploy auth --project-ref zlbemopcgjohrnyyiwvs
if [ $? -ne 0 ]; then
    echo "❌ 认证函数部署失败"
    exit 1
fi

echo "正在部署初始化函数..."
npx supabase functions deploy init --project-ref zlbemopcgjohrnyyiwvs
if [ $? -ne 0 ]; then
    echo "❌ 初始化函数部署失败"
    exit 1
fi

echo "✅ 所有函数部署完成"

# 验证部署
echo "🔍 验证部署状态..."

echo "测试API健康检查..."
curl -s -o /dev/null -w "%{http_code}" https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api/health | grep -q "200"
if [ $? -eq 0 ]; then
    echo "✅ API服务正常"
else
    echo "❌ API服务异常"
fi

echo "测试认证服务..."
curl -s -o /dev/null -w "%{http_code}" https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth/health | grep -q "200"
if [ $? -eq 0 ]; then
    echo "✅ 认证服务正常"
else
    echo "❌ 认证服务异常"
fi

echo "测试初始化服务..."
curl -s -o /dev/null -w "%{http_code}" https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/init/dishes | grep -q "200"
if [ $? -eq 0 ]; then
    echo "✅ 初始化服务正常"
else
    echo "❌ 初始化服务异常"
fi

# 初始化菜品数据
echo "🍽️  初始化菜品数据..."
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/init/init-dishes \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'

echo ""
echo "🎉 部署完成!"
echo "您的 JX Cloud Terminal 现在完全运行在 Supabase Edge Functions 上"
echo ""
echo "📚 可用的API端点:"
echo "  - API网关: https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api"
echo "  - 认证服务: https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth"
echo "  - 初始化服务: https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/init"
echo ""
echo "🔧 下一步:"
echo "1. 更新前端应用的API地址配置"
echo "2. 测试完整的认证和业务流程"
echo "3. 验证实时功能是否正常工作"
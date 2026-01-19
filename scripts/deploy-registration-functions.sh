#!/bin/bash
# 部署注册管理功能的Edge Functions

echo "🚀 开始部署注册管理功能..."

# 部署认证函数（包含注册管理功能）
echo "1️⃣ 部署认证函数 (包含注册管理)..."
./supabase.exe functions deploy auth --project-ref zlbemopcgjohrnyyiwvs --use-api

# 部署API函数（包含注册管理API）
echo "2️⃣ 部署API网关函数..."
./supabase.exe functions deploy api --project-ref zlbemopcgjohrnyyiwvs --use-api

# 部署国际化函数（支持多语言注册界面）
echo "3️⃣ 部署国际化函数..."
./supabase.exe functions deploy i18n --project-ref zlbemopcgjohrnyyiwvs --use-api

echo "✅ 所有注册管理相关函数部署完成！"

echo "
📋 已部署的注册管理功能：

1. /auth/request-registration - 用户注册申请
2. /auth/approve-registration - 管理员批准注册
3. /auth/reject-registration - 管理员拒绝注册
4. /auth/registration-requests - 获取注册申请列表

🚀 前端现在可以使用这些API进行账号注册管理了！
"
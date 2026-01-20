#!/bin/bash
# 部署登录页面所需的核心Edge Functions

echo "🚀 开始部署登录页面功能..."

# 1. 部署认证主函数（包含登录、注册、会话管理）
echo "1️⃣ 部署认证核心函数..."
./supabase.exe functions deploy auth --project-ref zlbemopcgjohrnyyiwvs --use-api

# 2. 部署Better-Auth集成函数
echo "2️⃣ 部署Better-Auth集成函数..."
./supabase.exe functions deploy better-auth --project-ref zlbemopcgjohrnyyiwvs --use-api

# 3. 部署API网关函数（统一入口）
echo "3️⃣ 部署API网关函数..."
./supabase.exe functions deploy api --project-ref zlbemopcgjohrnyyiwvs --use-api

# 4. 部署国际化函数（多语言支持）
echo "4️⃣ 部署国际化函数..."
./supabase.exe functions deploy i18n --project-ref zlbemopcgjohrnyyiwvs --use-api

echo "
✅ 登录页面功能部署完成！

📋 已部署的功能端点：

🔐 认证相关：
- POST /auth/login - 邮箱登录验证
- POST /auth/passkey/register - Passkey注册
- POST /auth/passkey/verify - Passkey验证
- GET /auth/session - 会话状态检查
- GET /auth/health - 服务健康检查

📝 注册管理：
- POST /auth/request-registration - 用户注册申请
- POST /auth/approve-registration - 管理员批准
- POST /auth/reject-registration - 管理员拒绝
- GET /auth/registration-requests - 获取注册请求

🌐 国际化支持：
- GET /i18n - 多语言文本获取

🚀 前端登录页面现在可以正常使用所有功能了！
"
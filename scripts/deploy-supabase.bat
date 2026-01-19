@echo off
REM JX Cloud Terminal - Supabase Edge Functions 部署脚本 (Windows)

echo 🚀 开始部署 JX Cloud Terminal 到 Supabase Edge Functions...

REM 检查必要文件是否存在
if not exist ".env" (
    echo ❌ 错误: 找不到 .env 文件
    pause
    exit /b 1
)

if not exist "supabase\functions\api\auth\[...betterAuth].ts" (
    echo ❌ 错误: 找不到认证函数文件
    pause
    exit /b 1
)

REM 1. 链接 Supabase 项目
echo 🔗 链接到 Supabase 项目...
npx supabase link --project-ref zlbemopcgjohrnyyiwvs

if %errorlevel% neq 0 (
    echo ❌ 项目链接失败
    pause
    exit /b 1
)

REM 2. 提醒设置环境变量
echo ⚠️  重要: 请确保在 Supabase 控制台中设置了以下环境变量:
echo    - BETTER_AUTH_SECRET
echo    - SUPABASE_SERVICE_ROLE_KEY
echo.
echo 按任意键继续部署...
pause >nul

REM 3. 部署认证函数
echo 📤 部署认证函数...
npx supabase functions deploy api/auth/[...betterAuth]

if %errorlevel% neq 0 (
    echo ❌ 认证函数部署失败
    pause
    exit /b 1
)

REM 4. 部署通用API函数
echo 📤 部署通用API函数...
npx supabase functions deploy api

if %errorlevel% neq 0 (
    echo ❌ API函数部署失败
    pause
    exit /b 1
)

REM 5. 验证部署
echo ✅ 验证部署状态...
echo 测试认证会话端点:
curl -I https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api/auth/session

echo.
echo 测试健康检查端点:
curl -I https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api/health

echo.
echo 🎉 部署完成！
echo 现在可以访问您的应用，认证功能应该正常工作了。
echo 记得更新前端的 VITE_BETTER_AUTH_URL 为:
echo https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1

pause
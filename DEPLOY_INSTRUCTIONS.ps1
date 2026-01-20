Write-Host "🔍 江西云厨API网关部署向导" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

Write-Host "`n步骤1: 登录Supabase CLI" -ForegroundColor Yellow
Write-Host "请访问 https://app.supabase.com/account/tokens 创建访问令牌"
Write-Host "然后运行以下命令（替换 your_token_here 为您的真实令牌）:"
Write-Host "npx supabase login --token `"your_token_here`"" 

Write-Host "`n步骤2: 链接到您的项目" -ForegroundColor Yellow
Write-Host "npx supabase link --project-ref zlbemopcgjohrnyyiwvs"

Write-Host "`n步骤3: 部署API网关" -ForegroundColor Yellow
Write-Host "npx supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs"

Write-Host "`n步骤4: (可选) 部署认证函数" -ForegroundColor Yellow
Write-Host "npx supabase functions deploy auth --project-ref zlbemopcgjohrnyyiwvs"

Write-Host "`n💡 获取访问令牌方法：" -ForegroundColor Cyan
Write-Host "1. 登录Supabase仪表板 (https://app.supabase.com)"
Write-Host "2. 访问 Account → Account Settings → Access Tokens" 
Write-Host "3. 点击 'New token' 创建新令牌"
Write-Host "4. 复制令牌并替换上述命令中的 'your_token_here'"

Write-Host "`n📋 验证部署：" -ForegroundColor Cyan
Write-Host "部署完成后，您可以使用以下命令测试API："
Write-Host "curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api ``
  -H `"Content-Type: application/json`" ``
  -d `'{"action": "health"}'`""

Write-Host "`n✅ API网关文件已准备就绪：" -ForegroundColor Green
Write-Host "   - supabase/functions/api/index.ts"
Write-Host "   - supabase/functions/import_map.json" 
Write-Host "   - supabase/functions/api/DEPLOYMENT_GUIDE.md"
# Supabase API网关部署脚本
# 请按照以下步骤部署江西云厨API网关

echo "🔍 江西云厨API网关部署向导"
echo "==========================="

echo "步骤1: 登录Supabase CLI"
echo "请访问 https://app.supabase.com/account/tokens 创建访问令牌"
echo "然后运行以下命令（替换 your_token_here 为您的真实令牌）:"
echo "npx supabase login --token \"your_token_here\""
echo ""

echo "步骤2: 链接到您的项目"
echo "npx supabase link --project-ref zlbemopcgjohrnyyiwvs"
echo ""

echo "步骤3: 部署API网关"
echo "npx supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs"
echo ""

echo "步骤4: (可选) 部署认证函数"
echo "npx supabase functions deploy auth --project-ref zlbemopcgjohrnyyiwvs"
echo ""

echo "💡 获取访问令牌方法："
echo "1. 登录Supabase仪表板 (https://app.supabase.com)"
echo "2. 访问 Account → Account Settings → Access Tokens"
echo "3. 点击 'New token' 创建新令牌"
echo "4. 复制令牌并替换上述命令中的 'your_token_here'"
echo ""

echo "📋 验证部署："
echo "部署完成后，您可以使用以下命令测试API："
echo "curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"action\": \"health\"}'"
echo ""

echo "✅ API网关文件已准备就绪："
echo "   - supabase/functions/api/index.ts"
echo "   - supabase/functions/import_map.json"
echo "   - supabase/functions/api/DEPLOYMENT_GUIDE.md"
#!/bin/bash
# Supabase Edge Functions 部署脚本

echo "📦 准备部署包..."

# 创建部署目录
mkdir -p deploy-package
cd deploy-package

# 复制函数文件
cp -r ../supabase/functions/api .
cp -r ../supabase/functions/auth.ts .
cp -r ../supabase/functions/i18n.ts .

# 创建部署说明
cat > DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# 手动部署说明

## 1. 登录Supabase仪表板
访问: https://app.supabase.com/project/zlbemopcgjohrnyyiwvs

## 2. 部署函数
导航到: Functions → Create Function

### 部署以下函数:

**API函数:**
- 函数名: `api`
- 入口点: `supabase/functions/api/index.ts`
- 环境变量: 无需特殊配置

**认证函数:**
- 函数名: `auth`  
- 入口点: `supabase/functions/auth.ts`
- 环境变量: 无需特殊配置

**国际化函数:**
- 函数名: `i18n`
- 入口点: `supabase/functions/i18n.ts`
- 环境变量: 无需特殊配置

## 3. 验证部署
部署后测试以下端点:
- POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api
- POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth
- GET https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/i18n

## 4. 配置CORS (如果需要)
在函数设置中允许以下来源:
- http://localhost:3002
- https://kims-projects-005a1207.vercel.app
EOF

echo "✅ 部署包已创建在 deploy-package/ 目录"
echo "📋 请按照 DEPLOYMENT_INSTRUCTIONS.md 中的说明手动部署函数"
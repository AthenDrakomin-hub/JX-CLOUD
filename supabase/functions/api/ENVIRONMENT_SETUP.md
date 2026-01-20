# 🔧 江西云厨API网关 - 环境变量配置指南

## 📋 必需的环境变量

### 1. Supabase配置
```bash
# Supabase项目URL
SUPABASE_URL=https://zlbemopcgjohrnyyiwvs.supabase.co

# Supabase服务角色密钥（用于后台操作）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2ODkzOSwiZXhwIjoyMDgxNDQ0OTM5fQ.eEiAhCFcRuTuxcoGpiX5U3s-hUKx-Iey6w958MraZug
```

### 2. 数据库连接（可选，用于直接SQL查询）
```bash
# 数据库连接池URL
DATABASE_URL=postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSczlbemopcgjohrnyyiwvs.pooler.supabase.com:6543/postgres?sslmode=require&pool_mode=transaction
```

### 3. 应用配置
```bash
# 应用环境标识
NODE_ENV=production

# 日志级别
LOG_LEVEL=info

# JWT密钥（Better Auth使用）
BETTER_AUTH_SECRET=your-32-char-secret-key-here

# 应用基础URL
APP_BASE_URL=https://your-domain.com
```

## 🛠️ 配置步骤

### 方法一：通过Supabase仪表板配置（推荐）

1. 登录 [Supabase控制台](https://app.supabase.com)
2. 选择您的项目 `zlbemopcgjohrnyyiwvs`
3. 导航到 **Settings** → **Functions** → **Environment variables**
4. 添加以上环境变量

### 方法二：本地开发配置

创建 `.env.local` 文件：
```bash
# 在项目根目录创建
touch .env.local
```

添加内容：
```env
SUPABASE_URL=https://zlbemopcgjohrnyyiwvs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2ODkzOSwiZXhwIjoyMDgxNDQ0OTM5fQ.eEiAhCFcRuTuxcoGpiX5U3s-hUKx-Iey6w958MraZug
DATABASE_URL=postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSczlbemopcgjohrnyyiwvs.pooler.supabase.com:6543/postgres?sslmode=require&pool_mode=transaction
```

## 🔍 验证配置

部署后，通过健康检查端点验证配置：
```bash
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "db_connected": true,
    "timestamp": "2026-01-20T12:00:00Z",
    "service": "jx-cloud-api-gateway",
    "version": "1.0.0"
  }
}
```

## ⚠️ 安全注意事项

1. **保护密钥**：永远不要在客户端代码中暴露 `SUPABASE_SERVICE_ROLE_KEY`
2. **环境隔离**：为开发、测试、生产环境使用不同的密钥
3. **定期轮换**：建议每90天轮换一次密钥
4. **最小权限**：确保服务角色只拥有必要的数据库权限

## 🚀 下一步

配置完成后，运行部署命令：
```bash
supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs
```
# 🚀 江西云厨API网关 - 部署和测试指南

## 📦 部署指南

### 🔧 前置条件
确保已安装Supabase CLI：
```bash
npm install -g supabase
# 或
brew install supabase
```

### 🚀 一键部署命令
```bash
# 部署到生产环境
supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs

# 部署并查看详细日志
supabase functions deploy api --project-ref zlbemopcgjohrnyyiwvs --debug
```

### 🌐 部署后的访问地址
```
https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api
```

### 🛠️ 本地开发测试
```bash
# 启动本地开发服务器
supabase functions serve --env-file .env.local

# 本地测试地址
http://localhost:54321/functions/v1/api
```

## 🧪 测试用例

### 1. 系统健康检查
```bash
# cURL命令
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Postman配置
Method: POST
URL: https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api
Headers: Content-Type: application/json
Body: {"action": "health"}
```

### 2. 用户注册审批（需要管理员权限）
```bash
# 批准注册
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "action": "approve-registration",
    "requestId": "reg_123456",
    "approved": true,
    "adminId": "admin_user_id"
  }'

# 拒绝注册
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "action": "approve-registration",
    "requestId": "reg_123456",
    "approved": false,
    "adminId": "admin_user_id",
    "rejectionReason": "资料不完整"
  }'
```

### 3. 菜品管理
```bash
# 创建菜品
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manage-dishes",
    "operation": "create",
    "partnerId": "p_123",
    "payload": {
      "name": "红烧肉",
      "price": 88,
      "category_id": "cat_001",
      "description": "经典中式红烧肉"
    }
  }'

# 更新菜品
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manage-dishes",
    "operation": "update",
    "dishId": "dish_123",
    "partnerId": "p_123",
    "payload": {
      "price": 98,
      "description": "升级版红烧肉"
    }
  }'

# 删除菜品
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manage-dishes",
    "operation": "delete",
    "dishId": "dish_123",
    "partnerId": "p_123"
  }'

# 列出菜品
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manage-dishes",
    "operation": "list",
    "partnerId": "p_123"
  }'
```

### 4. 订单状态更新
```bash
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update-order-status",
    "orderId": "ord_123",
    "status": "preparing"
  }'
```

### 5. 房间状态批量查询
```bash
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get-room-statuses",
    "roomIds": ["8201", "8202", "8203"]
  }'
```

## 📊 预期响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体业务数据
  },
  "timestamp": "2026-01-20T12:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "human-readable error message",
  "timestamp": "2026-01-20T12:00:00Z"
}
```

## 🛡️ 权限测试

### 管理员权限验证
```bash
# 无权限访问（应返回401）
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{"action": "approve-registration", "requestId": "test", "approved": true, "adminId": "test"}'

# 正确的管理员访问
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_ADMIN_JWT" \
  -d '{"action": "approve-registration", "requestId": "test", "approved": true, "adminId": "admin123"}'
```

## 🔧 故障排除

### 常见问题及解决方案

1. **环境变量缺失**
   ```
   Error: Missing required environment variables: SUPABASE_URL
   ```
   **解决**: 按照ENVIRONMENT_SETUP.md配置环境变量

2. **数据库连接失败**
   ```
   Error: Health check failed: Connection refused
   ```
   **解决**: 检查SUPABASE_SERVICE_ROLE_KEY是否正确

3. **JWT验证失败**
   ```
   Error: Unauthorized: Invalid admin credentials
   ```
   **解决**: 确保使用有效的管理员JWT令牌

4. **CORS错误**
   ```
   Access to fetch blocked by CORS policy
   ```
   **解决**: 检查前端请求的Origin头设置

### 监控和日志

查看函数日志：
```bash
# 实时查看日志
supabase functions logs api --project-ref zlbemopcgjohrnyyiwvs

# 查看最近的日志
supabase functions logs api --project-ref zlbemopcgjohrnyyiwvs --tail 100
```

## ✅ 部署检查清单

- [ ] 环境变量已正确配置
- [ ] 函数已成功部署
- [ ] 健康检查端点返回正常
- [ ] 所有API端点测试通过
- [ ] 管理员权限验证正常
- [ ] 数据库RLS策略工作正常
- [ ] CORS配置正确
- [ ] 日志记录正常工作

## 🎯 性能基准

预期性能指标：
- 响应时间：< 200ms（简单查询）
- 并发处理：支持1000+并发请求
- 可用性：99.9% SLA
- 冷启动时间：< 500ms

部署完成后，您的江西云厨酒店管理系统API网关就可以正式投入使用了！🎉
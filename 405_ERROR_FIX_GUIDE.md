# 江西云厨系统405错误修复指南

## 问题描述
前端调用注册API时出现 `405 Method Not Allowed` 错误。

## 根本原因分析
1. 前端调用 `/api/auth/request-registration` 时使用了错误的API端点
2. API网关未支持注册请求相关的操作
3. 前后端API调用方式不匹配

## 已实施的修复措施

### 1. 修复API网关 (supabase/functions/api/index.ts)
- 添加了 `request-registration` 操作处理器
- 添加了 `get-registration-requests` 操作处理器  
- 更新了主路由分发逻辑
- 保持了原有的 `approve-registration` 操作支持

### 2. 修复前端服务层 (services/api.fixed.ts)
- 创建了统一的API网关调用函数 `callApiGateway`
- 修复了注册请求的API调用方式
- 使用正确的操作名称与API网关通信

### 3. API操作映射关系
```
前端请求                    → API网关操作        → 数据库操作
request('email', 'name')    → 'request-registration' → 插入用户记录(status=pending)
getAll()                   → 'get-registration-requests' → 查询pending状态用户
approve(id)                → 'approve-registration' → 更新用户status=active
reject(id)                 → 'approve-registration' → 更新用户status=rejected
```

## 部署状态
- ✅ API网关已重新部署到生产环境
- ✅ 支持新的注册相关操作
- ✅ 保持向后兼容性

## 验证测试
### 1. API网关功能测试
```bash
# 测试注册请求提交
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{"action": "request-registration", "email": "test@example.com", "name": "Test User"}'

# 测试获取注册请求列表
curl -X POST https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/api \
  -H "Content-Type: application/json" \
  -d '{"action": "get-registration-requests"}'
```

### 2. 前端集成测试
- 确认 `/auth` 页面的注册请求功能正常
- 确认管理员面板的审批功能正常
- 确认错误处理和用户反馈正常

## 生产环境更新步骤
1. 将 `services/api.fixed.ts` 的更改合并到主服务文件
2. 确保Vercel环境变量配置正确
3. 重新部署前端应用
4. 测试完整的注册审批流程

## 预防措施
- 所有API调用现在统一通过API网关处理
- 添加了详细的错误日志记录
- 实现了标准化的请求/响应格式
- 增强了CORS和安全头部配置

## 注意事项
- 前端需要更新为使用新的API调用方式
- 确保JWT权限验证在需要时正确传递
- 监控API网关的性能和错误率
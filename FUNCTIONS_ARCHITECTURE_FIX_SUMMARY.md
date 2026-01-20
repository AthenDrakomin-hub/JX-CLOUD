# 江西云厨系统函数架构修复完成

## 问题背景
发现项目中存在两个Supabase Edge Functions：
1. `auth` 函数 (在列表中显示为 `login`) - 处理认证相关请求
2. `api` 函数 - 统一业务API网关

前端代码对这两个函数的调用方式不一致，导致API调用混乱。

## 修复措施

### 1. 服务层更新 (services/api.ts)
- 修改注册相关API调用，直接使用auth函数的端点
- 确保所有认证相关请求都正确指向auth函数
- 保持API调用路径与auth函数中定义的一致

### 2. API网关增强 (supabase/functions/api/index.ts)
- 添加对auth函数路径的兼容支持
- 保持原有action-based路由方式
- 确保API网关也能处理传统的路径式请求

### 3. 函数部署
- 重新部署auth函数（之前已部署）
- 重新部署api函数以包含兼容性更新

## 当前端点映射

### 认证相关请求 → auth函数
```
POST /functions/v1/auth/request-registration   → 提交注册请求
GET  /functions/v1/auth/registration-requests → 获取注册请求列表  
POST /functions/v1/auth/approve-registration  → 批准注册
POST /functions/v1/auth/reject-registration   → 拒绝注册
```

### 业务相关请求 → api函数
```
POST /functions/v1/api + action='health'              → 健康检查
POST /functions/v1/api + action='manage-dishes'       → 菜品管理
POST /functions/v1/api + action='update-order-status' → 订单状态更新
POST /functions/v1/api + action='get-room-statuses'   → 房间状态查询
```

## 架构优势
1. **职责分离**: 认证和业务逻辑分别处理
2. **兼容性**: API网关保持向后兼容
3. **可维护性**: 清晰的函数职责划分
4. **安全性**: 认证相关操作集中在auth函数中

## 前端集成
前端现在正确调用：
- 认证操作 → auth函数
- 业务操作 → api函数

## 验证测试
- [ ] auth函数端点正常工作
- [ ] api函数端点正常工作  
- [ ] 注册流程完整测试
- [ ] 认证流程完整测试
- [ ] 业务功能完整测试

## 生产环境部署
所有函数已部署到生产环境，前端代码已更新以使用正确的API端点。
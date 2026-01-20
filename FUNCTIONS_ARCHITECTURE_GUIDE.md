# 江西云厨系统函数和服务一致性修复指南

## 问题分析
在检查项目时发现：
1. Supabase项目中部署了两个函数：`api` 和 `auth` (显示为 `login` 在函数列表中)
2. `auth` 函数包含注册请求相关的端点
3. `api` 函数也添加了注册请求相关的端点
4. 数据库中可能存在 `registration_requests` 表

## 函数用途分析
- `api` 函数：统一API网关，处理业务逻辑（菜品、订单、房间状态等）
- `auth` 函数：认证服务，处理登录、注册请求等认证相关功能

## 当前端点映射
### auth/login 函数端点：
- POST /functions/v1/auth/request-registration - 提交注册请求
- POST /functions/v1/auth/approve-registration - 批准注册
- POST /functions/v1/auth/reject-registration - 拒绝注册
- GET /functions/v1/auth/registration-requests - 获取注册请求列表
- POST /functions/v1/auth/login - 登录
- GET /functions/v1/auth/session - 获取会话
- GET /functions/v1/auth/get-session - 获取会话

### api 函数端点：
- POST /functions/v1/api - 通过 action 参数区分操作
  - action='request-registration' - 提交注册请求
  - action='get-registration-requests' - 获取注册请求列表
  - action='approve-registration' - 批准注册
  - action='health' - 健康检查
  - action='manage-dishes' - 菜品管理
  - action='update-order-status' - 订单状态更新
  - action='get-room-statuses' - 房间状态查询

## 修复建议
当前系统存在两种API调用方式，需要统一：

### 方案1：统一使用API网关 (推荐)
修改前端代码，所有请求都通过API网关，包括认证请求：
- auth/request -> api?action=request-registration
- auth/approve -> api?action=approve-registration
- auth/list -> api?action=get-registration-requests

### 方案2：分离职责 (当前架构)
- 认证相关请求 → auth 函数
- 业务相关请求 → api 函数

## 推荐使用方案2，因为：
1. 符合微服务架构原则
2. 认证和业务逻辑分离
3. 更好的安全边界
4. 便于独立维护和扩展

## 前端API调用更新
需要更新 services/api.ts 中的注册请求调用：

```typescript
// 从
const response = await fetch('/api/auth/request-registration', {...})

// 改为
const response = await fetch('https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    type: 'request-registration', // 或者使用其他区分字段
    email, 
    name 
  }),
})
```

## 数据库表确认
auth 函数假设有 registration_requests 表，需要确保数据库中存在该表。
# 账号注册问题修复指南

## 问题概述
JX Cloud Terminal 系统采用多步骤注册流程，包括：
1. 用户提交注册请求
2. 管理员审核请求
3. 用户激活账户

常见问题包括：注册请求提交失败、管理员无法审核、用户激活失败等。

## 问题诊断

### 1. 环境检查
- **HTTPS 要求**: 确保应用运行在 HTTPS 环境或 localhost
- **浏览器兼容性**: 确保使用支持 WebAuthn 的现代浏览器
- **硬件支持**: 确保设备支持生物识别或安全密钥

### 2. 配置检查
- **环境变量**: 检查必需的环境变量是否正确设置
- **API 端点**: 验证注册相关端点是否可用
- **数据库**: 确认注册请求表是否存在

## 修复步骤

### 步骤 1: 检查环境配置
```bash
# 检查必需的环境变量
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BETTER_AUTH_URL=your_auth_url
BETTER_AUTH_SECRET=32_character_secret_key
```

### 步骤 2: 验证 API 端点
- `/api/auth/request-registration` - 提交注册请求
- `/api/auth/approve-registration` - 管理员批准
- `/api/auth/reject-registration` - 管理员拒绝
- `/api/auth/registration-requests` - 获取请求列表

### 步骤 3: 检查数据库表
确认 `registration_requests` 表已创建并具有以下结构：
- id (主键)
- email (用户邮箱)
- name (用户名)
- status (pending/approved/rejected)
- request_time (请求时间)

### 步骤 4: 测试注册流程
1. 尝试提交注册请求
2. 检查管理员能否看到待审核请求
3. 测试批准和拒绝功能
4. 验证用户激活流程

## 常见错误及解决方案

### 错误 1: "注册请求提交失败"
**原因**: 网络问题或API端点不可用
**解决方案**: 
- 检查网络连接
- 验证 `/api/auth/request-registration` 端点是否正常
- 确认环境变量配置正确

### 错误 2: "管理员无法看到注册请求"
**原因**: 数据库查询问题或权限不足
**解决方案**:
- 检查 `registration_requests` 表是否存在
- 验证管理员权限
- 确认 `/api/auth/registration-requests` 端点正常

### 错误 3: "用户激活失败"
**原因**: 令牌无效或Passkey注册问题
**解决方案**:
- 验证激活令牌格式
- 检查WebAuthn支持
- 确认生物识别硬件可用

## 预防措施

### 1. 监控注册流程
- 定期检查注册请求队列
- 监控API端点可用性
- 验证数据库连接

### 2. 用户引导
- 提供清晰的注册指引
- 显示准确的错误消息
- 实现重试机制

### 3. 系统维护
- 定期清理过期的注册请求
- 监控数据库性能
- 更新认证服务配置

## 验证修复

完成修复后，执行以下验证步骤：
1. 成功提交注册请求
2. 管理员能看到待审核请求
3. 可以批准/拒绝请求
4. 用户可以成功激活账户
5. 激活后可以正常登录

## 联系支持

如果问题仍然存在，请检查：
- 日志文件中的错误信息
- 网络连接状态
- 数据库服务状态
- 认证服务配置

必要时联系系统管理员或技术支持团队。
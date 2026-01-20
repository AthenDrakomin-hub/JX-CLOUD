# Passkey 验证修复指南

## 问题描述
Passkey 验证中断或设备未绑定

## 问题根本原因
1. 浏览器不在安全上下文（HTTPS）中运行
2. 设备不支持 WebAuthn API 或平台验证器
3. 用户尚未注册 Passkey 凭证
4. 认证服务配置问题
5. 环境变量配置错误

## 解决方案

### 1. 环境要求检查
- **HTTPS 要求**: Passkey 需要在安全上下文（HTTPS）下运行，开发环境可使用 localhost
- **浏览器支持**: 现代浏览器（Chrome 70+, Firefox 66+, Edge 18+, Safari 13+）
- **硬件支持**: 设备需具备生物识别硬件（指纹、面部识别）或支持 FIDO2 的安全密钥

### 2. 配置修复
#### 环境变量设置
确保以下环境变量已正确配置：
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BETTER_AUTH_URL=your_auth_url
BETTER_AUTH_SECRET=32_character_secret_key
```

#### 认证服务检查
- 确认 Supabase Edge Functions 正常运行
- 确认 Better-Auth 服务端点可访问
- 确认数据库中的 `passkey` 表已创建

### 3. 代码修复
- 使用了修复后的认证客户端配置
- 改进了错误处理和用户引导
- 增强了环境兼容性检查

### 4. 用户操作步骤
1. 确保使用支持 Passkey 的浏览器和设备
2. 首次使用时，需要在系统设置页面注册 Passkey
3. 如遇到验证问题，检查设备生物识别功能是否正常
4. 如需更换设备，记得在原设备上撤销 Passkey 证书

## 验证修复
- 运行 `npm run dev` 启动开发服务器
- 访问认证页面，确认 Passkey 登录按钮可见
- 尝试使用已注册的 Passkey 登录
- 如未注册，按照引导完成首次 Passkey 注册

## 常见问题排查
- **错误 "Passkey 验证中断"**: 检查浏览器是否支持 WebAuthn
- **错误 "设备未绑定"**: 用户尚未注册 Passkey 凭证，需要引导注册
- **认证服务不可达**: 检查环境变量和网络连接
- **安全上下文错误**: 确保通过 HTTPS 访问应用

## 预防措施
- 定期检查认证服务的健康状态
- 为用户提供清晰的 Passkey 设置指南
- 实施降级方案（备用登录方式）以防 Passkey 不可用
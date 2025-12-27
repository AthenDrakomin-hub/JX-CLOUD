# OAuth 配置指南

## 配置第三方 OAuth 提供商

要在应用中启用 Google、GitHub 等第三方登录，请按照以下步骤配置：

### 1. 在 Supabase 仪表板中配置

1. 登录到 Supabase 仪表板
2. 选择您的项目
3. 进入 **Authentication** → **Settings**
4. 在 **Site URL** 中输入：`https://www.jiangxijiudian.store`
5. 在 **Redirect URLs** 中添加：`https://www.jiangxijiudian.store/auth/callback`

### 2. 配置 OAuth 提供商

1. 进入 **Authentication** → **Providers**
2. 启用您需要的 OAuth 提供商（如 Google、GitHub 等）
3. 输入提供商的 Client ID 和 Client Secret
4. Supabase 会自动生成提供商的回调 URL

### 3. 应用中的回调处理

应用已经配置了 `/auth/callback` 路径来处理 OAuth 回调：
- 认证成功后会自动重定向到主页
- 认证失败会显示错误信息并可重试

### 4. OAuth 提供商特定配置

#### Google OAuth
- 在 Google Cloud Console 中创建 OAuth 2.0 凭据
- 将授权的重定向 URI 设置为：`https://www.jiangxijiudian.store/auth/callback`

#### GitHub OAuth
- 在 GitHub 开发者设置中创建 OAuth App
- 将回调 URL 设置为：`https://www.jiangxijiudian.store/auth/callback`

## 注意事项

- 本应用使用 Supabase 作为 OAuth 客户端，连接到其他 OAuth 提供商
- 本应用不提供自己的 OAuth 授权服务器功能
- 所有认证数据通过 Supabase Auth 安全存储
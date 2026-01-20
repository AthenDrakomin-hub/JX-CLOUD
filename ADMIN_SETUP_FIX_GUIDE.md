# 江西云厨系统管理员初始化修复指南

## 问题描述
访问 https://www.jiangxijiudian.store/auth/admin-setup 时出现错误，无法完成根管理员初始化。

## 根本原因分析
1. 认证客户端使用了错误的基础URL构建方式
2. 缺少关键的BETTER_AUTH_URL环境变量配置
3. AdminSetup组件引用了未修复的认证客户端

## 已实施的修复措施
1. ✅ 修复AdminSetup.tsx组件，使用修复后的认证客户端
2. ✅ 添加BETTER_AUTH_URL环境变量配置
3. ✅ 保留AuthPage.tsx使用修复后的认证客户端

## 验证修复效果
1. 检查认证客户端是否正确构建URL
2. 验证环境变量配置
3. 确认Supabase Edge Functions部署正常

## 部署到生产环境的步骤

### 1. Vercel环境变量配置
在Vercel项目设置中添加以下环境变量：
```
VITE_SUPABASE_URL=https://zlbemopcgjohrnyyiwvs.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BETTER_AUTH_URL=https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/better-auth
BETTER_AUTH_URL=https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/better-auth
BETTER_AUTH_SECRET=JX_CLOUD_BETTER_AUTH_SECRET_32_CHARS
```

### 2. Supabase环境变量配置
确保在Supabase Edge Functions中设置了以下环境变量：
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2ODkzOSwiZXhwIjoyMDgxNDQ0OTM5fQ.eEiAhCFcRuTuxcoGpiX5U3s-hUKx-Iey6w958MraZug
```

### 3. 重新部署前端
```bash
vercel --prod
```

## 重新测试管理员初始化
1. 访问 https://www.jiangxijiudian.store/auth/admin-setup
2. 确认页面正常加载
3. 尝试点击"绑定生物识别"按钮
4. 验证认证流程是否正常

## 预期结果
- 页面正常加载，无JavaScript错误
- 认证流程能够正确连接到Supabase Edge Functions
- 管理员账户能够成功初始化
- 生物识别凭证能够正确绑定

## 应急回退方案
如果问题仍然存在：
1. 检查浏览器控制台错误信息
2. 验证Supabase Edge Functions状态
3. 确认网络连接和CORS配置
4. 检查Better Auth函数部署状态

## 生产环境验证清单
- [ ] BETTER_AUTH_URL环境变量正确配置
- [ ] 认证客户端使用正确的基础URL
- [ ] AdminSetup组件引用修复后的认证客户端
- [ ] Supabase Edge Functions认证端点正常运行
- [ ] 管理员初始化流程正常工作
- [ ] 生物识别绑定功能正常
- [ ] JWT令牌正确生成和验证

## 注意事项
- 生产环境的BETTER_AUTH_SECRET必须是32位随机字符
- 确保Supabase Edge Functions中的better-auth函数已部署
- 验证HTTPS证书有效性（Passkey需要安全上下文）
- 检查浏览器兼容性（支持WebAuthn API）
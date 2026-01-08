# Vercel + Supabase 生产环境验证工具

这是一个用于验证 Vercel + Supabase 云端架构生产环境配置的工具集，确保部署环境满足生产要求。

## 验证功能

### 1. 连接验证（Connection Verification）
- 通过 Vercel Edge 函数调用 Supabase 客户端进行连接测试
- 结合 Supabase Dashboard 的实时日志监控，验证连接建立成功
- 重点排查以下配置项：
  * SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY 环境变量配置正确性
  * IP 白名单策略是否允许 Vercel 部署节点访问
  * CORS 策略配置是否正确
- 验证边缘函数中的安全脱敏机制是否正常工作

### 2. 性能验证（Performance Verification）
- 利用 Vercel Analytics 监控函数执行耗时和并发性能
- 通过 Supabase Query History 分析数据库查询响应时间
- 重点关注 Serverless 环境下的冷启动时间（首次调用延迟）
- 测试高并发场景下的响应稳定性
- 验证缓存机制是否有效减少重复查询耗时

### 3. 数据验证（Data Integrity Verification）
- 执行基准数据校验，确保读取的数据与源数据完全一致
- 进行字段完整性检查，验证所有必需字段正确传输
- 测试数据类型转换是否正确（特别是金额、时间戳等关键字段）
- 验证 JSONB 权限矩阵等复杂数据结构的读写准确性
- 确保 RLS（Row Level Security）策略正确执行

### 4. 健壮性验证（Robustness Verification）
- 测试网络波动情况下的超时处理机制
- 验证自动重试逻辑是否按预期工作（指数退避策略）
- 模拟数据库连接失败场景，确认错误处理和恢复机制
- 测试边缘函数在异常情况下的优雅降级
- 验证生产环境的安全防护机制（DDoS 防护、API 限流等）

## 使用方法

### 1. 安装依赖
```bash
npm install tsx
```

### 2. 环境变量配置
在运行验证之前，确保已设置以下环境变量：

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

或者使用 Vercel 的环境变量前缀：

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 运行验证

#### 方法一：使用 npm 脚本
```bash
npm run validate:production
```

#### 方法二：直接运行验证脚本
```bash
node scripts/validate-production.js
```

#### 方法三：运行连接验证
```bash
npm run validate:connection
```

## 生产环境就绪检查清单

验证完成后，工具会生成以下检查清单：

- [ ] SSL/TLS 强制加密配置完成
- [ ] JWT 鉴权加固完成（高强度 Secret）
- [ ] CORS 跨域策略限制仅允许受信任域名
- [ ] 环境变量完全脱敏，无敏感信息泄露风险
- [ ] 数据库连接池配置优化
- [ ] 自动备份机制启用
- [ ] 监控告警系统配置完成

## 返回值

- 验证成功：返回退出码 0
- 验证失败：返回退出码 1

这使得该工具可以轻松集成到 CI/CD 流程中。

## 在 Vercel 部署中使用

您可以将此验证工具作为部署前检查的一部分，确保每次部署都通过生产环境验证。

在 `vercel.json` 中添加部署钩子：

```json
{
  "builds": [
    {
      "src": "utils/validationRunner.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/validate",
      "dest": "/utils/validationRunner.ts"
    }
  ]
}
```
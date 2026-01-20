# Supabase Edge Functions 结构修复指南

## 问题概述
修复了Supabase Edge Functions的致命结构错误，这是90%用户会踩的坑：
- ❌ 错误结构：直接在functions目录下放置单个ts文件
- ✅ 正确结构：每个函数必须是独立文件夹，入口文件必须是index.ts

## 修复完成的结构变更

### 旧结构（错误）：
```
supabase/
  functions/
    api.ts       ❌ 错误：不能直接放单个ts文件
    auth.ts      ❌ 错误：不能直接放单个ts文件
    better-auth.ts ❌ 错误：不能直接放单个ts文件
    i18n.ts      ❌ 错误：不能直接放单个ts文件
    init.ts      ❌ 错误：不能直接放单个ts文件
```

### 新结构（正确）：
```
supabase/
  functions/
    api/         ✅ 每个函数是独立文件夹
      index.ts   ✅ 入口文件必须是index.ts
    auth/        ✅ 每个函数是独立文件夹
      index.ts   ✅ 入入文件必须是index.ts
    better-auth/ ✅ 每个函数是独立文件夹
      index.ts   ✅ 入口文件必须是index.ts
    i18n/        ✅ 每个函数是独立文件夹
      index.ts   ✅ 入口文件必须是index.ts
    init/        ✅ 每个函数是独立文件夹
      index.ts   ✅ 入口文件必须是index.ts
```

## 修复内容

### 1. 文件移动和重命名
- `supabase/functions/api.ts` → `supabase/functions/api/index.ts`
- `supabase/functions/auth.ts` → `supabase/functions/auth/index.ts`
- `supabase/functions/better-auth.ts` → `supabase/functions/better-auth/index.ts`
- `supabase/functions/i18n.ts` → `supabase/functions/i18n/index.ts`
- `supabase/functions/init.ts` → `supabase/functions/init/index.ts`

### 2. API实现替换
- 将api/index.ts中的重定向代码替换为实际API实现
- 保留了完整的API路由功能，包括：
  - 健康检查
  - 注册管理API
  - 菜品管理API
  - 订单管理API
  - 用户管理API
  - 房间状态API
  - 类别管理API

### 3. 认证服务修复
- 更新了auth/index.ts和better-auth/index.ts
- 保持了认证功能的完整性
- 修复了CORS配置

### 4. 前端API调用路径修复
- 更新了src/services/api.ts中的注册相关API调用路径
- 从 `${API_BASE_URL}/auth/...` 改为 `${SUPABASE_PROJECT_URL}/functions/v1/auth/...`

## 部署命令

现在可以使用正确的命令部署：

```bash
# 升级到最新版Supabase CLI
npm install -g supabase@latest

# 登录Supabase（如果未登录）
supabase login

# 一次性部署所有函数（推荐）
supabase functions deploy --all

# 或者单独部署每个函数
supabase functions deploy api
supabase functions deploy auth
supabase functions deploy better-auth
supabase functions deploy i18n
supabase functions deploy init
```

## 验证修复效果

### 1. API网关验证
```
https://your-project.supabase.co/functions/v1/api/health
```
正常返回：`{"status": "online", "service": "jx-cloud-api-edge", ...}`

### 2. 认证接口验证
```
https://your-project.supabase.co/functions/v1/auth/session
```
正常返回：`{"user": null, "service": "jx-cloud-auth-edge", ...}`

### 3. 注册接口验证
```
https://your-project.supabase.co/functions/v1/auth/registration-requests
```
正常返回：`{"requests": [], "totalCount": 0}`

## 前端配置

确保前端环境变量正确配置：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## 预期修复结果

✅ 不再出现NOT_FOUND错误
✅ 所有API接口正常返回200 OK
✅ 注册登录功能完全恢复正常
✅ 页面能正确跳转到登录页
✅ 认证流程正常工作

## 常见后续检查

1. 检查函数handler导出：确保每个index.ts最后一行导出默认handler
2. 检查环境变量：在Supabase控制台确认BETTER_AUTH_SECRET、DATABASE_URL等已添加到对应函数
3. 检查CORS配置：确保允许生产域名
4. 测试端到端流程：从注册到登录的完整流程
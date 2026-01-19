# JX Cloud Terminal - 快速参考指南

## 项目概览
- **项目名称**: JX Cloud Terminal (江西云厨终端系统)
- **技术栈**: React 19, Supabase, Better-Auth, TypeScript, Vite
- **架构**: 前后端分离，Supabase Edge Functions 驱动
- **特性**: 多租户、生物识别认证、实时数据同步

## 核心功能模块
1. **仪表板** - 实时业务指标和 T+1 自动分账
2. **房间管理** - 67+ 物理节点控制和 QR 码生成
3. **订单管理** - 企业级 KDS 厨房显示系统
4. **供应链管理** - 高精度库存预警和双语菜品记录
5. **财务中心** - 多商户结算和支出跟踪
6. **员工管理** - 细粒度权限控制和生物识别准入

## 常用命令
```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 类型检查
npm run type-check

# 预览生产构建
npm run preview
```

## 环境变量
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `BETTER_AUTH_SECRET` - 认证密钥 (32 字符)
- `BETTER_AUTH_URL` - 认证基础 URL
- `DATABASE_URL` - 数据库连接字符串

## 关键路径
- **前端入口**: `src/App.tsx`
- **API 服务**: `services/api.ts`
- **前端服务**: `src/services/api.ts`
- **数据库模式**: `schema.ts`
- **构建配置**: `vite.config.ts`

## 部署要点
1. **Edge Functions**: 部署到 Supabase Edge Functions
2. **前端**: 部署到 CDN 或静态托管服务
3. **数据库**: 配置 RLS 策略确保多租户隔离
4. **认证**: 配置 Better-Auth 和生物识别支持

## 安全特性
- **多租户隔离**: 通过 `partner_id` 和 RLS 实现
- **生物识别**: Passkey/FIDO2 支持
- **权限控制**: 细粒度 C/R/U/D 权限
- **数据加密**: SSL 连接和 JWT 令牌

## 生产准备状态
✅ **完全就绪** - 所有功能已验证，可部署到生产环境
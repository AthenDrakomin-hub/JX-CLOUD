# 🏨 江西云厨终端系统 (JX CLOUD Terminal) - V4

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Database](https://img.shields.io/badge/Backend-Supabase-emerald?style=flat-square&logo=supabase)](https://supabase.com)
[![Engine](https://img.shields.io/badge/Engine-React_19_|_Vite-blue?style=flat-square&logo=react)](https://react.dev)

> **江西云厨** 是一款专为现代化酒店设计的全栈管理生态系统。集成了客房实时点餐（QR Ordering）、订单调度矩阵（KDS）、多维财务清算、合伙人联营逻辑以及基于物理层 RLS 安全审计的视觉资产管理。

## 🏗 项目架构 (Project Architecture)

```
根目录/
├── components/           # React组件
├── services/             # 前端服务层
│   ├── api.ts           # 统一数据网关
│   ├── auth.ts          # 认证逻辑
│   ├── auth-client.ts   # 客户端认证
│   ├── db.server.ts     # 服务端数据库连接
│   ├── notification.ts  # 通知服务
│   ├── printService.ts  # 打印服务
│   └── s3Service.ts     # 文件存储服务
├── api/                  # 后端 Serverless 函数 (Vercel Runtime)
│   ├── index.ts         # 主 API 网关
│   ├── auth/[...betterAuth].ts  # 认证路由
│   ├── admin/users.ts   # 用户管理API
│   └── db-check.ts      # 数据库健康检查
├── drizzle/             # 数据库 Schema 与迁移定义
│   └── schema.ts        # 数据库表结构定义
├── scripts/             # 数据库维护与校验工具
├── src/                 # 前端核心
│   ├── App.tsx          # 主应用入口
│   ├── GuestEntry.tsx   # 客户端点餐入口
│   ├── constants.ts     # 常量定义
│   ├── index.tsx        # 应用入口
│   ├── types.ts         # TypeScript类型定义
│   └── translations.ts  # 国际化翻译
├── public/              # 静态资源
├── index.html           # HTML模板
├── package.json         # 依赖管理
└── vite.config.ts       # 构建配置
```

## 🛠 核心技术架构 (Tech Stack)

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Database**: Supabase (纯 PostgreSQL 数据库，不含认证)
- **Auth**: Better-Auth (完全解耦，供应商无关，支持 Passkeys)
- **Infrastructure**: Vercel Edge Runtime (边缘中间件与 API 网关)
- **ORM**: Drizzle ORM (物理层架构映射)
- **Security**: Passkeys (生物识别认证) + RLS (行级安全)
- **Modules**: ESM (ECMAScript Modules) with explicit .js extensions

## 🔐 核心安全特性

### 指纹认证 (Passkeys)
- **生物识别登录**: 支持指纹、面部识别等生物特征认证
- **无密码安全**: 基于 WebAuthn 标准，消除密码泄露风险
- **多重认证**: 支持 Passkeys + 传统密码的双重验证机制
- **设备绑定**: 生物特征与设备硬件绑定，防止凭证盗用

### 安全架构
- **RLS (Row Level Security)**: 基于物理层的数据访问控制
- **合伙人数据隔离**: 通过 `partner_id` 实现数据物理隔离
- **根管理员保护**: 对特定邮箱地址的删除操作有硬编码保护
- **权限验证**: 所有 API 操作都会验证用户权限

## 🚀 生产环境部署指南 (Deployment)

### 1. 物理数据库初始化 (Supabase)
在 Supabase SQL Editor 中执行以下脚本，激活酒店核心资产表结构与 RLS 安全策略：

```sql
-- 执行 database_setup.sql 脚本
-- 1. 建立 10 张核心业务表 (system_config, orders, menu_dishes 等)
-- 2. 注入 67 个客房初始物理节点 (8201-VIP)
-- 3. 激活实时复制频道 (Realtime Replication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
```

### 2. Vercel 部署配置
1.  在 Vercel Dashboard 导入本项目。
2.  Vercel 将自动注入 Supabase 环境变量：
    -   `SUPABASE_URL`
    -   `SUPABASE_ANON_KEY`

### 3. 手动配置环境变量 (Critical)
在 Vercel 设置中添加以下变量以激活认证和生产链路：

| 变量名 | 推荐值 | 说明 |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | 直接数据库连接（用于 Drizzle ORM） |
| `BETTER_AUTH_SECRET` | 随机生成的安全密钥 | Better Auth 会话签名加密 |
| `BETTER_AUTH_URL` | `https://your-domain.vercel.app` | 生产环境完整域名 |
| `VITE_BETTER_AUTH_URL` | `https://your-domain.vercel.app` | 前端认证 URL |

## 📦 构建与开发 (Build & Development)

### 安装依赖
```bash
npm install
```

### 本地开发
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 📁 ESM 模块规范

### 导入规范 (.js 后缀)
由于使用 ESM (ECMAScript Modules) 和 nodenext 模块解析，所有相对导入路径必须显式包含 `.js` 后缀：

```typescript
// ✅ 正确 - 使用 .js 后缀
import { db } from '../src/services/db.server.js';
import { user } from '../drizzle/schema.js';

// ❌ 错误 - 缺少 .js 后缀 (会导致 Vercel 部署失败)
import { db } from '../src/services/db.server';
import { user } from '../drizzle/schema';
```

## 🚨 关键安全措施 (Security Measures)

-   根管理员保护：对特定邮箱地址的删除操作有硬编码保护
-   权限验证：所有 API 操作都会验证用户权限
-   SQL 注入防护：使用参数化查询和 ORM 层保护
-   XSS 防护：输入验证和输出转义
-   认证与业务分离：认证数据与业务数据存储分离
-   Passkeys 生物识别：基于 WebAuthn 标准的无密码认证

## 🌐 国际化支持 (Internationalization)

系统支持中文 (zh)、英文 (en) 和他加禄语 (fil) 三语切换，所有界面元素均支持动态语言切换。

## 🔄 Changelog

### v4.0.0 (今日更新)
- **Vercel 部署攻克**: 成功解决 ESM 模块解析问题，实现稳定部署
- **Passkeys 集成**: 完成生物识别认证功能，提升系统安全性
- **模块规范统一**: 强制使用 .js 后缀，确保 ESM 模块兼容性
- **错误处理优化**: 统一 unknown 类型错误处理，提升代码健壮性
- **API 重构**: 优化 API 层错误处理逻辑，使用标准类型安全模式
- **安全增强**: 完善生物识别认证流程，支持指纹和面部识别

### v3.x
- 实时订单推送系统上线
- 多维财务清算功能
- 合伙人联营逻辑完善

### v2.x
- 前后端分离架构升级
- Drizzle ORM 数据库操作
- Better-Auth 认证系统集成

### v1.x
- 基础酒店管理系统
- 客房点餐功能
- 订单管理模块

## 🛠 维护与扩展 (Maintenance & Extensibility)

- **数据库迁移**: 使用 Drizzle Kit 进行 Schema 管理
- **实时功能**: 基于 Supabase Realtime 实现订单推送
- **性能优化**: 代码分割、图片优化、数据缓存
- **权限体系**: 四级用户角色 (ADMIN, PARTNER, STAFF, MAINTAINER)
- **安全升级**: Passkeys 生物识别认证，RLS 数据隔离
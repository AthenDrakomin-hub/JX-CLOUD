# 🏨 江西云厨终端系统 (JX CLOUD Terminal)

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Database](https://img.shields.io/badge/Backend-Supabase-emerald?style=flat-square&logo=supabase)](https://supabase.com)
[![Engine](https://img.shields.io/badge/Engine-React_19_|_Vite-blue?style=flat-square&logo=react)](https://react.dev)

> **江西云厨** 是一款专为现代化酒店设计的全栈管理生态系统。集成了客房实时点餐（QR Ordering）、订单调度矩阵（KDS）、多维财务清算、合伙人联营逻辑以及基于物理层 RLS 安全审计的视觉资产管理。

---

## 🏗 项目架构 (Project Architecture)

```
根目录/
├── /src/                    # 前端核心（React + Vite + Tailwind）
│   ├── components/         # UI 组件
│   ├── services/           # Supabase 与 API 客户端（单例模式）
│   ├── types.ts            # TypeScript 类型定义
│   └── translations.ts     # 国际化翻译
├── /api/                   # 后端 Serverless 函数 (Vercel Runtime)
│   ├── index.ts           # 主 API 网关
│   └── auth/[...betterAuth].ts  # 认证路由
├── /drizzle/              # 数据库 Schema 与迁移定义
│   └── schema.ts          # 数据库表结构定义
├── /scripts/              # 数据库维护与校验工具
│   ├── init-db.ts         # 数据库初始化
│   ├── check-schema.ts    # Schema 一致性检查
│   └── ...
├── /components/           # 可复用 UI 组件
├── /services/             # 前端服务层
├── index.html             # HTML 模板
├── vite.config.ts         # 构建配置
└── package.json           # 依赖管理
```

---

## 🛠 核心技术架构 (Tech Stack)

-   **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
-   **Database**: Supabase (纯 PostgreSQL 数据库，不含认证)
-   **Auth**: Better-Auth (完全解耦，供应商无关)
-   **Infrastructure**: Vercel Edge Runtime (边缘中间件与 API 网关)
-   **ORM**: Drizzle ORM (物理层架构映射)

---

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

---

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

---

## 🚨 关键安全措施 (Security Measures)

-   根管理员保护：对特定邮箱地址的删除操作有硬编码保护
-   权限验证：所有 API 操作都会验证用户权限
-   SQL 注入防护：使用参数化查询和 ORM 层保护
-   XSS 防护：输入验证和输出转义
-   认证与业务分离：认证数据与业务数据存储分离

---

## 🌐 国际化支持 (Internationalization)

系统支持中文 (zh)、英文 (en) 和他加禄语 (fil) 三语切换，所有界面元素均支持动态语言切换。

---

## 🛠 维护与扩展 (Maintenance & Extensibility)

-   **数据库迁移**: 使用 Drizzle Kit 进行 Schema 管理
-   **实时功能**: 基于 Supabase Realtime 实现订单推送
-   **性能优化**: 代码分割、图片优化、数据缓存
-   **权限体系**: 四级用户角色 (ADMIN, PARTNER, STAFF, MAINTAINER)

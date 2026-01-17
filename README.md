
# 🏨 江西云厨终端系统 (JX CLOUD Terminal)

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Database](https://img.shields.io/badge/Backend-Supabase-emerald?style=flat-square&logo=supabase)](https://supabase.com)
[![Engine](https://img.shields.io/badge/Engine-React_19_|_Vite-blue?style=flat-square&logo=react)](https://react.dev)

> **江西云厨** 是一款专为现代化酒店设计的全栈管理生态系统。集成了客房实时点餐（QR Ordering）、订单调度矩阵（KDS）、多维财务清算、合伙人联营逻辑以及基于物理层 RLS 安全审计的视觉资产管理。

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

**注意**: 本项目采用认证与数据库解耦架构，Better Auth 负责认证，Supabase 仅提供数据库服务。

---

## 🔐 准入与权限说明 (Security)

### 根管理员 (Master Mode)
系统预留了由 **Athen Drakomin** 定义的上帝模式访问路径：
-   **授权邮箱**: `athendrakomin@proton.me`
-   **特性**: 触发此邮箱后，系统会自动激活“物理会话注入”，绕过常规登录流程进入最高权限终端。

### 合伙人隔离 (Partner Isolation)
-   **物理隔离**: 合伙人登录后，系统会自动根据其 `PartnerID` 对菜单、订单和流水进行物理层级过滤。
-   **清算逻辑**: 自动计算 T+1 佣金扣除后的待结余额。

---

## 💻 运营模块导览 (Operational Modules)

1.  **经营大盘 (Dashboard)**: 实时监控全网流水、待履约单数及商户健康度。
2.  **调度矩阵 (Order Matrix)**: 提供 KDS（厨房显示系统）模式，支持热敏打印自动分单。
3.  **资产档案 (Supply Chain)**: 管理全球化菜单，支持中英文双语对照与库存水位预警。
4.  **视觉中心 (Visual Assets)**: 直接连接 Supabase S3 存储网关，管理商品高清素材。
5.  **物理实验室 (Diagnostics)**: 系统内置链路检测工具，可一键修复 RLS 策略或重置缓存。

---

## 📦 备份与迁移

-   **导出**: 在“供应链资产 -> 备份”中可导出全量 JSON 档案。
-   **导入**: 支持跨环境的数据迁移，上传 `.json` 档案即可瞬间克隆菜单架构。

---

## 🏗 架构守则 (Architecture Rules)

### 前后端严格分离原则

**🚫 禁止行为**:
- 在任何前端组件中直接导入数据库驱动或连接 (`import { db } from '../services/db'`)
- 前端文件中使用 `pg`, `mysql`, `sqlite` 等数据库包
- 前端组件直接调用数据库查询语句

**✅ 正确模式**:
- 前端组件只能导入 API 客户端: `import { api } from '../services/api'`
- 通过标准 API 接口进行数据交互
- 使用 `fetch()` 或封装的 API 方法访问后端服务

**自动化检查**:
项目包含 `/tools` 目录下的扫描工具，可自动检测违反架构守则的导入行为：
```bash
# 快速检查非法导入
node tools/quick-vite-check.js

# 详细分析报告
node tools/smart-db-checker.js
```

### 技术边界定义

- **前端领域**: React 组件、UI 逻辑、状态管理、用户交互
- **后端领域**: 数据库连接、业务逻辑、API 路由、认证服务
- **通信桥梁**: 通过标准化 RESTful API 或 GraphQL 接口连接

---

## 📜 免责声明与版权

江西云厨终端系统由**系统研发部 (R&D Division)** 维护。所有代码经过多重 IP 协议保护，严禁用于非授权的物理商业环境。

© 2025 江西云厨系统研发部. All Rights Reserved.
# 🏨 江西云厨终端系统 (JX CLOUD Terminal)

[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-emerald?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Auth: Better--Auth](https://img.shields.io/badge/Auth-Better--Auth-blue?style=for-the-badge&logo=auth0)](https://better-auth.com)
[![Engine: React 19](https://img.shields.io/badge/Engine-React_19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

**江西云厨 (JX CLOUD)** 是一款专为超现代化酒店设计的全栈管理生态系统。本系统集成了客房点餐（QR Ordering）、订单调度矩阵（KDS）与财务审计中枢。基于 **PostgreSQL RLS (Row Level Security)** 实现物理级多租户隔离，确保联营商户数据的安全性与合规性。

---

## 💎 核心业务模块

*   **📈 经营大盘 (Dashboard)**：实时经营指标监控，支持联营商户 T+1 自动分账逻辑与流水趋势分析。
*   **🛎️ 桌位中枢 (Station Hub)**：全域 67+ 物理节点管控，支持二维码动态生成与桌面 POS 手动下单。
*   **👨‍🍳 调度矩阵 (Order Matrix)**：企业级 KDS 厨房显示系统，支持热敏打印自动分单与履约状态追踪。
*   **📦 供应链资产 (Supply Chain)**：高精度物料库存预警，中英文双语菜品档案，支持全局数据一键备份/恢复。
*   **🖼️ 视觉中心 (Visual Assets)**：基于 Supabase S3 协议的云端图库，为商品档案提供高性能视觉资源支持。
*   **🔐 组织授权 (RBAC)**：细粒度的模块级权限控制（C/R/U/D），支持生物识别（Passkey）零密码准入。

---

## 🛡️ 安全架构 (Security & RLS)

系统采用 **物理层隔离 (Physical Isolation)** 策略：

1.  **行级安全 (RLS)**：所有业务表（Dishes, Orders, Expenses）强制绑定 `partner_id`。
2.  **JWT 物理锚点**：数据库自动提取 `auth.jwt() -> 'partner_id'`，非管理员用户无法越权访问其它商户数据。
3.  **运行时对齐**：使用 Drizzle ORM 推导类型，确保前端 `camelCase` 属性与数据库 `snake_case` 列名 100% 镜像映射。
4.  **生物识别 (Passkey)**：全面集成 FIDO2 标准，支持指纹/面部识别替代传统密码。

---

## 🛰️ API 概览 (API Blueprint)

### 1. 认证与准入 (Auth API)
*   `/api/auth/sign-in`：传统登录/生物识别握手。
*   `/api/auth/passkey/*`：FIDO2 凭证注册与挑战验证。
*   `/api/auth/session`：高安全性会话管理。

### 2. 系统诊断 (System API)
*   `/api/health`：Edge 节点健康检查。
*   `/api/db-check`：数据库延迟与 RLS 策略合规性实时审计。
*   `/api/system/status`：系统运行快照（订单量、连接数）。

### 3. 数据网关 (Business API)
通过 `services/api.ts` 统一调用的核心接口：
*   **配置**：`api.config.get()` / `update()` - 全局店名、主题、字体族。
*   **菜品**：`api.dishes.getAll()` / `create()` / `update()` - 物理隔离菜单库。
*   **订单**：`api.orders.create()` / `updateStatus()` - 实时流水。
*   **财务**：`api.expenses.getAll()` / `partners.getAll()` - 结算与支出。
*   **用户**：`api.users.upsert()` - 业务用户与认证用户双表同步。

---

## 🚀 技术栈 (Tech Stack)

-   **Frontend**: React 19 (Strict Mode) + Tailwind CSS + Lucide Icons.
-   **Backend**: Supabase (PostgreSQL 15 / Edge Functions / Storage S3).
-   **Auth**: Better-Auth (Passkey / Multi-Factor).
-   **ORM**: Drizzle ORM (Schema-first definition).
-   **Realtime**: Supabase Realtime (Websocket channel for KDS).

---

## 📦 部署与开发 (Deployment)

### 环境变量 (Critical)
| 变量名 | 描述 |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase 访问网关 |
| `VITE_SUPABASE_ANON_KEY` | 前端匿名 Key |
| `DATABASE_URL` | Drizzle 物理连接（端口 6543 事务池） |
| `BETTER_AUTH_SECRET` | 会话签名密钥（32位） |

### 初始化步骤
1.  执行 `database_setup.sql` 激活 RLS 策略。
2.  访问 `/auth/admin-setup` 绑定首个根管理员（Root）生物凭证。
3.  通过 `Supply Chain -> Categories` 部署分类架构。

---

**© 2025 江西云厨系统研发部. 保留所有权利。**
# 🏨 江西云厨终端系统 (JX CLOUD Terminal)

[![Deployment: Supabase](https://img.shields.io/badge/Deployment-Supabase-black?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![Auth: Better--Auth](https://img.shields.io/badge/Auth-Better--Auth-blue?style=for-the-badge&logo=auth0)](https://better-auth.com)
[![Engine: React 19](https://img.shields.io/badge/Engine-React_19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)

**江西云厨 (JX CLOUD)** 是一款专为超现代化酒店设计的全栈管理生态系统。本系统集成了客房点餐（QR Ordering）、订单调度矩阵（KDS）与财务审计中枢。基于 **PostgreSQL RLS (Row Level Security)** 实现物理级多租户隔离，确保联营商户数据的安全性与合规性。

**全新架构**: 统一采用 Supabase Edge Functions 作为 API 网关，结合 Better-Auth 生物识别认证，实现全球边缘部署和毫秒级响应。

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

系统采用 **边缘计算安全架构**：

1.  **统一API网关**: 所有请求通过 Supabase Edge Functions 处理，实现全球就近接入。
2.  **行级安全 (RLS)**：所有业务表（Dishes, Orders, Expenses）强制绑定 `partner_id`。
3.  **JWT 物理锚点**：数据库自动提取 `auth.jwt() -> 'partner_id'`，非管理员用户无法越权访问其它商户数据。
4.  **运行时对齐**：使用 Drizzle ORM 推导类型，确保前端 `camelCase` 属性与数据库 `snake_case` 列名 100% 镜像映射。
5.  **生物识别 (Passkey)**：全面集成 FIDO2 标准，支持指纹/面部识别替代传统密码。

---

## 🛰️ API 架构 (API Architecture)

### 统一边缘API网关 (Unified Edge API Gateway)
所有API请求统一通过 **Supabase Edge Functions** 处理：
- **主入口**: `supabase/functions/api.ts` - 处理所有业务逻辑
- **认证服务**: `supabase/functions/auth.ts` - Better-Auth集成
- **注册管理**: 支持用户注册审批流程

### 1. 认证与准入 (Auth API)
*   `/api/auth/sign-in`：传统登录/生物识别握手。
*   `/api/auth/passkey/*`：FIDO2 凭证注册与挑战验证。
*   `/api/auth/session`：高安全性会话管理。
*   `/api/auth/request-registration`：用户注册申请。
*   `/api/auth/approve-registration`：管理员审批注册。

### 2. 系统诊断 (System API)
*   `/api/health`：边缘节点健康检查。
*   `/api/db-check`：数据库延迟与 RLS 策略合规性实时审计。
*   `/api/system/status`：系统运行快照（订单量、连接数）。

### 3. 数据网关 (Business API)
通过边缘函数统一调用的核心接口：
*   **配置**：`api.config.get()` / `update()` - 全局店名、主题、字体族。
*   **菜品**：`api.dishes.getAll()` / `create()` / `update()` - 物理隔离菜单库。
*   **订单**：`api.orders.create()` / `updateStatus()` - 实时流水。
*   **财务**：`api.expenses.getAll()` / `partners.getAll()` - 结算与支出。
*   **用户**：`api.users.upsert()` - 业务用户与认证用户双表同步。

---

## 🚀 技术栈 (Tech Stack)

-   **Frontend**: React 19 (Strict Mode) + Tailwind CSS + Lucide Icons
-   **Backend**: Supabase Edge Functions (全球边缘部署) + PostgreSQL 15 + Storage S3
-   **Auth**: Better-Auth with Passkey/FIDO2 biometric support
-   **ORM**: Drizzle ORM (Schema-first definition)
-   **Realtime**: Supabase Realtime (WebSocket channels for KDS)
-   **Architecture**: Unified Edge Computing with automatic scaling

## 📁 项目结构 (Project Structure)

```
jx-cloud-enterprise-hospitality-suite/
├── src/                    # 前端代码 (React Components & Services)
│   ├── components/        # React 组件
│   ├── constants/         # 前端常量
│   └── services/
│       └── frontend/      # 前端专用服务
├── services/              # 后端服务 (Node.js 环境)
│   ├── auth-server.ts     # Better-Auth 服务端
│   ├── db.server.ts       # 数据库连接
│   └── api.ts             # API 服务层
└── supabase/functions/    # Supabase Edge Functions (统一API网关)
    ├── api.ts             # 主API网关
    └── auth.ts            # 认证服务
```

---

## 📦 部署与开发 (Deployment)

### 环境变量 (Critical)
| 变量名 | 描述 |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase 访问网关 |
| `VITE_SUPABASE_ANON_KEY` | 前端匿名 Key |
| `DATABASE_URL` | Drizzle 物理连接（端口 6543 事务池） |
| `BETTER_AUTH_SECRET` | 会话签名密钥（32位） |

### 开发命令
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 部署边缘函数
supabase functions deploy
```

### 初始化步骤
1.  执行 `database_setup.sql` 激活 RLS 策略。
2.  访问 `/auth/admin-setup` 绑定首个根管理员（Root）生物凭证。
3.  通过 `Supply Chain -> Categories` 部署分类架构。
4.  配置 Supabase Edge Functions 环境变量。

---

**© 2025 江西云厨系统研发部. 保留所有权利。**
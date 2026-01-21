# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 项目概述

**江西云厨 (JX CLOUD)** 是一款专为现代化酒店设计的全栈管理生态系统。系统集成了客房点餐（QR Ordering）、订单调度矩阵（KDS）与财务审计中枢。基于 PostgreSQL RLS (Row Level Security) 实现物理级多租户隔离，确保联营商户数据的安全性与合规性。

## 项目概述

**江西云厨 (JX CLOUD)** 是一款专为现代化酒店设计的全栈管理生态系统。系统集成了客房点餐（QR Ordering）、订单调度矩阵（KDS）与财务审计中枢。基于 PostgreSQL RLS (Row Level Security) 实现物理级多租户隔离，确保联营商户数据的安全性与合规性。

## 架构概览

### 技术栈
- **前端**: React 19 (Strict Mode) + Vite + Tailwind CSS + Lucide Icons
- **后端**: Supabase Edge Functions + PostgreSQL 15 + Storage S3
- **认证**: Better-Auth with Passkey/FIDO2 生物识别支持
- **ORM**: Drizzle ORM (Schema-first 定义)
- **实时通信**: Supabase Realtime (WebSocket channels for KDS)
- **架构**: 统一边缘计算与自动扩展
- **测试**: Jest + React Testing Library + jsdom
- **类型检查**: TypeScript (严格模式)

### 核心模块
- **仪表盘 (Dashboard)**: 实时业务指标监控，支持联营商户T+1自动结算逻辑
- **工位中心 (Station Hub)**: 67+ 物理节点管控，支持二维码动态生成
- **调度矩阵 (Order Matrix)**: 企业级KDS厨房显示系统，支持热敏打印自动分单
- **供应链资产 (Supply Chain)**: 高精度库存预警，中英文双语菜品档案
- **视觉资源 (Visual Assets)**: 基于Supabase S3协议的云端图库
- **组织授权 (RBAC)**: 细粒度的模块级权限控制，支持生物识别认证

### 项目结构
```
jx-cloud-enterprise-hospitality-suite/
├── src/                          # 前端代码 (React Components & Services)
│   ├── components/               # React 组件 (主要业务组件)
│   │   ├── AuthPage.tsx          # 认证页面
│   │   ├── Dashboard.tsx         # 仪表盘
│   │   ├── MenuManagement.tsx    # 菜品管理
│   │   ├── OrderManagement.tsx   # 订单管理
│   │   ├── SupplyChainManager.tsx # 供应链管理
│   │   ├── SystemSettings.tsx    # 系统设置
│   │   ├── StaffManagement.tsx   # 员工管理
│   │   ├── RoomGrid.tsx          # 房间网格管理
│   │   ├── PaymentManagement.tsx # 支付管理
│   │   ├── PartnerManagement.tsx # 合作伙伴管理
│   │   ├── InventoryManagement.tsx # 库存管理
│   │   ├── ImageLibrary.tsx      # 图片库
│   │   ├── GuestOrder.tsx        # 客户订单
│   │   ├── FinanceManagement.tsx # 财务管理
│   │   └── ...                   # 其他核心组件
│   ├── constants/                # 前端常量定义
│   ├── services/                 # 前端服务层
│   │   ├── frontend/             # 前端专用服务
│   │   │   ├── notification.frontend.ts  # 通知服务
│   │   │   ├── s3Service.frontend.ts     # S3存储服务
│   │   │   └── auth-client.frontend.ts   # 认证客户端
│   │   ├── supabaseClient.ts     # Supabase客户端
│   │   ├── i18n.ts               # 国际化服务
│   │   └── api.ts                # API服务封装
│   ├── types/                    # TypeScript 类型定义
│   ├── utils/                    # 工具函数
│   └── solutions/                # 解决方案脚本
├── services/                     # 后端服务 (Node.js 环境)
│   ├── auth-server.ts            # Better-Auth 服务端配置
│   ├── db.server.ts              # 数据库连接配置
│   ├── api.ts                    # API 服务层封装
│   ├── notification.ts           # 通知服务
│   ├── s3Service.ts              # S3存储服务
│   └── auth-client.ts            # 认证客户端
├── supabase/functions/           # Supabase Edge Functions (统一API网关)
│   ├── api/                      # 主API网关入口
│   │   └── index.ts              # API路由处理器
│   ├── auth/                     # 认证相关函数
│   │   └── index.ts              # 认证路由处理器
│   ├── better-auth/              # Better-Auth 集成
│   │   └── index.ts              # Better-Auth集成
│   └── i18n/                     # 国际化服务
│       └── index.ts              # 国际化处理器
├── database/                     # 数据库迁移和初始化脚本
├── drizzle/                      # Drizzle ORM 配置和迁移文件
├── public/                       # 静态资源文件
├── docs/                         # 项目文档
├── shared/                       # 共享代码和类型
└── scripts/                      # 开发和部署脚本
```

### 安全架构
- **统一API网关**: 所有请求通过Supabase Edge Functions处理
- **行级安全 (RLS)**: 所有业务表强制绑定`partner_id`
- **JWT物理锚点**: 数据库自动提取`auth.jwt() -> 'partner_id'`
- **运行时对齐**: 使用Drizzle ORM确保前后端大小写映射
- **生物识别认证**: 全面集成FIDO2标准

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 预览生产构建
npm run preview

# 运行测试
npm run test

# 运行特定测试文件
npm run test -- src/components/__tests__/Dashboard.test.tsx

# 监视模式下运行测试
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 部署边缘函数
supabase functions deploy

# 部署特定边缘函数
supabase functions deploy api
supabase functions deploy auth

# 数据库迁移
npx drizzle-kit generate # 生成迁移
npx drizzle-kit migrate  # 执行迁移
npx drizzle-kit studio   # 启动数据库可视化工具

# 本地Supabase开发
supabase start           # 启动本地Supabase
supabase stop            # 停止本地Supabase
supabase status          # 查看本地服务状态
```

## 数据库设置

1. 执行 `database_setup.sql` 激活RLS策略
2. 访问 `/auth/admin-setup` 绑定首个根管理员生物凭证
3. 通过 `Supply Chain -> Categories` 部署分类架构
4. 配置Supabase Edge Functions环境变量

## 环境变量

| 变量名 | 描述 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase访问网关 |
| `VITE_SUPABASE_ANON_KEY` | 前端匿名Key |
| `DATABASE_URL` | Drizzle物理连接（端口6543事务池） |
| `BETTER_AUTH_SECRET` | 会话签名密钥（32位） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase服务角色密钥（Edge Functions） |
| `BETTER_AUTH_URL` | Better-Auth服务URL |

## API 结构

### 统一边缘API网关
所有API请求统一通过 **Supabase Edge Functions** 处理 (`supabase/functions/api/index.ts`)：

- `/api/health`: 边缘节点健康检查
- `/api/db-check`: 数据库延迟与RLS策略合规性实时审计
- `/api/system/status`: 系统运行快照（订单量、连接数）
- `/api/config/*`: 全局配置管理
- `/api/dishes/*`: 菜品管理（物理隔离菜单库）
- `/api/orders/*`: 订单管理（实时流水）
- `/api/users/*`: 业务用户管理
- `/api/partners/*`: 联营商户管理
- `/api/expenses/*`: 财务支出管理

### 认证API
通过Better-Auth处理 (`supabase/functions/auth/`):
- `/api/auth/sign-in`: 传统登录/生物识别握手
- `/api/auth/passkey/*`: FIDO2凭证注册与挑战验证
- `/api/auth/session`: 高安全性会话管理
- `/api/auth/request-registration`: 用户注册申请
- `/api/auth/approve-registration`: 管理员审批注册

## 测试框架

- **测试运行器**: Jest with ts-jest
- **测试库**: React Testing Library, DOM Testing Library
- **测试环境**: jsdom
- **覆盖率**: lcov, text, html 报告
- **测试位置**: 符合 `**/__tests__/**/*.(ts|tsx|js)` 和 `**/?(*.)+(spec|test).(ts|tsx|js)` 模式的文件
- **Mock配置**: 
  - CSS/Less/Sass文件自动mock为identity-obj-proxy
  - 静态资源文件mock为文件路径
  - 支持ESM模块转换

## 调试技巧

1. 使用浏览器开发者工具检查网络请求和错误
2. 查看Supabase控制台的日志和监控
3. 使用 `DebugTools.tsx` 组件进行运行时调试
4. 检查浏览器控制台中的类型错误和警告
5. 使用 `src/utils/` 目录下的诊断工具：
   - `network-diagnosis.ts`: 网络连接诊断
   - `environment-check.ts`: 环境变量检查
   - `registration-diagnostic.ts`: 注册流程诊断
6. 利用React DevTools检查组件状态和props
7. 使用Supabase本地开发环境进行离线调试

## 常见开发任务

### 创建新组件
1. 在 `src/components/` 目录下创建新的组件文件
2. 使用现有的类型定义和常量
3. 遵循现有的组件模式和样式约定
4. 为组件添加对应的测试文件在 `__tests__` 目录下

### 添加API端点
1. 在 `supabase/functions/api/index.ts` 中添加新的路由处理器
2. 更新相应的类型定义
3. 确保RLS策略正确应用
4. 添加对应的前端服务方法在 `src/services/api.ts`

### 数据库变更
1. 修改 `schema.ts` 文件中的Drizzle模式定义
2. 运行 `npx drizzle-kit generate` 生成迁移文件
3. 运行 `npx drizzle-kit migrate` 应用迁移
4. 更新相关的类型定义文件

### 国际化支持
1. 在 `translations.ts` 中添加新的翻译键值对
2. 使用 `DynamicT` 组件或 `t()` 函数在组件中引用翻译
3. 确保支持中英文双语

## 常见问题解决

### 类型错误
- 运行 `npm run type-check` 查看完整类型错误列表
- 检查 `types.ts` 和 `types_database_aligned.ts` 文件的一致性
- 确保Drizzle schema与前端类型保持同步

### 认证问题
- 检查 `BETTER_AUTH_SECRET` 环境变量是否正确配置
- 验证Supabase JWT配置和RLS策略
- 使用 `AdminSetup.tsx` 组件重新配置管理员账户

### 数据库连接
- 确认 `DATABASE_URL` 指向正确的端口(6543)
- 检查Supabase本地开发环境是否正常运行
- 验证RLS策略是否正确激活

### 边缘函数部署
- 确保所有环境变量已在Supabase项目中配置
- 检查函数依赖是否正确声明
- 验证函数冷启动时间和执行超时设置

## 调试技巧

1. 使用浏览器开发者工具检查网络请求和错误
2. 查看Supabase控制台的日志和监控
3. 使用 `DebugTools.tsx` 组件进行运行时调试
4. 检查浏览器控制台中的类型错误和警告

## 部署注意事项

1. 确保所有环境变量已正确配置
2. 验证RLS策略在生产环境中正常工作
3. 测试所有认证流程包括生物识别
4. 验证边缘函数的全球部署状态
5. 检查性能指标和错误率
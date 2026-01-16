# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 🏨 项目概述

这是一个名为"江西云厨"的现代化酒店管理生态系统，采用全栈架构设计，包含客房点餐、订单管理、财务管理等核心功能。该系统专门针对现代化酒店运营需求设计，集成了客房实时点餐（QR Ordering）、订单调度矩阵（KDS）、多维财务清算等功能。

## 🛠 核心技术栈

- **前端框架**: React 19 + TypeScript + Vite
- **样式方案**: Tailwind CSS
- **后端服务**: Supabase (仅作为 PostgreSQL 数据库)
- **认证系统**: Better-Auth (完全解耦，供应商无关，数据存储在 Supabase)
- **部署平台**: Vercel Edge Runtime
- **图标库**: Lucide React
- **图表库**: Recharts
- **数据库工具**: Drizzle ORM
- **状态管理**: React hooks + Supabase Realtime
- **构建工具**: Vite with custom chunk splitting for optimized loading

## 📁 项目架构

```
根目录/
├── components/          # React组件 (30+个业务组件)
├── services/           # 核心服务层
│   ├── api.ts         # 数据网关 (统一API接口)
│   ├── auth.ts        # 认证逻辑
│   ├── auth-client.ts # 客户端认证
│   ├── supabaseClient.ts  # 数据库客户端
│   ├── notification.ts    # 通知服务
│   ├── s3Service.ts       # 文件存储服务
│   └── db.ts              # 数据库连接
├── api/                # API路由 (服务器端)
├── scripts/            # 数据库初始化脚本
├── constants.ts       # 初始数据常量
├── types.ts          # TypeScript类型定义
├── translations.ts   # 国际化翻译
├── App.tsx          # 主应用入口
├── GuestEntry.tsx   # 客户端点餐入口
└── index.html       # HTML模板
```

## 🚀 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 数据库迁移 (开发)
npm run db:generate
npm run db:migrate

# 数据库推送 (直接推送到数据库)
npm run db:push

# 初始化数据库表结构
npm run db:init

# 初始化用户数据
npm run users:init

# 生成新的迁移文件
npx drizzle-kit generate --out ./drizzle --schema ./schema.ts

# 运行迁移
npx drizzle-kit migrate --config=drizzle.config.ts
```

## 🗄️ 数据库配置

### 连接到 Supabase

1. **获取 Supabase 凭据**
   - 访问 [Supabase Dashboard](https://app.supabase.com/projects) 获取您的项目凭据
   - 项目 URL (VITE_SUPABASE_URL) - 如 `https://your-project-id.supabase.co`
   - 匿名密钥 (VITE_SUPABASE_ANON_KEY) - 在 Project Settings > API 中找到
   - 数据库密码 (DATABASE_URL) - 在 Project Settings > Database 中找到

2. **Vercel 部署配置**
   - 在 Vercel 项目中关联 Supabase，会自动注入 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
   - 仅需手动添加 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` 和 `VITE_BETTER_AUTH_URL`

3. **本地开发环境配置**
   - 在 `.env` 文件中设置与线上相同的配置
   - 确保获取真实的 ANON key 替换占位符

4. **初始化数据库表**
   - 在 Supabase SQL 编辑器中执行 `database_setup.sql` 内容
   - 创建所有必需的表、RLS 策略和初始数据
   - 激活实时复制频道: ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

5. **本地开发注意事项**
   - 认证与数据库完全解耦：Better Auth 负责认证，Supabase 仅提供数据库服务
   - 本地开发时需要手动配置所有环境变量
   - 生产环境 (Vercel) 会自动注入 Supabase 相关变量

## 🏗 核心架构特点

### 1. 数据流架构
- 使用 `services/api.ts` 作为统一数据网关
- 所有组件通过 `api.[模块].[方法]` 访问数据
- 支持演示模式和生产模式切换
- 演示模式下使用本地常量数据，生产模式连接Drizzle ORM (直连PostgreSQL)
- 认证与数据库完全解耦：Better Auth负责认证，Drizzle ORM负责数据库操作
- 实时功能仍使用Supabase (仅用于监听)，数据库操作已完全迁移到Drizzle
- 用户数据双重架构：`user` 表用于认证系统，`users` 表用于业务逻辑

### 2. 权限体系
- 四种用户角色: ADMIN, PARTNER, STAFF, MAINTAINER
- 合伙人数据物理隔离 (通过partner_id过滤)
- 根管理员特殊权限 (`athendrakomin@proton.me`) - 可通过本地存储绕过认证
- 模块级权限控制
- 细粒度CRUD权限管理

### 3. 实时通信
- 基于Supabase Realtime实现订单实时推送
- WebSocket订阅机制
- 语音播报和桌面通知集成
- 自动打印订单功能

### 4. 组件组织
主要业务模块包括:
- Dashboard (经营大盘)
- RoomGrid (客房管理)
- OrderManagement (订单调度)
- SupplyChainManager (供应链)
- FinancialCenter (财务中心)
- StaffManagement (员工管理)
- ImageManagement (图片管理)
- SystemSettings (系统设置)
- CommandCenter (命令中心)
- DatabaseManagement (数据库管理)

### 5. 国际化支持
- 支持中文(zh)和英文(en)双语
- 动态语言切换功能
- 集中式翻译管理
- 翻译文件位于 `translations.ts`，包含完整的中英文对照
- 支持参数化翻译 (使用 `{paramName}` 语法)
- 翻译函数 `getTranslation(lang, key, params?)` 在 `translations.ts` 中定义
- 界面元素现已全部支持中英文翻译

### 6. 客户端点餐流程
- 通过 GuestEntry.tsx 处理客户点餐流程
- 支持通过 `?room=xxx` URL 参数直接访问指定房间
- 无需登录即可浏览菜单、选择菜品、下单支付

## 🔧 开发注意事项

### 数据库操作规范
- 所有数据库操作必须通过 `services/api.ts` 服务层 (使用Drizzle ORM)
- 合伙人相关查询需添加 `partner_id` 过滤条件
- 删除操作前需检查根管理员保护逻辑
- 使用Drizzle ORM进行类型安全的数据库操作
- 环境变量检查：优先查找 POSTGRES_URL、DATABASE_URL、POSTGRES_PRISMA_URL 或 POSTGRES_URL_NON_POOLING
- 生产环境强制使用Drizzle直连，废弃Supabase客户端的数据库操作功能

### 组件开发原则
- 组件间通过props传递数据和回调函数
- 使用TypeScript严格类型检查
- 国际化通过 `getTranslation()` 函数处理
- 使用ErrorBoundary进行错误边界处理
- 遵循React最佳实践，合理使用useMemo/useCallback优化性能

### 实时功能开发
- 新增实时监听需在 `useEffect` 中注册channel
- 记得在组件卸载时清理订阅
- 参考 `App.tsx` 中的订单实时监听实现

### 认证与安全
- 使用Better-Auth进行身份验证
- 根管理员可通过本地存储绕过认证 (`jx_root_authority_bypass`)
- 用户权限在服务层进行验证
- 敏感操作需要权限检查
- 认证数据存储在 Supabase 数据库中（`user` 和 `session` 表）
- 业务用户数据存储在 `users` 表中，与认证数据分离但关联
- 不开放公共注册，用户由 admin 角色在管理界面创建
- 新用户通过管理员创建后收到链接进行生物识别绑定（指纹或人脸）

### 数据库表结构
- `user` 表：Better Auth 内部使用，存储认证相关信息
- `users` 表：业务逻辑使用，存储应用特定的用户信息
- `orders` 表：存储客户订单信息，关联房间号和支付状态
- `rooms` 表：存储房间信息，用于点餐和状态管理
- `menu_dishes` 表：存储菜单菜品信息 (字段: id, name, name_en, description, tags, price, category, stock, image_url, is_available, is_recommended, partner_id)
- `menu_categories` 表：存储分类信息 (字段: id, name, name_en, code, level, display_order, is_active, parent_id, partner_id)
- `system_config` 表：存储系统全局配置
- `partners` 表：存储合作伙伴信息
- `expenses` 表：存储支出记录
- `payment_methods` 表：存储支付方式配置
- `ingredients` 表：存储食材信息
- 两表通过用户 ID 关联，实现认证与业务逻辑的解耦

### 用户注册流程
1. **管理员创建**：Admin 在管理界面创建用户账号，信息存储在 `users` 表
2. **首次登录**：用户使用管理员提供的凭证首次登录，Better Auth 创建认证记录
3. **生物识别绑定**：用户在个人设置中绑定指纹或人脸识别信息
4. **后续认证**：用户可通过生物识别或传统凭证登录

### 客户点餐流程
1. **二维码访问**：客户扫描房间二维码，通过 `?room=xxx` URL 参数进入点餐界面
2. **匿名点餐**：无需登录即可浏览菜单、选择菜品、下单支付
3. **订单提交**：订单信息存储到 `orders` 表，关联房间号
4. **实时通知**：通过 Supabase Realtime 推送订单到管理端
5. **自动打印**：系统根据配置自动向厨房打印机发送小票
6. **消息提醒**：管理端收到桌面通知和语音提醒

### 商品管理流程
1. **菜单管理**：通过 SupplyChainManager 统一管理菜品和分类
2. **分类层级**：支持最多三级分类架构，动态排序和展示
3. **图片管理**：集成 Supabase Storage 图片上传，支持 URL 复制
4. **权限控制**：Admin 可以管理所有商品，合伙人只能管理自己的商品
5. **中英切换**：所有界面和商品信息支持中英文实时切换
6. **房间下单**：支持在房间界面手动下单，数据实时同步到订单系统

## 🎯 常见开发场景

### 添加新业务模块
1. 在 `types.ts` 中定义相关类型
2. 在 `services/api.ts` 中添加对应的服务方法
3. 创建新的组件文件
4. 在 `App.tsx` 中注册路由和导航
5. 更新侧边栏菜单项
6. 添加相应的权限控制

### 修改数据库结构
1. 更新 `database_setup.sql` 脚本
2. 在 `schema.ts` 中同步类型定义
3. 更新 `services/api.ts` 中的相关方法
4. 修改对应的组件UI
5. 生成并运行数据库迁移

### 添加国际化文本
1. 在 `translations.ts` 中添加键值对
2. 在组件中使用 `t('key')` 调用翻译
3. 支持中文(zh)和英文(en)两种语言

### 部署问题解决
1. 修复导入路径错误：`../translations` → `./translations`
2. 安装缺失依赖：`better-auth`, `drizzle-orm`, `react-hook-form`, `postgres`
3. 修复TypeScript类型错误和API调用不兼容问题
4. 调整构建配置以确保Vercel部署顺利
5. 解决CategoryManagement.tsx中的control属性传递问题
6. 修复SystemSettings.tsx中的API返回类型处理
7. 优化构建脚本：跳过TypeScript检查以加速Vercel部署 ("tsc --noEmit" removed from build script)
8. 解决模块解析错误：将dishesData内联到constants.ts中，避免因.veignore排除api/init-dishes.ts导致的构建失败

### 环境变量配置
- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_ANON_KEY`: Supabase匿名密钥
- `DATABASE_URL`: PostgreSQL数据库连接字符串
- `BETTER_AUTH_SECRET`: 认证密钥
- `VITE_BETTER_AUTH_URL`: 生产环境完整域名
- `NODE_ENV`: 环境标识 (development/production)

## 🧪 测试与质量保证

目前项目未包含单元测试框架，如需添加测试：
- 推荐使用Vitest + React Testing Library
- 为API服务层编写集成测试
- 为组件编写单元测试
- 添加端到端测试使用Playwright

## 📊 性能优化

- 代码分割：Vite自动分割vendor包，自定义chunk策略优化加载
- 图片优化：使用OptimizedImage组件
- 数据缓存：合理使用useMemo和useCallback
- 分页加载：大数据列表分页处理
- 实时连接：智能订阅管理，减少不必要的实时更新
- 组件懒加载：关键路径优先加载，非关键组件按需加载

## 🚨 重要安全措施

- 根管理员保护：对特定邮箱地址的删除操作有硬编码保护
- 权限验证：所有API操作都会验证用户权限
- SQL注入防护：使用参数化查询和ORM层保护
- XSS防护：输入验证和输出转义
- 认证与业务分离：认证数据与业务数据存储分离

## 🌐 国际化开发指南

### Translation Management
- All UI text is managed in `translations.ts`
- Two languages supported: Chinese (zh) and English (en)
- New translations should be added to both language objects
- Use `t('key')` function in components to access translations
- Parameter substitution uses `{paramName}` syntax

### Adding New Translations
1. Add the translation key-value pair to both zh and en objects in `translations.ts`
2. Use the `getTranslation(lang, key, params?)` function or `t('key')` helper in components
3. For parameterized translations, use format: `t('key', { paramName: value })`

### Internationalization Notes
All UI elements are now fully translated between Chinese and English:
- All interface text is now properly localized using translation keys
- Components use the t('key') function for dynamic translations
- Both zh and en language variants are maintained in translations.ts
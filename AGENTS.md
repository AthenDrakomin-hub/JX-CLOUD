# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 🏨 项目概述

这是一个名为"江西云厨"的现代化酒店管理生态系统，采用全栈架构设计，包含客房点餐、订单管理、财务管理等核心功能。

## 🛠 核心技术栈

- **前端框架**: React 19 + TypeScript + Vite
- **样式方案**: Tailwind CSS
- **后端服务**: Supabase (PostgreSQL + Realtime + Storage)
- **认证系统**: Better-Auth (支持生物识别)
- **部署平台**: Vercel Edge Runtime
- **图标库**: Lucide React
- **图表库**: Recharts

## 📁 项目架构

```
src/
├── components/          # React组件 (20+个业务组件)
├── services/           # 核心服务层
│   ├── api.ts         # 数据网关 (统一API接口)
│   ├── auth.ts        # 认证逻辑
│   ├── supabaseClient.ts  # 数据库客户端
│   └── notification.ts    # 通知服务
├── constants.ts       # 初始数据常量
├── types.ts          # TypeScript类型定义
└── translations.ts   # 国际化翻译
```

## 🚀 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🏗 核心架构特点

### 1. 数据流架构
- 使用 `api.ts` 作为统一数据网关
- 所有组件通过 `api.[模块].[方法]` 访问数据
- 支持演示模式和生产模式切换

### 2. 权限体系
- 三种用户角色: ADMIN, PARTNER, STAFF
- 合伙人数据物理隔离
- 根管理员特殊权限 (`athendrakomin@proton.me`)

### 3. 实时通信
- 基于Supabase Realtime实现订单实时推送
- WebSocket订阅机制
- 语音播报和桌面通知集成

### 4. 组件组织
主要业务模块包括:
- Dashboard (经营大盘)
- RoomGrid (客房管理)
- OrderManagement (订单调度)
- SupplyChainManager (供应链)
- FinancialCenter (财务中心)
- StaffManagement (员工管理)

## 🔧 开发注意事项

### 数据库操作规范
- 所有数据库操作必须通过 `api.ts` 服务层
- 合伙人相关查询需添加 `partner_id` 过滤条件
- 删除操作前需检查根管理员保护逻辑

### 组件开发原则
- 组件间通过props传递数据和回调函数
- 使用TypeScript严格类型检查
- 国际化通过 `getTranslation()` 函数处理

### 实时功能开发
- 新增实时监听需在 `useEffect` 中注册channel
- 记得在组件卸载时清理订阅
- 参考 `App.tsx` 中的订单实时监听实现

## 🎯 常见开发场景

### 添加新业务模块
1. 在 `types.ts` 中定义相关类型
2. 在 `api.ts` 中添加对应的服务方法
3. 创建新的组件文件
4. 在 `App.tsx` 中注册路由和导航

### 修改数据库结构
1. 更新 `database_setup.sql` 脚本
2. 在 `schema.ts` 中同步类型定义
3. 更新 `api.ts` 中的相关方法
4. 修改对应的组件UI

### 添加国际化文本
1. 在 `translations.ts` 中添加键值对
2. 在组件中使用 `t('key')` 调用翻译
3. 支持中文(zh)和英文(en)两种语言
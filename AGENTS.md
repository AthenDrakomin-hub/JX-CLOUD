# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

JX CLOUD (江西云厨) is an enterprise-level hospitality management suite built with React 19 and Supabase. It provides a comprehensive system for hotels, restaurants, and resorts with features including room management, order processing, menu management, staff management, and financial tracking.

## Architecture

- **Frontend**: React 19 with TypeScript
- **Backend**: Supabase (PostgreSQL database with real-time capabilities)
- **UI Components**: React components with Lucide icons
- **State Management**: React hooks and local state (no Redux/Zustand)
- **Build Tool**: Vite
- **Database**: PostgreSQL via Supabase with RLS (Row Level Security)

## Key Components

- **App.tsx**: Main application with dashboard, room grid, order management, menu management, etc.
- **Services**: API service, Supabase client, notification service, AI service
- **Components**: Modular UI components for each feature area (Dashboard, RoomGrid, OrderManagement, MenuManagement, etc.)

## Database Schema

The system uses a Supabase PostgreSQL database with these main tables:
- `users`: Staff/employee management with role-based access
- `rooms`: Room/table management (64 pre-configured rooms: 8201-8232 and 8301-8332)
- `dishes`: Menu items with pricing, categories, availability
- `orders`: Order tracking with status management
- `expenses`: Operational expense tracking
- `security_logs`: Audit logs for sensitive operations

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `API_KEY`: Gemini API key (for AI features)

## Key Features

- Real-time order tracking and management
- Multi-language support (Chinese, English, and Tagalog)
- Role-based access control (admin, manager, staff)
- Financial management and expense tracking
- Menu management with inventory
- Room/table status management
- Security audit logging for sensitive operations
- Mobile-responsive design

## Authentication

The system uses simulated authentication in the frontend with:
- Admin user: username 'admin1', password 'admin123'
- Staff user: username 'staff1', password 'staff123'

## Security

- Row Level Security (RLS) policies in Supabase
- Automatic security logging for sensitive operations
- Role-based permissions system
- Client-side validation and sanitization

## Important Files

- `App.tsx`: Main application component
- `services/api.ts`: All API calls and security logging
- `services/supabaseClient.ts`: Database connection
- `types.ts`: TypeScript interfaces and enums
- `components/`: All UI components
- `README.md`: Database initialization scripts
- 项目文档体系构建指南

## 文档分类与编写要求

### 1. 核心交付文档（面向客户/最终用户）
**目标用户**：酒店管理人员、前台操作员、系统使用者
**编写要求**：语言简洁明了，避免技术术语，配图说明操作步骤

- 《用户操作手册》
  - 包含各功能模块的详细操作步骤
  - 房间管理、订单处理、菜单配置等核心功能说明
  - 常用操作的快捷方式和技巧

- 《系统管理员手册》
  - 用户权限管理、角色配置说明
  - 系统设置、参数配置指南
  - 数据备份与恢复操作

- 《系统服务条款与使用协议》
  - 服务范围、责任界定
  - 数据安全与隐私保护条款
  - 服务级别协议(SLA)

### 2. 技术开发文档（面向开发团队/维护人员）
**目标用户**：开发人员、技术负责人、系统架构师
**编写要求**：技术细节完整，架构图清晰，部署步骤详细

- 《技术架构与部署文档》
  - 系统架构图与组件关系说明
  - 开发环境搭建步骤
  - 生产环境部署指南
  - 数据库设计与API接口文档

- 《代码仓库文档》
  - README.md：项目概述、安装配置、运行说明
  - CONTRIBUTING.md：贡献指南
  - CHANGELOG.md：版本变更记录

### 3. 运维支持文档（面向运维/客服人员）
**目标用户**：系统运维人员、技术支持、客服团队
**编写要求**：问题定位快速，解决方案明确，应急处理步骤清晰

- 《系统运维手册》
  - 监控指标与告警设置
  - 日常维护任务清单
  - 性能优化建议

- 《常见问题FAQ》
  - 用户高频问题及解决方案
  - 系统异常情况处理
  - 权限相关问题解答

- 《故障排查指南》
  - 常见错误代码含义
  - 系统日志分析方法
  - 应急恢复流程

### 4. 项目管理文档（过程记录与资产）
**目标用户**：项目经理、产品负责人、未来维护人员

- 《项目交付清单》
- 《版本发布说明》
- 《需求变更记录》

## 文档编写最佳实践

### 存储与版本管理
- 所有文档统一存放在 `docs/` 目录下
- 使用Git进行版本控制，与代码同步更新
- 建立文档更新日志，记录变更历史

### 格式与规范
- 统一使用Markdown(.md)格式编写
- 在主README.md中建立完整文档导航索引
- 图片统一存放于 `docs/images/` 目录
- 文档命名规范：使用英文，避免特殊字符

### 交付与分发
- 最终交付时提供在线文档链接
- 准备《文档交付说明信》，明确各文档用途和目标用户
- 重要文档提供PDF格式备份文

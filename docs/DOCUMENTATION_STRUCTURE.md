# JX Cloud Terminal - 详细文档结构

## 1. 项目概述文档
- `README.md`
  - 项目简介
  - 技术栈说明
  - 核心业务模块
  - 快速开始指南
  - 部署说明

- `AGENTS.md`
  - 项目架构概述
  - 技术栈和依赖
  - API 结构说明
  - 开发最佳实践
  - 安全注意事项
  - 故障排除指南

## 2. 部署和配置文档
- `DOCUMENTATION_INDEX.md` (本文档)
  - 项目文档清单
  - 文档分类说明

- 环境配置文件
  - `.env` - 本地开发配置
  - `.env.example` - 环境变量模板
  - `.env.production` - 生产环境配置

- 构建配置
  - `vite.config.ts` - Vite 构建和优化配置
  - `tsconfig.json` - TypeScript 编译选项

## 3. 数据库文档
- `schema.ts` - 数据库表结构定义
- `database_setup.sql` - 数据库初始化脚本
- `drizzle.config.ts` - ORM 配置文件

## 4. 类型和常量定义
- `types.ts` - 核心数据类型定义
- `translations.ts` - 多语言翻译配置
- `constants.ts` - 项目常量和初始数据

## 5. 验证和测试文档
- `PRODUCTION_CHECKLIST.md` - 生产环境检查清单
- `PRODUCTION_VALIDATION_REPORT.md` - 生产环境功能验证报告
- `PRODUCTION_READINESS_FINAL.md` - 生产准备最终报告
- `BUTTON_API_ALIGNMENT_REPORT.md` - 按钮与API对齐分析报告

## 6. 部署脚本
- `validate-production.js` - 生产环境验证脚本

## 7. 源代码文档
- `src/` - 前端源代码
  - `App.tsx` - 主应用程序组件
  - `main.tsx` - 应用程序入口点
  - `components/` - UI 组件
  - `services/` - 前端服务
  - `constants/` - 前端常量
  - `types/` - 前端类型定义

- `services/` - 后端服务
  - `api.ts` - 业务逻辑服务
  - `db.server.ts` - 数据库连接服务
  - `auth-server.ts` - 认证服务
  - `supabaseClient.ts` - Supabase 客户端

- `supabase/functions/` - Edge Functions
  - `api/index.ts` - 主 API 网关
  - `auth.ts` - 认证服务
  - `i18n.ts` - 国际化服务
  - `init.ts` - 初始化服务
  - `better-auth.ts` - Better-Auth 集成
  - `config.json` - 函数配置
  - `import_map.json` - 模块映射

## 8. 开发辅助文件
- `package.json` - 项目配置和依赖
- `package-lock.json` - 依赖锁定文件
- `node_modules/` - 项目依赖
- `dist/` - 构建输出目录
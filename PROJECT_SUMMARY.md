# JX Cloud Terminal - 项目结构摘要

## 当前架构状态

项目已成功重构为清晰的前后端分离架构，所有冗余文件已被清理：

```
jx-cloud-terminal/                 # 根目录
├── frontend/                     # 前端应用
│   ├── src/                     # 源代码
│   │   ├── components/          # React组件
│   │   ├── pages/              # 页面组件
│   │   ├── services/           # 前端服务
│   │   ├── hooks/              # 自定义hooks
│   │   └── utils/              # 工具函数
│   ├── package.json            # 前端依赖
│   └── vite.config.ts          # 构建配置
├── backend/                      # 后端服务
│   ├── api/                    # API路由
│   │   ├── v1/                # API v1版本
│   │   └── auth/              # 认证API
│   ├── schema.ts              # 数据库模式
│   ├── drizzle.config.json    # Drizzle配置
│   ├── supabase/              # Supabase配置
│   └── package.json           # 后端依赖
├── shared/                       # 共享类型定义
│   └── database.types.ts       # 类型定义
├── package.json                 # 根目录配置（工作区）
├── tsconfig.json               # TypeScript配置
├── .gitignore                  # Git忽略配置
├── .vercelignore              # Vercel部署忽略配置
└── README.md                  # 项目说明
```

## 清理内容

以下冗余文件和目录已被移除：
- .devtools/, docs/, lib/ (根目录)
- config/, drizzle/, AGENTS.md
- 各种测试和脚本文件
- 旧的 api/ 目录
- PROJECT_STRUCTURE.md
- node_modules/ (依赖缓存)
- .env (含敏感信息的环境文件)

## 项目特点

1. **前后端分离** - 前端和后端完全分离，可独立开发和部署
2. **类型安全** - 通过 shared/ 目录实现类型共享
3. **现代化架构** - 使用 React 19, Supabase, TypeScript
4. **Vercel 部署** - 专为 Vercel 部署优化
5. **Monorepo 结构** - 使用 npm workspaces 管理多包

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```
# JX Cloud Terminal - 前端项目

## 项目结构

现代化的React前端应用，具有清晰的组件结构：

```
jx-cloud-terminal/                 # 根目录
├── frontend/                     # 前端应用
│   ├── src/                     # 源代码
│   │   ├── components/          # React组件
│   │   ├── pages/              # 页面组件
│   │   ├── services/           # 前端服务
│   │   ├── hooks/              # 自定义hooks
│   │   └── utils/              # 工具函数
│   ├── public/                  # 静态资源
│   ├── package.json            # 前端依赖
│   └── vite.config.ts          # 构建配置
├── shared/                       # 共享类型定义
│   └── database.types.ts       # 类型定义（用于API接口定义）
└── package.json                 # 根目录配置
```

## 开发命令

### 启动开发服务器

```bash
# 启动前端开发服务器
npm run dev
```

### 构建项目

```bash
# 构建生产版本
npm run build
```

### 预览构建结果

```bash
# 预览构建后的应用
npm run preview
```

## 环境变量配置

项目包含以下环境变量文件：
- `.env.example` - 环境变量示例文件
- `.env.local` - 本地开发环境配置

请根据您的实际配置更新这些文件中的值。
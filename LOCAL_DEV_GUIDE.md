# 本地开发环境设置指南

## 🛠 环境配置

### 1. 创建环境变量文件

复制 `.env.example` 文件并重命名为 `.env`，然后填入您的真实凭据：

```bash
cp .env.example .env
```

### 2. 获取 Supabase 凭据

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 在 **Project Settings > API** 中找到：
   - Project URL (VITE_SUPABASE_URL)
   - Anonymous Key (VITE_SUPABASE_ANON_KEY)
4. 在 **Project Settings > Database** 中找到数据库连接字符串

### 3. 配置环境变量

在 `.env` 文件中填入：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 数据库连接（Drizzle ORM 使用）
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Better Auth 配置
BETTER_AUTH_SECRET=your-32-char-secret-key-here
BETTER_AUTH_URL=http://localhost:3001
VITE_BETTER_AUTH_URL=http://localhost:3001

NODE_ENV=development
```

## 📊 数据库初始化

### 1. 初始化表结构

在 Supabase SQL Editor 中执行 `database_setup.sql`：

```sql
-- 执行整个 database_setup.sql 文件内容
```

### 2. 初始化分类数据

运行本地脚本创建三级分类结构：

```bash
npm run db:init          # 初始化基本表结构
npm run categories:init   # 初始化三级分类数据
```

或者直接运行：

```bash
npx tsx scripts/init-categories.ts
```

这将创建以下两级分类结构：

```
├── 主食类 (Main Courses)
│   ├── 米饭套餐 (Rice Sets)
│   └── 面条系列 (Noodles)
├── 汤品类 (Soups)
│   ├── 清汤系列 (Clear Soups)
│   └── 浓汤系列 (Creamy Soups)
└── 饮品类 (Beverages)
    ├── 热饮 (Hot Drinks)
    └── 冷饮 (Cold Drinks)
```

## 🚀 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

## 🔧 开发注意事项

1. **数据库连接**: 本地开发使用 Drizzle ORM 直连 PostgreSQL
2. **实时功能**: 仍然使用 Supabase Realtime（仅用于监听）
3. **认证系统**: Better Auth 负责认证，与数据库解耦
4. **分类管理**: 前端支持最多三级分类架构

## 🐛 常见问题

### PGRST204/PGRST205 错误
这通常是由于表结构不匹配造成的：
1. 确保执行了 `database_setup.sql`
2. 检查 `menu_categories` 表是否有 `partner_id` 字段
3. 确认 Better Auth 的 `user` 表存在

### 权限被拒绝
执行以下 SQL 修复权限问题：
```sql
-- 禁用 RLS 策略（开发环境）
DO $$ 
DECLARE t text; 
BEGIN 
  FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') 
  LOOP 
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
  END LOOP; 
END $$;
```

## 📱 测试三级分类功能

1. 启动应用后登录管理后台
2. 进入「供应链管理」→「分类管理」
3. 应该能看到预设的三级分类结构
4. 可以添加、编辑、删除分类
5. 最多支持两级深度（超过会提示限制）

---
*注意：生产环境部署时请重新启用适当的安全策略*
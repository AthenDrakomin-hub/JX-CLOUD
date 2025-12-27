# JX CLOUD (江西云厨) - 企业级酒店管理套件

JX CLOUD 是一款专为现代化酒店、高端餐饮及综合度假村打造的全链路管理系统。基于 **React 19** 与 **Supabase** 云原生架构，系统集成了房态监控、实时点餐、后厨调度、财务审计及资产管理等核心模块。

## 🌟 系统特性

- **多语言驱动**：支持中、英、菲（TL）三语切换，集成云端动态词典。
- **实时同步**：基于 PostgreSQL Realtime 的订单秒级推送。
- **零信任安全**：内置安全审计日志，敏感操作全程留痕。
- **响应式设计**：完美适配 iPad、触屏点餐机及移动端。
- **演示模式**：在未连接数据库时自动回退至演示数据，确保 UI 逻辑闭环。

---

## 🚀 生产环境部署指南

### 1. 数据库初始化 (Supabase)

在 [Supabase](https://supabase.com/) 创建项目后，请在 **SQL Editor** 中依次执行以下架构脚本：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 房间/桌位表 (Rooms)
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'ready',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 菜品菜单表 (Dishes)
CREATE TABLE dishes (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  name_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 订单流水表 (Orders)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 运营支出表 (Expenses)
CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE
);

-- 5. 云端素材库 (Materials)
CREATE TABLE materials (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  url TEXT NOT NULL,
  name TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 动态翻译表 (Translations)
CREATE TABLE translations (
  key TEXT PRIMARY KEY,
  zh TEXT NOT NULL,
  en TEXT NOT NULL,
  tl TEXT NOT NULL
);

-- 7. 安全审计表 (Security Logs)
CREATE TABLE security_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  ip TEXT,
  risk_level TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预置所有房间数据 (8201-8232 和 8301-8332)
DO $$
BEGIN
    FOR i IN 1..32 LOOP
        INSERT INTO rooms (id, status) VALUES (CAST(8200 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
        INSERT INTO rooms (id, status) VALUES (CAST(8300 + i AS TEXT), 'ready') ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
```

### 2. 环境变量配置 (Vercel)

在 Vercel 项目设置中配置以下变量，以打通生产网关：

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase API 地址 | `https://your-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名访问密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |

---

## 🛡 隐私与合规声明

- **硬件权限限制**：本系统属于纯净管理套件。**严禁**调用用户设备的摄像头、麦克风或地理位置。
- **数据透明化**：所有住客点餐行为仅用于订单生成及财务统计，不涉及生物识别或个人敏感隐私采集。
- **加密传输**：所有数据交换均经过 256 位 SSL/TLS 加密，确保酒店经营数据的机密性。

---

## 🛠 技术规格

- **Frontend**: React 19 (ESM Modules), Tailwind CSS
- **Icons**: Lucide React
- **Runtime**: Vercel Edge Runtime (API Gateway)
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel / Cloudflare Pages

---

**江西云厨系统研发部 &copy; 2025**
*JX CLOUD - Engineering the Future of Hospitality.*
-- JX Cloud 酒店管理系统 - 完整数据库设置
-- 包含所有表定义和RLS策略

-- 1. 创建 profiles 表 (用户资料表)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  username TEXT UNIQUE NOT NULL,          -- 用户名
  name TEXT NOT NULL,                     -- 姓名
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')), -- 角色
  permissions TEXT[],                     -- 权限列表
  is_locked BOOLEAN DEFAULT FALSE,        -- 是否锁定
  last_login TIMESTAMP WITH TIME ZONE,    -- 最后登录时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE profiles IS '用户资料表 - 存储员工信息和权限';

-- 2. 创建 materials 表 (云端素材库)
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,           -- 图像的公开URL
  name TEXT NOT NULL,          -- 文件名
  category TEXT,               -- 分类
  file_size TEXT,              -- 文件大小
  dimensions TEXT,             -- 图片尺寸
  mime_type TEXT,              -- MIME类型
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE materials IS '云端素材库 - 存储菜品图片和其他媒体资源';

-- 3. 创建 payment_configs 表 (支付配置)
CREATE TABLE IF NOT EXISTS payment_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                    -- 支付方式名称 (如: GCash, Maya)
  type TEXT NOT NULL,                    -- 支付类型 (枚举值: GCash, Maya, GrabPay, etc.)
  is_active BOOLEAN DEFAULT TRUE,        -- 是否激活
  instructions TEXT,                     -- 支付说明/指引
  icon_type TEXT DEFAULT 'smartphone',   -- 图标类型
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE payment_configs IS '支付配置表 - 管理系统支持的支付方式';

-- 4. translations 表 - 多语言翻译
CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  key TEXT NOT NULL,                       -- 翻译键
  zh TEXT,                                 -- 中文翻译
  en TEXT,                                 -- 英文翻译
  tl TEXT,                                 -- 他加禄语翻译
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. security_logs 表 - 安全日志
CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,                            -- 用户ID
  action TEXT NOT NULL,                    -- 操作动作
  details TEXT,                            -- 操作详情
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 时间戳
  ip_address TEXT,                         -- IP地址
  risk_level TEXT DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High')) -- 风险等级
);

-- 添加注释说明表用途
COMMENT ON TABLE profiles IS '用户资料表 - 存储员工信息和权限';
COMMENT ON TABLE materials IS '云端素材库 - 存储菜品图片和其他媒体资源';
COMMENT ON TABLE payment_configs IS '支付配置表 - 管理系统支持的支付方式';
COMMENT ON TABLE translations IS '多语言翻译表 - 存储系统多语言文本';
COMMENT ON TABLE security_logs IS '安全日志表 - 记录系统安全相关操作';

-- 6. 为新表创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_payment_configs_active ON payment_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);

-- 7. 启用这些表的行级安全 (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;

-- 8. 为新表添加 RLS 策略
-- profiles 表策略
CREATE POLICY "Users have access to own profile" ON profiles FOR ALL USING (
  id = auth.uid()::text OR 
  EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.id = auth.uid()::text 
    AND p2.role IN ('admin', 'manager')
  )
);

-- materials 表策略
CREATE POLICY "Admins can manage materials" ON materials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- payment_configs 表策略
CREATE POLICY "Admins can manage payment configs" ON payment_configs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- ==========================================
-- 为其他表应用 RLS 策略
-- ==========================================

-- ==========================================
-- 为 rooms 表应用 RLS 策略
-- ==========================================

-- 启用 RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 访客权限：只读房间状态
CREATE POLICY IF NOT EXISTS "Rooms are viewable by everyone" ON rooms FOR SELECT USING (TRUE);

-- 管理员权限：完全访问房间表
CREATE POLICY IF NOT EXISTS "Admins have full access to rooms" ON rooms FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- 员工权限：只读和更新房间状态
CREATE POLICY IF NOT EXISTS "Staff can view rooms" ON rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

CREATE POLICY IF NOT EXISTS "Staff can update room status" ON rooms FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

-- ==========================================
-- 为 security_logs 表应用 RLS 策略
-- ==========================================

-- 启用 RLS (如果表存在)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_logs') THEN
    ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
    
    -- 管理员权限：完全访问安全日志
    CREATE POLICY IF NOT EXISTS "Admins can access all security logs" ON security_logs FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid()::text 
        AND profiles.role IN ('admin', 'manager')
      )
    );
    
    -- 员工权限：只读自己的安全日志
    CREATE POLICY IF NOT EXISTS "Staff can view own security logs" ON security_logs FOR SELECT USING (
      user_id = auth.uid()::text OR 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid()::text 
        AND profiles.role IN ('admin', 'manager')
      )
    );
    
    -- 所有认证用户：可插入安全日志（用于系统记录）
    CREATE POLICY IF NOT EXISTS "Authenticated users can insert security logs" ON security_logs FOR INSERT TO authenticated WITH CHECK (TRUE);
    
    -- 管理员权限：可更新安全日志（如风险等级）
    CREATE POLICY IF NOT EXISTS "Admins can update security logs" ON security_logs FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid()::text 
        AND profiles.role IN ('admin', 'manager')
      )
    );
  END IF;
END $$;

-- ==========================================
-- 为其他表更新 RLS 策略（如果尚未创建）
-- ==========================================

-- 为 dishes 表添加策略（如果不存在）
CREATE POLICY IF NOT EXISTS "Menu is viewable by everyone" ON dishes FOR SELECT USING (is_available = TRUE);

-- 为 orders 表添加策略（如果不存在）
CREATE POLICY IF NOT EXISTS "Guests can create orders" ON orders FOR INSERT WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Guests can view their own room orders" ON orders FOR SELECT USING (
  room_id = ANY(
    SELECT r.id 
    FROM rooms r 
    WHERE r.id = orders.room_id
  )
);

-- 管理员对订单的完全访问权限
CREATE POLICY IF NOT EXISTS "Admins have full access to orders" ON orders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- 为 profiles 表添加策略（如果不存在）
CREATE POLICY IF NOT EXISTS "Users have access to own profile" ON profiles FOR ALL USING (
  id = auth.uid()::text OR 
  EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.id = auth.uid()::text 
    AND p2.role IN ('admin', 'manager')
  )
);

-- 为 expenses 表添加策略（如果不存在）
CREATE POLICY IF NOT EXISTS "Admins can manage expenses" ON expenses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()::text 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- 为 materials 表添加策略（如果不存在）
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'materials') THEN
    ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY IF NOT EXISTS "Admins can manage materials" ON materials FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid()::text 
        AND profiles.role IN ('admin', 'manager')
      )
    );
  END IF;
END $$;

-- 为 payment_configs 表添加策略（如果不存在）
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_configs') THEN
    ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY IF NOT EXISTS "Admins can manage payment configs" ON payment_configs FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid()::text 
        AND profiles.role IN ('admin', 'manager')
      )
    );
  END IF;
END $$;

-- 为 translations 表添加策略（如果不存在）
CREATE POLICY IF NOT EXISTS "Everyone can view translations" ON translations FOR SELECT USING (TRUE);

-- 提示：在生产环境中，你可能需要更具体的策略
-- 例如，限制对敏感操作的访问或添加更细粒度的权限控制

-- ==========================================
-- Supabase Storage 存储桶配置
-- ==========================================

-- 1. 创建 materials 存储桶（如果不存在）
-- 注意：存储桶需要在 Supabase 仪表板中创建，无法通过 SQL 创建

-- 2. 存储桶策略配置

-- 允许认证用户上传文件
CREATE POLICY IF NOT EXISTS "Allow material uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'materials'
);

-- 允许所有用户读取文件（包括匿名用户）
CREATE POLICY IF NOT EXISTS "Allow material reads" ON storage.objects FOR SELECT TO authenticated, anon WITH CHECK (
  bucket_id = 'materials'
);

-- 允许认证用户删除文件
CREATE POLICY IF NOT EXISTS "Allow material deletes" ON storage.objects FOR DELETE TO authenticated WITH CHECK (
  bucket_id = 'materials'
);

-- 允许认证用户更新文件
CREATE POLICY IF NOT EXISTS "Allow material updates" ON storage.objects FOR UPDATE TO authenticated WITH CHECK (
  bucket_id = 'materials'
);

-- 3. 可选：确保用户只能访问自己上传的文件
-- CREATE POLICY IF NOT EXISTS "Users can access own materials" ON storage.objects FOR ALL TO authenticated USING (
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- 提示：存储桶的 CORS 配置需要在 Supabase 仪表板中设置：
-- 允许的来源: *
-- 允许的方法: GET, POST, PUT, DELETE
-- 允许的头部: authorization, x-client-info, apikey, content-type

-- 存储桶设置：
-- 最大文件大小：100MB
-- 允许的 MIME 类型：image/png, image/jpeg, image/jpg, image/webp, image/gif
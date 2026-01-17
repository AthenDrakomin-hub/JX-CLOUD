
-- 1. 函数定义
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- 2. 表结构全量定义
-- Better Auth 认证核心表
CREATE TABLE IF NOT EXISTS public.user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT false,
    image TEXT,
    role TEXT DEFAULT 'user',
    partner_id TEXT,
    module_permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.system_config (id TEXT PRIMARY KEY DEFAULT 'global', hotel_name TEXT DEFAULT '江西云厨酒店', version TEXT DEFAULT '8.8.0', updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.payment_methods (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT, currency TEXT DEFAULT 'PHP', currency_symbol TEXT DEFAULT '₱', exchange_rate NUMERIC DEFAULT 1.0, is_active BOOLEAN DEFAULT true, payment_type TEXT, sort_order INTEGER DEFAULT 0, wallet_address TEXT, qr_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.menu_categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT, code TEXT, level INTEGER DEFAULT 1, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, parent_id TEXT REFERENCES public.menu_categories(id) ON DELETE CASCADE, partner_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.rooms (id TEXT PRIMARY KEY, status TEXT DEFAULT 'ready', updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.menu_dishes (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT, description TEXT, tags TEXT[], price NUMERIC NOT NULL, category TEXT REFERENCES public.menu_categories(id), stock INTEGER DEFAULT 99, image_url TEXT, is_available BOOLEAN DEFAULT true, is_recommended BOOLEAN DEFAULT false, partner_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.orders (id TEXT PRIMARY KEY DEFAULT 'ORD-' || floor(random() * 1000000)::text, room_id TEXT NOT NULL, items JSONB DEFAULT '[]'::jsonb, total_amount NUMERIC DEFAULT 0, status TEXT DEFAULT 'pending', payment_method TEXT, payment_proof TEXT, cash_received NUMERIC, cash_change NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.ingredients (id TEXT PRIMARY KEY, name TEXT NOT NULL, unit TEXT, stock NUMERIC DEFAULT 0, min_stock NUMERIC DEFAULT 10, category TEXT, last_restocked TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.partners (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_name TEXT, status TEXT DEFAULT 'active', commission_rate NUMERIC DEFAULT 0.15, balance NUMERIC DEFAULT 0, authorized_categories TEXT[], total_sales NUMERIC DEFAULT 0, joined_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT, name TEXT, role TEXT DEFAULT 'staff', partner_id TEXT, auth_type TEXT DEFAULT 'credentials', email_verified BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, module_permissions JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

-- 添加触发器以自动更新 updated_at 字段
CREATE OR REPLACE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TABLE IF NOT EXISTS public.expenses (id TEXT PRIMARY KEY, amount NUMERIC NOT NULL DEFAULT 0, category TEXT, description TEXT, date TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW());

-- 3. RLS 策略配置 (更安全的访问控制)
DO $$ 
DECLARE 
    t text; 
BEGIN 
    -- 为普通业务表启用RLS并设置认证用户访问策略
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('user', 'session', 'users'))
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Global Access" ON public.%I', t);
        -- 更安全的策略：只允许认证用户访问
        EXECUTE format('CREATE POLICY "Authenticated Access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP; 
    
    -- 为认证相关表设置特殊策略
    ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "User Self Access" ON public.user;
    CREATE POLICY "User Self Access" ON public.user 
        FOR ALL TO authenticated 
        USING (id = auth.uid() OR role = 'admin')
        WITH CHECK (id = auth.uid() OR role = 'admin');
    
    ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Session Owner Access" ON public.session;
    CREATE POLICY "Session Owner Access" ON public.session 
        FOR ALL TO authenticated 
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Business User Access" ON public.users;
    CREATE POLICY "Business User Access" ON public.users 
        FOR ALL TO authenticated 
        USING (id = (SELECT id FROM public.user WHERE email = current_setting('request.jwt.claims')::json->>'email') OR role = 'admin')
        WITH CHECK (id = (SELECT id FROM public.user WHERE email = current_setting('request.jwt.claims')::json->>'email') OR role = 'admin');
END $$;

-- 4. 初始化客房数据 (67间)
INSERT INTO public.rooms (id, status) SELECT i::text, 'ready' FROM generate_series(8201, 8232) AS i ON CONFLICT DO NOTHING;
INSERT INTO public.rooms (id, status) SELECT i::text, 'ready' FROM generate_series(8301, 8332) AS i ON CONFLICT DO NOTHING;
INSERT INTO public.rooms (id, status) VALUES ('VIP-666', 'ready'), ('VIP-888', 'ready'), ('VIP-000', 'ready') ON CONFLICT DO NOTHING;

-- 5. 初始化支付通道 (6个)
INSERT INTO public.payment_methods (id, name, name_en, payment_type, sort_order, wallet_address, qr_url, currency_symbol) VALUES 
('cash_php', '比索现金', 'Cash (PHP)', 'cash', 1, 'Counter', NULL, '₱'),
('gcash', 'GCash', 'GCash', 'digital', 2, '0912-345-6789', 'https://placehold.co/400x400/blue/white?text=GCash+QR', '₱'),
('paypal', 'PayPal', 'PayPal', 'digital', 3, 'finance@jxcloud.com', 'https://placehold.co/400x400/blue/white?text=PayPal+QR', '$'),
('alipay', '支付宝', 'Alipay', 'digital', 4, 'jx_alipay_account', 'https://placehold.co/400x400/blue/white?text=Alipay+QR', '¥'),
('wechat_pay', '微信支付', 'WeChat Pay', 'digital', 5, 'jx_wechat_account', 'https://placehold.co/400x400/green/white?text=WeChat+QR', '¥'),
('usdt_trc20', 'USDT (TRC20)', 'USDT-TRC20', 'digital', 6, 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'https://placehold.co/400x400/orange/white?text=USDT+TRC20', '₮')
ON CONFLICT (id) DO NOTHING;

-- 6. 初始化系统全局配置
INSERT INTO public.system_config (id, hotel_name) VALUES ('global', '江西云厨酒店') ON CONFLICT DO NOTHING;

-- 7. 初始化用户 (根管理员和员工)
INSERT INTO public.users (id, username, email, name, role) VALUES 
('admin-root', 'AthenDrakomin', 'athendrakomin@proton.me', '系统总监', 'admin'),
('staff-user', 'staff', 'staff@jxcloud.com', '普通员工', 'staff')
ON CONFLICT (email) DO NOTHING;
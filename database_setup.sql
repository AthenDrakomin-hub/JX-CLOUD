
-- 1. 函数定义
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- 2. 表结构全量定义
CREATE TABLE IF NOT EXISTS public.system_config (id TEXT PRIMARY KEY DEFAULT 'global', hotel_name TEXT DEFAULT '江西云厨酒店', version TEXT DEFAULT '8.8.0', updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.payment_methods (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT, currency TEXT DEFAULT 'PHP', currency_symbol TEXT DEFAULT '₱', exchange_rate NUMERIC DEFAULT 1.0, is_active BOOLEAN DEFAULT true, payment_type TEXT, sort_order INTEGER DEFAULT 0, wallet_address TEXT, qr_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.menu_categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT, code TEXT, level INTEGER DEFAULT 1, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, parent_id TEXT REFERENCES public.menu_categories(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.rooms (id TEXT PRIMARY KEY, status TEXT DEFAULT 'ready', updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.menu_dishes (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT, description TEXT, tags TEXT[], price NUMERIC NOT NULL, category TEXT REFERENCES public.menu_categories(id), stock INTEGER DEFAULT 99, image_url TEXT, is_available BOOLEAN DEFAULT true, is_recommended BOOLEAN DEFAULT false, partner_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.orders (id TEXT PRIMARY KEY DEFAULT 'ORD-' || floor(random() * 1000000)::text, room_id TEXT NOT NULL, items JSONB DEFAULT '[]'::jsonb, total_amount NUMERIC DEFAULT 0, status TEXT DEFAULT 'pending', payment_method TEXT, payment_proof TEXT, cash_received NUMERIC, cash_change NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.ingredients (id TEXT PRIMARY KEY, name TEXT NOT NULL, unit TEXT, stock NUMERIC DEFAULT 0, min_stock NUMERIC DEFAULT 10, category TEXT, last_restocked TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.partners (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_name TEXT, status TEXT DEFAULT 'active', commission_rate NUMERIC DEFAULT 0.15, balance NUMERIC DEFAULT 0, authorized_categories TEXT[], total_sales NUMERIC DEFAULT 0, joined_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT, name TEXT, role TEXT DEFAULT 'staff', partner_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.expenses (id TEXT PRIMARY KEY, amount NUMERIC NOT NULL DEFAULT 0, category TEXT, description TEXT, date TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW());

-- 3. RLS 策略 (彻底打通匿名链路)
DO $$ 
DECLARE 
    t text; 
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Global Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Global Access" ON public.%I FOR ALL TO anon USING (true)', t);
    END LOOP; 
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

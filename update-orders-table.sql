-- 更新订单表结构以支持完整的配送流程

-- 1. 添加新的订单状态枚举值（如果使用原生枚举）
-- 注意：PostgreSQL 枚举不能直接添加值，需要创建临时类型
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE;

-- 更新状态列的默认值
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

-- 如果使用的是文本类型而不是枚举，那么状态值将在应用层验证
-- 在应用代码中我们已经定义了可用的状态值
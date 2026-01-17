-- 启用 Supabase Realtime 功能
-- 为 orders 表添加到实时发布中

-- 1. 确保 Realtime 发布已创建
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- 2. 将 orders 表添加到实时发布中
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 3. 可选：将其他需要实时更新的表也添加进来
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_dishes;
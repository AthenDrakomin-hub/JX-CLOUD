-- 江西云厨终端系统 - Supabase Edge Functions (V5.2 生产闭环版)

-- 1. 支付回调处理函数
-- 该函数处理来自支付网关的回调，更新订单状态
CREATE OR REPLACE FUNCTION handle_payment_callback(order_id UUID, status TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- 更新订单状态
  UPDATE orders 
  SET status = status, updated_at = NOW()
  WHERE id = order_id AND status = 'pending';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows > 0 THEN
    -- 记录操作日志
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'PAYMENT_CALLBACK', 'orders', order_id::TEXT, 
            jsonb_build_object('status', status));
    
    RETURN QUERY SELECT true as success, 'Order updated successfully' as message;
  ELSE
    RETURN QUERY SELECT false as success, 'Order not found or already processed' as message;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 库存检查函数
-- 检查菜品库存是否充足
CREATE OR REPLACE FUNCTION check_dish_stock(dish_id UUID, required_quantity INTEGER)
RETURNS TABLE(is_available BOOLEAN, current_stock INTEGER, message TEXT) AS $$
DECLARE
  current_stock_val INTEGER;
BEGIN
  SELECT stock INTO current_stock_val FROM dishes WHERE id = dish_id;
  
  IF current_stock_val IS NULL THEN
    RETURN QUERY SELECT false as is_available, 0 as current_stock, 'Dish not found' as message;
  ELSIF current_stock_val < required_quantity THEN
    RETURN QUERY SELECT false as is_available, current_stock_val as current_stock, 
                 'Insufficient stock' as message;
  ELSE
    RETURN QUERY SELECT true as is_available, current_stock_val as current_stock, 
                 'Sufficient stock available' as message;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. 自动库存更新函数
-- 当订单完成时，自动减少相关菜品的库存
CREATE OR REPLACE FUNCTION update_inventory_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- 只有当订单状态变为完成时才更新库存
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 遍历订单中的每个项目并更新库存
    FOR item IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x(dish_id UUID, quantity INTEGER)
    LOOP
      -- 更新菜品库存
      UPDATE dishes 
      SET stock = GREATEST(stock - item.quantity, 0),
          updated_at = NOW()
      WHERE id = (item.dish_id)::UUID;
      
      -- 检查是否需要补充库存
      UPDATE ingredients 
      SET stock = stock - item.quantity -- 假设每道菜消耗一个单位的原料
      WHERE name IN (
        SELECT name FROM ingredients 
        WHERE id IN (
          SELECT unnest(string_to_array(
            (SELECT COALESCE(metadata->>'ingredients', '') FROM dishes WHERE id = (item.dish_id)::UUID), 
            ','
          ))
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为订单表添加库存更新触发器
DROP TRIGGER IF EXISTS update_inventory_on_completion ON orders;
CREATE TRIGGER update_inventory_on_completion
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order_completion();

-- 4. 生成订单统计报告的函数
CREATE OR REPLACE FUNCTION get_daily_order_report(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_orders BIGINT,
  total_revenue DECIMAL,
  avg_order_value DECIMAL,
  top_dishes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    CASE 
      WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) 
      ELSE 0 
    END as avg_order_value,
    (SELECT jsonb_agg(top_dish) FROM (
      SELECT d.name, SUM(oi.quantity)::BIGINT as total_quantity
      FROM orders o,
           jsonb_to_recordset(o.items) AS oi(dish_id UUID, name TEXT, quantity INTEGER, price DECIMAL)
      JOIN dishes d ON d.id = oi.dish_id
      WHERE DATE(o.created_at) = target_date AND o.status = 'completed'
      GROUP BY d.name
      ORDER BY total_quantity DESC
      LIMIT 5
    ) top_dish) as top_dishes
  FROM orders
  WHERE DATE(created_at) = target_date AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- 5. 生成财务月报的函数
CREATE OR REPLACE FUNCTION get_monthly_financial_report(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS TABLE(
  total_revenue DECIMAL,
  total_expenses DECIMAL,
  net_profit DECIMAL,
  order_count BIGINT,
  expense_count BIGINT
) AS $$
DECLARE
  start_date DATE := DATE_TRUNC('month', target_month);
  end_date DATE := start_date + INTERVAL '1 month';
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(total_amount) FROM orders WHERE created_at >= start_date AND created_at < end_date AND status = 'completed'), 0) as total_revenue,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE date >= start_date AND date < end_date), 0) as total_expenses,
    COALESCE((SELECT SUM(total_amount) FROM orders WHERE created_at >= start_date AND created_at < end_date AND status = 'completed'), 0) - 
    COALESCE((SELECT SUM(amount) FROM expenses WHERE date >= start_date AND date < end_date), 0) as net_profit,
    COALESCE((SELECT COUNT(*) FROM orders WHERE created_at >= start_date AND created_at < end_date AND status = 'completed'), 0)::BIGINT as order_count,
    COALESCE((SELECT COUNT(*) FROM expenses WHERE date >= start_date AND date < end_date), 0)::BIGINT as expense_count;
END;
$$ LANGUAGE plpgsql;

-- 6. 低库存警报函数
CREATE OR REPLACE FUNCTION get_low_stock_alerts()
RETURNS TABLE(
  ingredient_id UUID,
  name TEXT,
  current_stock DECIMAL,
  min_stock DECIMAL,
  needs_restock BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as ingredient_id,
    i.name,
    i.stock as current_stock,
    i.min_stock,
    (i.stock <= i.min_stock) as needs_restock
  FROM ingredients i
  WHERE i.stock <= i.min_stock;
END;
$$ LANGUAGE plpgsql;

-- 7. 用户活动统计函数
CREATE OR REPLACE FUNCTION get_user_activity_stats(user_id_param UUID DEFAULT auth.uid(), days INTEGER DEFAULT 30)
RETURNS TABLE(
  user_name TEXT,
  orders_processed BIGINT,
  revenue_generated DECIMAL,
  last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.full_name as user_name,
    COALESCE((SELECT COUNT(*) FROM orders WHERE updated_at >= NOW() - INTERVAL '30 days' AND updated_by = user_id_param), 0)::BIGINT as orders_processed,
    COALESCE((SELECT SUM(total_amount) FROM orders WHERE updated_at >= NOW() - INTERVAL '30 days' AND updated_by = user_id_param AND status = 'completed'), 0) as revenue_generated,
    (SELECT MAX(updated_at) FROM orders WHERE updated_by = user_id_param) as last_active
  FROM users u
  WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- 8. 添加updated_by字段到orders表（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_by') THEN
    ALTER TABLE orders ADD COLUMN updated_by UUID REFERENCES users(id);
  END IF;
END $$;

-- 更新订单表触发器以记录更新者
CREATE OR REPLACE FUNCTION update_order_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_by ON orders;
CREATE TRIGGER set_updated_by
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_order_updated_by();

-- 9. 创建视图：每日销售摘要
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  SUM(tax_amount) as total_tax
FROM orders 
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- 10. 创建视图：菜品销售排行榜
CREATE OR REPLACE VIEW dish_sales_ranking AS
SELECT 
  d.name,
  d.name_en,
  COUNT(oi.dish_id) as times_ordered,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.quantity * oi.price) as total_revenue
FROM dishes d
JOIN jsonb_to_recordset(
  (SELECT jsonb_agg(o.items) FROM orders o WHERE o.status = 'completed')
) AS oi(dish_id UUID, name TEXT, quantity INTEGER, price DECIMAL) ON d.id = oi.dish_id
GROUP BY d.id, d.name, d.name_en
ORDER BY total_quantity_sold DESC;
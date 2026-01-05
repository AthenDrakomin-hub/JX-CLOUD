-- 江西云厨终端系统 - 行级安全 (RLS) 策略定义 (V5.2 生产闭环版)

-- 启用所有表的RLS
ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. 支付网关配置表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Payment Configs" ON payment_configs
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Payment Configs" ON payment_configs
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 2. 品类架构表策略
-- 所有认证用户可读，管理员和维护员可写
CREATE POLICY "Allow All Authenticated Read Access to Categories" ON categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow Admin and Maintainer Write Access to Categories" ON categories
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

-- 3. 食材/物料库存表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Ingredients" ON ingredients
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Ingredients" ON ingredients
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 4. 系统全局配置表策略
-- 管理员可完全访问，其他用户只读
CREATE POLICY "Allow Admin Full Access to System Config" ON system_config
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow All Authenticated Read Access to System Config" ON system_config
  FOR SELECT TO authenticated
  USING (true);

-- 5. 酒店房间表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Rooms" ON rooms
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Rooms" ON rooms
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 6. 订单表策略
-- 管理员可完全访问，其他用户根据角色有不同权限
CREATE POLICY "Allow Admin Full Access to Orders" ON orders
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow Maintainer Read and Update Access to Orders" ON orders
  FOR SELECT, UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 7. 菜品表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Dishes" ON dishes
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Dishes" ON dishes
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 8. 用户表策略
-- 仅管理员可完全访问
CREATE POLICY "Allow Admin Full Access to Users" ON users
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- 9. 支出费用表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Expenses" ON expenses
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Expenses" ON expenses
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 10. 材料图片库表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Material Images" ON material_images
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Material Images" ON material_images
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 11. 合作伙伴/商户表策略
-- 管理员可完全访问，维护员可读写，员工只读
CREATE POLICY "Allow Admin Full Access to Partners" ON partners
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow Maintainer Read and Write Access to Partners" ON partners
  FOR SELECT, INSERT, UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Partners" ON partners
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 12. 支付方式配置表策略
-- 管理员和维护员可完全访问，员工只读
CREATE POLICY "Allow Admin Full Access to Payments" ON payments
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'maintainer');

CREATE POLICY "Allow Staff Read Access to Payments" ON payments
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'staff');

-- 13. 审计日志表策略
-- 仅管理员可访问
CREATE POLICY "Allow Admin Full Access to Audit Logs" ON audit_logs
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- 创建策略函数用于审计日志
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  -- 记录数据变更到审计日志
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'INSERT' THEN NEW.id::TEXT
      WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN OLD.id::TEXT
    END,
    CASE 
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::JSONB
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN row_to_json(NEW)::JSONB
      WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)::JSONB
      ELSE NULL
    END,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql;

-- 为重要表添加审计触发器
DROP TRIGGER IF EXISTS audit_users_changes ON users;
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_orders_changes ON orders;
CREATE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_dishes_changes ON dishes;
CREATE TRIGGER audit_dishes_changes
  AFTER INSERT OR UPDATE OR DELETE ON dishes
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- 创建函数确保用户角色一致性
CREATE OR REPLACE FUNCTION ensure_user_role_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- 确保新用户有适当的角色
  IF NEW.metadata->>'role' IS NULL THEN
    NEW.metadata = jsonb_set(NEW.metadata, '{role}', '"staff"'::jsonb);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为用户表添加触发器
DROP TRIGGER IF EXISTS ensure_user_role ON users;
CREATE TRIGGER ensure_user_role
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION ensure_user_role_consistency();
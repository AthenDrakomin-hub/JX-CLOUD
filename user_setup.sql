-- 创建管理员和员工账号

-- 插入2个管理员账号 (需要绑定邮箱)
INSERT INTO users (id, username, name, role) 
VALUES 
  ('admin1-uuid-placeholder', 'admin1', '系统管理员1', 'admin'),
  ('admin2-uuid-placeholder', 'admin2', '系统管理员2', 'admin')
ON CONFLICT (username) DO UPDATE
SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 插入3个员工账号 (不需要绑定邮箱)
INSERT INTO users (id, username, name, role) 
VALUES 
  ('staff1-uuid-placeholder', 'staff1', '员工1', 'staff'),
  ('staff2-uuid-placeholder', 'staff2', '员工2', 'staff'),
  ('staff3-uuid-placeholder', 'staff3', '员工3', 'staff')
ON CONFLICT (username) DO UPDATE
SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 提示：在实际部署中，您需要为管理员账号设置真实的邮箱地址
-- 例如，可以通过 Supabase 仪表板或 API 为 admin1 和 admin2 设置邮箱
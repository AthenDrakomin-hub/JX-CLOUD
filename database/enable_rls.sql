-- 为 security_logs 和 rooms 表启用 RLS (Row Level Security)

-- 为 security_logs 表启用 RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 为 security_logs 表创建策略 - 管理员可以访问所有记录
CREATE POLICY admin_security_logs_access ON security_logs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 为 rooms 表启用 RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 为 rooms 表创建策略 - 管理员和经理可以访问所有房间
CREATE POLICY admin_rooms_access ON rooms
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager')
  )
);

-- 为 rooms 表创建策略 - 员工只能查看房间信息，不能修改状态
CREATE POLICY staff_rooms_read ON rooms
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'staff'
  )
);

-- 为 rooms 表创建策略 - 员工可以更新房间状态
CREATE POLICY staff_rooms_update ON rooms
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'staff'
  )
);

-- 可选：如果您希望所有认证用户都能读取房间信息（例如在前端显示房间状态）
CREATE POLICY all_users_rooms_read ON rooms
FOR SELECT TO authenticated
USING (true);

-- 检查 RLS 是否已启用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('security_logs', 'rooms');
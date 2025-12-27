# RLS (Row Level Security) 配置指南

## 为什么需要 RLS

RLS (Row Level Security) 是数据库安全的重要组成部分，它允许您控制用户可以访问哪些行数据，而不是仅仅控制用户可以访问哪些表。

## 需要启用 RLS 的表

1. `security_logs` - 安全日志表
2. `rooms` - 房间表

## 配置步骤

### 1. 运行 SQL 脚本

1. 登录到 Supabase 仪表板
2. 进入您的项目
3. 点击左侧菜单的 "SQL"
4. 在 SQL 编辑器中粘贴并运行 `enable_rls.sql` 文件中的内容

### 2. RLS 策略说明

#### security_logs 表策略

- **admin_security_logs_access**: 只有管理员角色可以访问安全日志表的所有操作

#### rooms 表策略

- **admin_rooms_access**: 管理员和经理可以对房间表进行所有操作
- **staff_rooms_read**: 员工角色可以读取房间信息
- **staff_rooms_update**: 员工角色可以更新房间状态
- **all_users_rooms_read**: 所有认证用户都可以读取房间信息（用于前端显示）

## 验证 RLS 配置

运行以下查询来验证 RLS 是否已正确启用：

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('security_logs', 'rooms');
```

结果中的 `rowsecurity` 列应该显示 `t`（true）表示 RLS 已启用。

## 注意事项

1. 启用 RLS 后，如果没有适当的策略，所有用户将无法访问数据
2. 确保在启用 RLS 之前已经创建了适当的策略
3. 测试不同用户角色的权限以确保策略按预期工作
4. 在生产环境中，定期审查 RLS 策略以确保安全性

## 故障排除

如果启用了 RLS 但无法访问数据：

1. 检查用户是否已正确认证
2. 验证用户的角色是否正确设置
3. 确认策略条件是否正确匹配用户权限
4. 检查是否有任何冲突的策略
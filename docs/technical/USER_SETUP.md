# 用户账号配置指南

## 配置说明

本系统需要配置 2 个管理员账号和 3 个员工账号，并禁用用户注册功能。

## 管理员账号（需要绑定邮箱）

1. **admin1** - 系统管理员1
   - 邮箱：admin1@yourdomain.com
   - 角色：admin

2. **admin2** - 系统管理员2
   - 邮箱：admin2@yourdomain.com
   - 角色：admin

## 员工账号（无需绑定邮箱）

1. **staff1** - 员工1
   - 邮箱：staff1@yourdomain.com（可以是虚拟邮箱）
   - 角色：staff

2. **staff2** - 员工2
   - 邮箱：staff2@yourdomain.com（可以是虚拟邮箱）
   - 角色：staff

3. **staff3** - 员工3
   - 邮箱：staff3@yourdomain.com（可以是虚拟邮箱）
   - 角色：staff

## 配置步骤

### 1. 在 Supabase 仪表板中创建用户

1. 登录到 Supabase 仪表板
2. 进入您的项目
3. 点击左侧菜单的 "Authentication" → "Users"
4. 点击 "New User" 按钮
5. 为每个账号创建用户：
   - 输入邮箱地址
   - 设置密码
   - 确保邮箱已验证

### 2. 更新用户角色

1. 在 Supabase SQL 编辑器中运行 `database/user_setup.sql` 脚本
2. 这将创建或更新用户记录并设置正确的角色

### 3. 禁用用户注册

1. 在 Supabase 仪表板中，进入 "Authentication" → "Settings"
2. 找到 "Disable sign ups" 选项并启用它
3. 这样就禁用了用户注册功能

### 4. 验证配置

1. 确保所有 5 个用户都已正确创建
2. 验证管理员账号和员工账号的角色设置正确
3. 确认注册功能已禁用

## 注意事项

- 管理员账号需要真实的邮箱地址，用于接收重要通知
- 员工账号可以使用系统生成的虚拟邮箱地址
- 所有用户都必须通过邮箱和密码进行认证
- 用户角色决定了他们在系统中的权限
- 禁用注册后，只有预设的用户才能登录系统
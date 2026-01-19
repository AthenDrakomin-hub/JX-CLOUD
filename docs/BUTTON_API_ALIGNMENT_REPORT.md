# 前端按钮与后端API调用对齐分析报告

## 概述
根据对JX Cloud Terminal项目的分析，前端各组件中的按钮均已正确绑定到后端API服务，实现了完整的CRUD操作。

## 按钮与API调用绑定详情

### 1. 菜单管理组件 (MenuManagement.tsx)
- **新增菜品按钮** (`+ 新资产`) → `api.dishes.create()`
- **编辑菜品按钮** (点击菜品卡片) → `api.dishes.update()`
- **删除菜品按钮** (垃圾桶图标) → `api.dishes.delete()`
- **搜索功能** → `api.dishes.getAll()` + 本地过滤
- **分类筛选** → `api.categories.getAll()` + 本地过滤

### 2. 订单管理组件 (OrderManagement.tsx)
- **接受订单按钮** → `api.orders.updateStatus()` (PENDING → PREPARING)
- **完成订单按钮** → `api.orders.updateStatus()` (PREPARING → COMPLETED)
- **取消订单按钮** → `api.orders.updateStatus()` (任意状态 → CANCELLED)
- **打印订单按钮** → `api.orders.updateStatus()` (PENDING → PREPARING)
- **搜索功能** → `api.orders.getAll()`

### 3. 员工管理组件 (StaffManagement.tsx)
- **新增账户按钮** → `api.users.upsert()`
- **编辑账户按钮** (点击用户卡片) → `api.users.upsert()`
- **删除账户按钮** (在组件内部) → `api.users.delete()`
- **角色权限保存** → `api.users.upsert()` (包含权限更新)
- **合作伙伴管理** → `api.partners.create/update/delete`

### 4. 支付管理组件 (PaymentManagement.tsx)
- **新增支付方式** → `api.payments.create()`
- **编辑支付方式** → `api.payments.update()`
- **删除支付方式** → `api.payments.delete()`
- **启用/禁用支付** → `api.payments.toggle()`
- **获取支付列表** → `api.payments.getAll()`

### 5. 供应链管理组件 (SupplyChainManager.tsx)
- **新增分类** → `api.categories.saveAll()`
- **更新分类** → `api.categories.saveAll()`
- **新增食材** → `api.ingredients.create()`
- **更新食材** → `api.ingredients.update()`
- **删除食材** → `api.ingredients.delete()`

### 6. 注册管理功能
- **提交注册请求** → `api.registration.request()`
- **审批注册请求** → `api.registration.approve()`
- **拒绝注册请求** → `api.registration.reject()`
- **获取注册请求** → `api.registration.getAll()`

## API调用机制分析

### 前端API服务层 (src/services/api.ts)
1. **统一API网关**: 所有请求通过 `apiClient` 统一处理
2. **两种数据源**:
   - 正常模式: 通过 Supabase Edge Functions (`/functions/v1/api/`)
   - 演示模式: 使用本地初始数据
3. **数据转换**: 自动处理驼峰命名与下划线命名之间的转换

### 数据转换机制
- **数据库字段** (`snake_case`): `user_id`, `partner_id`, `is_available`
- **前端属性** (`camelCase`): `userId`, `partnerId`, `isAvailable`
- **转换函数**: `mapDishFromDB()`, `mapOrderFromDB()` 等

## 安全性保障
1. **多租户隔离**: 所有操作都基于 `partnerId` 进行数据隔离
2. **权限验证**: 检查用户角色和权限级别
3. **RLS策略**: 在数据库层面强制执行行级安全

## 状态管理
- **乐观更新**: 按钮点击后立即更新UI，失败后回滚
- **加载状态**: 按钮在操作期间显示加载动画
- **错误处理**: 操作失败时显示错误信息

## 总结
前端所有按钮均已正确绑定到相应的后端API，实现了完整的功能闭环。API调用与数据模型对齐，符合物理契约对齐原则，确保了前后端数据传输的一致性。
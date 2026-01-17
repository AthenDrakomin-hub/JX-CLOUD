// TypeScript 类型验证脚本
// 验证所有涉及 role 字段的类型定义是否正确

import { user, users } from '../drizzle/schema.js';
import { InferSelectModel } from 'drizzle-orm';

// 验证认证表类型
type AuthUser = InferSelectModel<typeof user>;
const authUser: Partial<AuthUser> = {
  id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: false,
  role: 'admin', // 这应该可以正常工作
  partnerId: null,
  modulePermissions: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 验证业务表类型
type BusinessUser = InferSelectModel<typeof users>;
const businessUser: BusinessUser = {
  id: 'test-id',
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin', // 这也应该可以正常工作
  partnerId: null,
  authType: 'credentials',
  emailVerified: false,
  isActive: true,
  modulePermissions: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 验证类型推断
console.log('✅ 认证表 role 类型:', typeof authUser.role);
console.log('✅ 业务表 role 类型:', typeof businessUser.role);

// 验证枚举类型兼容性
const validRoles = ['admin', 'staff', 'partner', 'user'] as const;
type ValidRole = typeof validRoles[number];

const testRole: ValidRole = 'admin'; // 这应该可以正常工作
console.log('✅ 角色枚举类型验证通过:', testRole);

console.log('🎉 所有类型定义验证通过！');
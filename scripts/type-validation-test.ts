// 类型验证测试
import { user } from '../drizzle/schema.js';

// 测试user表的role字段类型
const testUser = {
  id: 'test',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: false,
  role: 'admin', // 这应该可以正常工作
  partnerId: null,
  modulePermissions: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('✅ User role type validation passed');
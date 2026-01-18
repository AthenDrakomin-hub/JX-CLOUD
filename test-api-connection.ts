// 测试API连接和数据库功能
// 从环境变量读取数据库URL

import { db } from './src/services/db.server.js';
import { user as authUser, users as businessUsers } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function testApiConnection() {
  console.log('🔍 测试API连接和数据库功能...');
  
  try {
    // 测试数据库连接
    console.log('1. 测试数据库连接...');
    const testQuery = await db.select().from(authUser).limit(1);
    console.log('✅ 数据库连接正常');
    
    // 测试JOIN查询
    console.log('2. 测试JOIN查询...');
    const joinedUsers = await db.select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      username: businessUsers.username,
    })
    .from(authUser)
    .leftJoin(businessUsers, eq(authUser.id, businessUsers.id))
    .limit(5);
    
    console.log('✅ JOIN查询成功，返回', joinedUsers.length, '条记录');
    console.log('样本数据:', joinedUsers.slice(0, 2));
    
    // 测试普通用户查询
    console.log('3. 测试普通用户查询...');
    const users = await db.select().from(businessUsers).limit(5);
    console.log('✅ 用户查询成功，返回', users.length, '条记录');
    
    return {
      success: true,
      database: 'connected',
      joinedUsers: joinedUsers.length,
      businessUsers: users.length
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
testApiConnection().then(result => {
  console.log('\n📋 测试结果:', result);
}).catch(error => {
  console.error('测试执行错误:', error);
});
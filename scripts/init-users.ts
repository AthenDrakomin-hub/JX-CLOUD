import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function initUsers() {
  try {
    console.log('开始初始化用户数据...');
    
    // 获取数据库连接字符串
    const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL 或 POSTGRES_URL 环境变量未设置');
    }
    
    // 自动切换至 Supabase 事务池端口 6543
    let processedUrl = DATABASE_URL;
    try {
      const parsed = new URL(DATABASE_URL);
      if (parsed.hostname.includes('supabase.co')) {
        parsed.port = "6543"; 
      }
      processedUrl = parsed.toString();
    } catch (e) {
      console.warn('⚠️ 解析数据库URL时出现问题，使用原始URL');
    }
    
    console.log(`使用数据库连接: ${processedUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    // 创建临时数据库连接
    const tempPool = new Pool({ 
      connectionString: processedUrl,
      max: 1, // 最小连接池
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    const tempDb = drizzle(tempPool, { schema });

    // 检查是否已存在根管理员
    const existingRootUser = await tempDb.select().from(schema.users).where(eq(schema.users.email, 'athendrakomin@proton.me'));
    
    if (existingRootUser.length === 0) {
      // 创建根管理员用户 (Better Auth 用户表)
      await tempDb.insert(schema.user).values({
        id: 'admin-root-user-' + Date.now(),
        name: 'AthenDrakomin',
        email: 'athendrakomin@proton.me',
        emailVerified: true,
        image: null,
        role: 'admin',
        partnerId: null,
        modulePermissions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 创建根管理员用户 (业务用户表)
      await tempDb.insert(schema.users).values({
        id: 'admin-root-' + Date.now(),
        username: 'AthenDrakomin',
        email: 'athendrakomin@proton.me',
        name: '系统总监',
        role: 'admin',
        partnerId: null,
        modulePermissions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ 根管理员用户已创建:', 'athendrakomin@proton.me');
    } else {
      console.log('⚠️ 根管理员用户已存在，跳过创建');
    }

    // 检查是否已存在员工账号
    const existingStaffUser = await tempDb.select().from(schema.users).where(eq(schema.users.email, 'staff@jxcloud.com'));
    
    if (existingStaffUser.length === 0) {
      // 创建员工用户 (Better Auth 用户表)
      await tempDb.insert(schema.user).values({
        id: 'staff-user-' + Date.now(),
        name: '普通员工',
        email: 'staff@jxcloud.com',
        emailVerified: true,
        image: null,
        role: 'staff',
        partnerId: null,
        modulePermissions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 创建员工用户 (业务用户表)
      await tempDb.insert(schema.users).values({
        id: 'staff-' + Date.now(),
        username: 'staff',
        email: 'staff@jxcloud.com',
        name: '普通员工',
        role: 'staff',
        partnerId: null,
        modulePermissions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ 员工用户已创建:', 'staff@jxcloud.com');
    } else {
      console.log('⚠️ 员工用户已存在，跳过创建');
    }

    await tempPool.end(); // 关闭连接池
    console.log('🎉 用户初始化完成！');
  } catch (error) {
    console.error('❌ 初始化用户时出错:', error);
    process.exit(1);
  }
}

// 运行初始化
if (typeof window === 'undefined') {
  // 在Node.js环境中运行
  initUsers();
}

export default initUsers;
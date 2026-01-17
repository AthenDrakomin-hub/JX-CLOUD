import { db } from '../src/services/db.server.js';
import { user, users as businessUsers } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function initializeAdminUser() {
  console.log('🚀 开始初始化管理员账户...');

  try {
    // 检查管理员账户是否已存在
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, 'athendrakomin@proton.me'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ 管理员账户已存在，跳过初始化');
      console.log('📧 邮箱:', existingAdmin[0].email);
      console.log('👤 姓名:', existingAdmin[0].name);
      console.log('🔑 角色:', existingAdmin[0].role);
      return;
    }

    console.log('📝 创建新的管理员账户...');
    
    // 创建管理员账户（用于认证）
    const adminUserData = {
      email: 'athendrakomin@proton.me',
      name: 'System Admin',
      role: 'admin',
      emailVerified: true,
      partnerId: 'system_partner', // 系统级合伙人ID
    };

    const [newAdmin] = await db
      .insert(user)
      .values(adminUserData)
      .returning();

    console.log('✅ 认证用户表创建成功');

    // 在业务用户表中也创建对应的记录
    await db
      .insert(businessUsers)
      .values({
        id: newAdmin.id,
        email: 'athendrakomin@proton.me',
        username: 'system_admin',
        name: 'System Admin',
        role: 'admin',
        partnerId: 'system_partner',
      });

    console.log('✅ 业务用户表创建成功');
    console.log('📧 管理员邮箱: athendrakomin@proton.me');
    console.log('🔑 临时密码: Admin123!# (登录后请立即绑定指纹并禁用密码)');
    console.log('🔐 登录后请尽快绑定生物识别以提高安全性');

  } catch (error) {
    console.error('❌ 初始化管理员账户失败:', error);
    throw error;
  }
}

// 运行初始化
if (typeof window === 'undefined') { // 只在服务器端运行
  initializeAdminUser()
    .then(() => {
      console.log('✅ 管理员账户初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 管理员账户初始化过程中发生错误:', error);
      process.exit(1);
    });
}
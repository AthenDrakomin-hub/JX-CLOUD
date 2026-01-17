import { db } from '../src/services/db.server.js';
import { user, users } from '../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('🚀 执行QQ邮箱提权操作...');

async function executePrivilegeEscalation() {
  const targetEmail = '2811284084qq.com';
  const rootEmail = 'athendrakomin@proton.me';
  
  try {
    console.log(`🔍 检查目标邮箱 ${targetEmail} 的当前状态...`);
    
    // 1. 检查认证表(user)中的状态
    console.log('\n📋 认证表(user)状态:');
    const authUser = await db.select().from(user).where(eq(user.email, targetEmail)).limit(1);
    console.log('认证表记录:', authUser[0] || '未找到');
    
    // 2. 检查业务表(users)中的状态
    console.log('\n📋 业务表(users)状态:');
    const bizUser = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);
    console.log('业务表记录:', bizUser[0] || '未找到');
    
    // 3. 检查主账号状态作为参考
    console.log('\n📋 主账号参考状态:');
    const rootAuth = await db.select().from(user).where(eq(user.email, rootEmail)).limit(1);
    const rootBiz = await db.select().from(users).where(eq(users.email, rootEmail)).limit(1);
    console.log('主账号认证表:', rootAuth[0]);
    console.log('主账号业务表:', rootBiz[0]);
    
    // 4. 执行提权操作
    console.log('\n⚡ 执行提权操作...');
    
    // 如果认证表中不存在该用户，则插入
    if (authUser.length === 0) {
      console.log('📝 在认证表中创建用户记录...');
      await db.insert(user).values({
        id: `user-${Date.now()}`,
        name: 'QQ管理员',
        email: targetEmail,
        emailVerified: true,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ 认证表用户创建完成');
    } else {
      // 更新认证表中的角色
      console.log('📝 更新认证表用户角色...');
      await db.update(user)
        .set({ 
          role: 'admin',
          updatedAt: new Date()
        })
        .where(eq(user.email, targetEmail));
      console.log('✅ 认证表角色更新完成');
    }
    
    // 如果业务表中不存在该用户，则插入
    if (bizUser.length === 0) {
      console.log('📝 在业务表中创建用户记录...');
      await db.insert(users).values({
        id: `user-${Date.now()}-biz`,
        username: 'qqadmin',
        email: targetEmail,
        name: 'QQ管理员',
        role: 'admin',
        partnerId: null,
        modulePermissions: rootBiz[0]?.modulePermissions || {}
      });
      console.log('✅ 业务表用户创建完成');
    } else {
      // 更新业务表中的角色和权限
      console.log('📝 更新业务表用户权限...');
      await db.update(users)
        .set({ 
          role: 'admin',
          partnerId: null, // 清除合作伙伴限制，赋予系统级权限
          modulePermissions: rootBiz[0]?.modulePermissions || {}
        })
        .where(eq(users.email, targetEmail));
      console.log('✅ 业务表权限更新完成');
    }
    
    // 5. 验证结果
    console.log('\n✅ 提权操作完成！正在验证结果...');
    
    console.log('\n📋 最终状态验证:');
    const finalAuth = await db.select().from(user).where(eq(user.email, targetEmail)).limit(1);
    const finalBiz = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);
    
    console.log('🔐 认证表最终状态:');
    console.log('  Email:', finalAuth[0]?.email);
    console.log('  Role:', finalAuth[0]?.role);
    console.log('  ID:', finalAuth[0]?.id);
    
    console.log('\n💼 业务表最终状态:');
    console.log('  Email:', finalBiz[0]?.email);
    console.log('  Role:', finalBiz[0]?.role);
    console.log('  Partner ID:', finalBiz[0]?.partnerId);
    console.log('  Username:', finalBiz[0]?.username);
    
    // 6. 显示主账号对比
    console.log('\n📋 主账号对比:');
    const finalRootAuth = await db.select().from(user).where(eq(user.email, rootEmail)).limit(1);
    const finalRootBiz = await db.select().from(users).where(eq(users.email, rootEmail)).limit(1);
    
    console.log('主账号认证表 Role:', finalRootAuth[0]?.role);
    console.log('主账号业务表 Role:', finalRootBiz[0]?.role);
    console.log('主账号业务表 Partner ID:', finalRootBiz[0]?.partnerId);
    
    console.log('\n🎉 提权操作成功完成！');
    console.log('✅ QQ邮箱账号已获得与主账号相同的管理员权限');
    
  } catch (error: any) {
    console.error('❌ 提权操作失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

executePrivilegeEscalation();
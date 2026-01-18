// scripts/test-db-connection.ts - 测试数据库连接并获取统计信息
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { user as authUser, users as businessUsers, partners, passkeys } from '../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 使用环境变量中的数据库URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件中的 DATABASE_URL 或 POSTGRES_URL 配置。');
  process.exit(1);
}

// 创建连接池
const pool = new Pool({ 
  connectionString: connectionString,
  max: 5,           // 减少连接数用于测试
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 创建Drizzle实例
const db = drizzle(pool, { 
  logger: false // 关闭日志输出
});

async function getProjectStats() {
  try {
    console.log('🔍 正在测试数据库连接...\n');
    
    // 简单查询测试连接
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ 数据库连接成功！\n');
    
    console.log('📊 正在获取项目统计数据...\n');
    
    // 1. 统计Partner数量
    const partnerCountResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(partners);
    const partnerCount = Number(partnerCountResult[0].count);
    
    console.log(`🏢 已注册的合作伙伴数量: ${partnerCount}`);
    
    // 2. 统计已绑定指纹的Admin数量
    // 首先查找所有role为'admin'的用户
    const adminUsers = await db.select()
      .from(authUser)
      .where(eq(authUser.role, 'admin'));
    
    // 然后检查这些admin用户中有多少人绑定了passkey（指纹/面部识别）
    let adminsWithPasskeys = 0;
    for (const admin of adminUsers) {
      const passkeyCountResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(passkeys)
        .where(eq(passkeys.userId, admin.id));
      const passkeyCount = Number(passkeyCountResult[0].count);
      
      if (passkeyCount > 0) {
        adminsWithPasskeys++;
      }
    }
    
    console.log(`👤 已绑定生物识别(指纹/面部)的管理员数量: ${adminsWithPasskeys}`);
    console.log(`👤 总管理员数量: ${adminUsers.length}`);
    
    // 3. 额外统计信息
    const totalUsersResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(businessUsers);
    const totalUsers = Number(totalUsersResult[0].count);
    
    const totalAuthUsersResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(authUser);
    const totalAuthUsers = Number(totalAuthUsersResult[0].count);
    
    const totalPasskeysResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(passkeys);
    const totalPasskeys = Number(totalPasskeysResult[0].count);
    
    console.log('\n📈 其他统计信息:');
    console.log(`👥 业务用户总数: ${totalUsers}`);
    console.log(`🔑 认证用户总数: ${totalAuthUsers}`);
    console.log(`🔒 生物识别凭证总数: ${totalPasskeys}`);
    
    // 4. 显示所有合作伙伴详情
    if (partnerCount > 0) {
      console.log('\n📋 合作伙伴详情:');
      const allPartners = await db.select().from(partners);
      allPartners.forEach((partner, index) => {
        console.log(`  ${index + 1}. ${partner.name} (${partner.id}) - 状态: ${partner.status}`);
      });
    }
    
    // 5. 显示绑定指纹的管理员详情
    if (adminsWithPasskeys > 0) {
      console.log('\n👮 已绑定生物识别的管理员:');
      for (const admin of adminUsers) {
        const passkeyCountResult = await db.select({ count: sql<number>`COUNT(*)` })
          .from(passkeys)
          .where(eq(passkeys.userId, admin.id));
        const passkeyCount = Number(passkeyCountResult[0].count);
        
        if (passkeyCount > 0) {
          console.log(`  • ${admin.name} (${admin.email}) - 绑定 ${passkeyCount} 个生物识别凭证`);
        }
      }
    }
    
    console.log('\n✅ 数据统计完成！');
  } catch (error) {
    console.error('❌ 获取统计数据时发生错误:', error);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

// 执行统计
getProjectStats();
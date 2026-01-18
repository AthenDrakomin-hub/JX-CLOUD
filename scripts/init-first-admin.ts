// scripts/init-first-admin.ts - 初始化第一个管理员账户脚本
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { user, users as businessUsers, partners } from '../drizzle/schema.js';
import { hash } from 'bcryptjs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 使用环境变量中的数据库URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件中的 DATABASE_URL 或 POSTGRES_URL 配置。');
  process.exit(1);
}

console.log('🔌 连接到数据库以初始化第一个管理员账户...');

// 创建连接池
const pool = new Pool({ 
  connectionString: connectionString,
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 创建Drizzle实例
const db = drizzle(pool, { 
  logger: false 
});

async function initFirstAdmin() {
  try {
    console.log('🚀 开始初始化第一个管理员账户...');
    
    // 1. 创建默认合作伙伴
    console.log('🏢 创建默认合作伙伴...');
    const defaultPartner = await db.insert(partners).values({
      id: 'partner-default',
      name: '默认合作伙伴',
      ownerName: '系统管理员',
      status: 'active',
      commissionRate: '0.15',
      balance: '0'
    }).returning();
    
    console.log('✅ 默认合作伙伴已创建:', defaultPartner[0].name);
    
    // 2. 创建根管理员用户（Better Auth 认证表）
    console.log('👮 创建根管理员用户...');
    const adminId = 'admin-' + Date.now();
    const hashedPassword = await hash('TempPass123!', 10); // 初始密码
    
    const authUser = await db.insert(user).values({
      id: adminId,
      name: 'Root Admin',
      email: 'admin@jx-cloud-kitchen.local',
      emailVerified: true,
      role: 'admin',
      partnerId: defaultPartner[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('✅ 认证管理员用户已创建:', authUser[0].email);
    
    // 3. 创建业务用户数据
    console.log('👤 创建业务用户数据...');
    const businessUser = await db.insert(businessUsers).values({
      id: adminId,
      username: 'root_admin',
      email: 'admin@jx-cloud-kitchen.local',
      name: 'Root Admin',
      role: 'admin',
      partnerId: defaultPartner[0].id,
      authType: 'passkey',
      emailVerified: true,
      isActive: true,
      isPasskeyBound: false, // 初始状态未绑定生物识别
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('✅ 业务管理员用户已创建:', businessUser[0].email);
    
    // 4. 更新系统配置
    console.log('⚙️  更新系统配置...');
    try {
      await db.execute(sql`DELETE FROM "system_config";`);
      await db.insertInto('system_config').values({
        id: 'global',
        hotelName: '江西云厨酒店管理系统',
        version: '9.0.0',
        updatedAt: new Date()
      }).execute();
    } catch (e) {
      // 如果表不存在则跳过
      console.log('⚠️  无法更新系统配置表，可能不存在');
    }
    
    console.log('\n🎉 初始化完成！');
    console.log('\n📋 初始化摘要:');
    console.log(`   • 合作伙伴: ${defaultPartner[0].name} (${defaultPartner[0].id})`);
    console.log(`   • 管理员邮箱: ${authUser[0].email}`);
    console.log(`   • 管理员姓名: ${authUser[0].name}`);
    console.log(`   • 初始密码: TempPass123! (请登录后立即更改)`);
    console.log(`   • 生物识别: 未绑定 (首次登录后可绑定)`);
    
    console.log('\n🔐 登录后操作指南:');
    console.log('   1. 使用上面的邮箱和初始密码登录系统');
    console.log('   2. 立即更改密码');
    console.log('   3. 绑定生物识别(指纹/面部)以增强安全性');
    console.log('   4. 根据需要创建其他用户和配置系统参数');
    
  } catch (error) {
    console.error('❌ 初始化管理员账户时发生错误:', error);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

// 执行初始化
initFirstAdmin();
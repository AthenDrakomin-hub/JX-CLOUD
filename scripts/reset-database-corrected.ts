// scripts/reset-database-corrected.ts - 修正版数据库重置脚本
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 使用环境变量中的数据库URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件中的 DATABASE_URL 或 POSTGRES_URL 配置。');
  process.exit(1);
}

console.log('🔌 连接到数据库以重置数据...');

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

async function resetDatabase() {
  try {
    console.log('🔄 开始重置数据库...');
    
    // 按正确的顺序清空表
    // 1. 先删业务数据（没有外键依赖的表）
    console.log('🗑️  清空业务数据...');
    
    await db.execute(sql`TRUNCATE TABLE "orders" RESTART IDENTITY CASCADE;`);
    console.log('✅ orders 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "menu_dishes" RESTART IDENTITY CASCADE;`);
    console.log('✅ menu_dishes 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "menu_categories" RESTART IDENTITY CASCADE;`);
    console.log('✅ menu_categories 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "expenses" RESTART IDENTITY CASCADE;`);
    console.log('✅ expenses 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "ingredients" RESTART IDENTITY CASCADE;`);
    console.log('✅ ingredients 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "rooms" RESTART IDENTITY CASCADE;`);
    console.log('✅ rooms 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "payment_methods" RESTART IDENTITY CASCADE;`);
    console.log('✅ payment_methods 表已清空');
    
    // 2. 再删认证相关数据
    console.log('🔐 清空认证相关数据...');
    
    await db.execute(sql`TRUNCATE TABLE "passkeys" RESTART IDENTITY CASCADE;`);
    console.log('✅ passkeys 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "session" RESTART IDENTITY CASCADE;`);
    console.log('✅ session 表已清空');
    
    // 3. 清空用户相关数据（注意外键关系）
    console.log('👥 清空用户相关数据...');
    
    await db.execute(sql`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);
    console.log('✅ users 表（业务用户表）已清空');
    
    await db.execute(sql`TRUNCATE TABLE "user" RESTART IDENTITY CASCADE;`);
    console.log('✅ user 表（Better Auth 认证表）已清空');
    
    // 4. 最后清理合作伙伴和其他表
    await db.execute(sql`TRUNCATE TABLE "partners" RESTART IDENTITY CASCADE;`);
    console.log('✅ partners 表已清空');
    
    await db.execute(sql`TRUNCATE TABLE "system_config" RESTART IDENTITY CASCADE;`);
    console.log('✅ system_config 表已清空');
    
    console.log('\n✅ 数据库重置完成！');
    
    // 验证结果
    console.log('\n🔍 验证清空结果...');
    const userCountResult = await db.execute(sql`SELECT COUNT(*) FROM "user";`);
    console.log('📊 user 表记录数:', Number(userCountResult.rows[0].count));
    
    const usersCountResult = await db.execute(sql`SELECT COUNT(*) FROM "users";`);
    console.log('📊 users 表记录数:', Number(usersCountResult.rows[0].count));
    
    const passkeysCountResult = await db.execute(sql`SELECT COUNT(*) FROM "passkeys";`);
    console.log('📊 passkeys 表记录数:', Number(passkeysCountResult.rows[0].count));
    
    const partnersCountResult = await db.execute(sql`SELECT COUNT(*) FROM "partners";`);
    console.log('📊 partners 表记录数:', Number(partnersCountResult.rows[0].count));
    
    console.log('\n🎉 数据库已成功清空！');
    
  } catch (error) {
    console.error('❌ 重置数据库时发生错误:', error);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

// 执行重置
resetDatabase();
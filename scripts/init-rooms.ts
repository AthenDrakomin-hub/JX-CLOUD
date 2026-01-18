// scripts/init-rooms.ts - 初始化酒店房间数据
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { rooms } from '../drizzle/schema.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 使用环境变量中的数据库URL
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件中的 DATABASE_URL 或 POSTGRES_URL 配置。');
  process.exit(1);
}

console.log('🔌 连接到数据库以初始化房间数据...');

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

async function initRooms() {
  try {
    console.log('🏨 开始初始化酒店房间数据...');
    
    // 先清空现有的房间数据
    await db.execute(sql`TRUNCATE TABLE "rooms" RESTART IDENTITY CASCADE;`);
    console.log('✅ 房间表已清空');
    
    // 生成67个房间的数据 (8201-8232, 8301-8332, VIP房间)
    const roomData = [];
    
    // 添加8201-8232房间 (32个房间)
    for (let i = 1; i <= 32; i++) {
      roomData.push({
        id: `82${i.toString().padStart(2, '0')}`,
        status: 'ready',
        updatedAt: new Date()
      });
    }
    
    // 添加8301-8332房间 (32个房间)
    for (let i = 1; i <= 32; i++) {
      roomData.push({
        id: `83${i.toString().padStart(2, '0')}`,
        status: 'ready',
        updatedAt: new Date()
      });
    }
    
    // 添加VIP房间
    roomData.push({
      id: 'vip333',
      status: 'ready',
      updatedAt: new Date()
    });
    
    roomData.push({
      id: 'vip666',
      status: 'ready',
      updatedAt: new Date()
    });
    
    roomData.push({
      id: 'vip999',
      status: 'ready',
      updatedAt: new Date()
    });
    
    // 插入房间数据
    console.log(`📝 准备插入 ${roomData.length} 个房间数据...`);
    
    for (const room of roomData) {
      await db.insert(rooms).values(room);
    }
    
    console.log(`✅ 成功插入 ${roomData.length} 个房间数据`);
    
    // 验证插入结果
    const roomCountResult = await db.execute(sql`SELECT COUNT(*) FROM "rooms";`);
    const roomCount = Number(roomCountResult.rows[0].count);
    
    console.log(`📊 验证结果: 房间表现在有 ${roomCount} 个房间`);
    
    // 显示一些房间号示例
    console.log('\n🔢 房间号示例 (前10个):');
    const sampleRooms = roomData.slice(0, 10);
    sampleRooms.forEach(room => {
      console.log(`   - ${room.id}`);
    });
    
    if (roomData.length > 10) {
      console.log('   ...');
      const lastRooms = roomData.slice(-5);
      lastRooms.forEach(room => {
        console.log(`   - ${room.id}`);
      });
    }
    
    console.log('\n🎉 房间数据初始化完成！');
    console.log('📱 现在可以通过房间号获取二维码点餐了');

  } catch (error) {
    console.error('❌ 初始化房间数据时发生错误:', error);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

// 执行初始化
initRooms();
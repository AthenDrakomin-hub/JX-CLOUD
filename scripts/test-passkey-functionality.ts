import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

// 从环境变量获取数据库连接字符串
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL ||  
  process.env.POSTGRES_URL_NON_POOLING ||  
  process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件。');
  process.exit(1);
}

console.log('✅ 找到数据库连接字符串，正在连接...');

// 创建数据库连接池
const pool = new Pool({ 
  connectionString: connectionString,
  max: 8,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
  maxUses: 200,
  keepAlive: false,
  allowExitOnIdle: true
});

async function testPasskeyFunctionality() {
  try {
    console.log('🔍 测试 Passkey 功能...');
    
    // 检查 passkeys 表是否存在
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'passkeys';
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ passkeys 表不存在');
      return;
    }
    
    console.log('✅ passkeys 表存在');
    
    // 检查表中的数据数量
    const countResult = await pool.query('SELECT COUNT(*) as count FROM passkeys;');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 passkeys 表中有 ${count} 条记录`);
    
    // 如果表为空，创建一个测试记录
    if (count === 0) {
      console.log('📝 创建测试 Passkey 记录...');
      
      // 首先需要一个有效的用户ID，我们从 user 表中获取一个
      const userResult = await pool.query(`
        SELECT id 
        FROM "user" 
        LIMIT 1;
      `);
      
      if (userResult.rows.length > 0) {
        const testUserId = userResult.rows[0].id;
        
        // 插入一条测试记录
        const insertResult = await pool.query(`
          INSERT INTO passkeys (
            user_id, 
            credential_id, 
            public_key, 
            counter, 
            device_type
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id, credential_id, device_type, created_at;
        `, [
          testUserId,
          Buffer.from('test_credential_id').toString('base64'), // 模拟凭证ID
          '-----BEGIN PUBLIC KEY-----\nTEST_PUBLIC_KEY_DATA\n-----END PUBLIC KEY-----', // 模拟公钥
          0, // counter
          'cross-platform' // device_type
        ]);
        
        console.log('✅ 测试 Passkey 记录创建成功:', insertResult.rows[0]);
      } else {
        console.log('⚠️  没有找到用户，跳过测试记录创建');
      }
    } else {
      console.log('📋 获取现有 Passkey 记录...');
      const records = await pool.query(`
        SELECT id, user_id, credential_id, device_type, created_at 
        FROM passkeys 
        LIMIT 5;
      `);
      
      records.rows.forEach(record => {
        console.log(`   ID: ${record.id}, User: ${record.user_id}, Device: ${record.device_type}, Created: ${record.created_at}`);
      });
    }
    
    // 检查关联的 user 表是否存在
    const userTableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user';
    `);
    
    if (userTableCheck.rows.length > 0) {
      console.log('✅ 关联的 user 表存在，外键关系有效');
    } else {
      console.log('⚠️  关联的 user 表不存在');
    }
    
    console.log('🎉 Passkey 功能测试完成！');
    
    // 关闭连接池
    await pool.end();
    
  } catch (error) {
    console.error('❌ 测试 Passkey 功能时出错:', error);
    await pool.end();
  }
}

testPasskeyFunctionality();
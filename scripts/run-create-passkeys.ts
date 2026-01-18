import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '../.env' });

// 如果加载失败，尝试当前目录
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env' });
}

// 从环境变量获取数据库连接字符串
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL ||  
  process.env.POSTGRES_URL_NON_POOLING ||  
  process.env.DIRECT_URL;

if (!connectionString) {
  console.error('❌ 数据库连接字符串未设置！请检查 .env 文件。');
  console.log('🔍 当前环境变量:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')));
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

async function createPasskeysTable() {
  try {
    console.log('🔧 开始创建 passkeys 表...');
    
    // 直接使用 SQL 内容
    const sqlContent = `
      -- 检查表是否已存在
      DO \$\$ 
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.tables 
                      WHERE table_schema = 'public' 
                      AND table_name = 'passkeys') THEN
          
          CREATE TABLE passkeys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            user_id TEXT NOT NULL,
            credential_id TEXT NOT NULL UNIQUE,
            public_key TEXT NOT NULL,
            counter INTEGER DEFAULT 0 NOT NULL,
            device_type TEXT NOT NULL,
            transports JSONB DEFAULT '[]'::jsonb,
            last_used_at TIMESTAMP WITH TIME ZONE,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            CONSTRAINT passkeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
          );

          -- 创建索引
          CREATE INDEX passkeys_user_id_idx ON passkeys USING btree (user_id);
          CREATE INDEX passkeys_credential_id_idx ON passkeys USING btree (credential_id);

          RAISE NOTICE '✅ passkeys 表创建成功';
        ELSE
          RAISE NOTICE 'ℹ️ passkeys 表已存在';
        END IF;
      END \$\$;
    `;
    
    // 执行 SQL
    const result = await pool.query(sqlContent);
    
    console.log('✅ passkeys 表操作完成!');
    console.log('📋 结果:', result.rows);
    
    // 检查表结构
    const checkSql = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'passkeys'
      ORDER BY ordinal_position;
    `;
    
    const checkResult = await pool.query(checkSql);
    console.log('📋 passkeys 表结构:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 关闭连接池
    await pool.end();
    
  } catch (error) {
    console.error('❌ 创建 passkeys 表时出错:', error);
    await pool.end();
  }
}

createPasskeysTable();
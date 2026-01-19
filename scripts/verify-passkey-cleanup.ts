import postgres from 'postgres';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量获取数据库连接信息
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 或 POSTGRES_URL 环境变量未设置');
  process.exit(1);
}

async function verifyPasskeyTableCleanup() {
  console.log('🔍 验证通行密钥表清理结果...');
  
  const sql = postgres(connectionString);
  
  try {
    // 检查通行密钥相关表
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%passkey%' OR table_name ILIKE '%credential%' OR table_name ILIKE '%webauthn%')
      ORDER BY table_name;
    `;
    
    console.log('📋 清理后的通行密钥相关表:');
    if (result.length === 0) {
      console.log('  ✅ 无重复的通行密钥表');
    } else {
      result.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
        
        // 显示表的详细信息
        sql`
          SELECT COUNT(*) as count FROM ${sql(row.table_name)}
        `.then(countResult => {
          console.log(`     记录数: ${countResult[0].count}`);
        }).catch(error => {
          console.log(`     无法统计记录数`);
        });
      });
    }
    
    // 特别检查标准的 passkeys 表是否存在
    const passkeysExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'passkeys'
      ) AS exists_flag;
    `;
    
    if (passkeysExists[0].exists_flag) {
      console.log('\n✅ 标准 passkeys 表存在');
      
      // 显示 passkeys 表结构
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'passkeys' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('📄 passkeys 表结构:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('\n❌ 标准 passkeys 表不存在');
    }
    
    console.log('\n🎉 通行密钥表清理验证完成！');
    
    await sql.end();
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行验证
verifyPasskeyTableCleanup();
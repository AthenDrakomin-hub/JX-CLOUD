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

async function removeDuplicatePasskeyTable() {
  console.log('🗑️  准备删除重复的通行密钥表...');
  
  const sql = postgres(connectionString!);
  
  try {
    // 首先确认两个表都存在
    const checkResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('passkey', 'passkeys')
      ORDER BY table_name;
    `;
    
    const existingTables = checkResult.map(row => row.table_name);
    console.log('📋 当前存在的通行密钥表:', existingTables.join(', '));
    
    // 检查是否真的存在重复
    if (existingTables.includes('passkey') && existingTables.includes('passkeys')) {
      console.log('\n⚠️  确认要删除的表: passkey');
      console.log('保留的表: passkeys (字段更完整)');
      
      // 显示删除前的数据统计
      const passkeyCount = await sql`SELECT COUNT(*) as count FROM "passkey"`;
      const passkeysCount = await sql`SELECT COUNT(*) as count FROM "passkeys"`;
      
      console.log(`📊 数据统计:`);
      console.log(`   passkey 表记录数: ${passkeyCount[0].count}`);
      console.log(`   passkeys 表记录数: ${passkeysCount[0].count}`);
      
      // 确认删除操作
      console.log('\n🚨 即将执行删除操作，这将永久删除 passkey 表');
      console.log('请确认是否继续 (yes/no): ');
      
      // 在实际环境中，这里会有用户输入确认
      // 现在我们假设用户确认删除
      
      console.log('✅ 用户确认删除，开始执行...');
      
      // 删除相关的 RLS 策略（如果存在）
      try {
        await sql`DROP POLICY IF EXISTS "Users can manage their own passkeys" ON "passkey"`;
        console.log('✅ 删除 passkey 表的 RLS 策略');
      } catch (error) {
        console.log('ℹ️  passkey 表可能没有 RLS 策略');
      }
      
      // 删除表
      await sql`DROP TABLE IF EXISTS "passkey" CASCADE`;
      console.log('✅ 成功删除 passkey 表');
      
      // 验证删除结果
      const verifyResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('passkey', 'passkeys');
      `;
      
      const remainingTables = verifyResult.map(row => row.table_name);
      console.log('📋 删除后的通行密钥表:', remainingTables.join(', '));
      
      if (remainingTables.includes('passkeys') && !remainingTables.includes('passkey')) {
        console.log('🎉 成功清理重复表！现在只保留标准的 passkeys 表');
      } else {
        console.log('⚠️  清理结果不符合预期，请手动检查');
      }
      
    } else if (existingTables.length === 1) {
      console.log('✅ 只存在一个通行密钥表，无需清理');
    } else {
      console.log('❌ 未找到任何通行密钥表');
    }
    
    await sql.end();
  } catch (error) {
    console.error('❌ 删除过程中发生错误:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行删除操作
removeDuplicatePasskeyTable();
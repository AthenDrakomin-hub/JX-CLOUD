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

async function insertInitialTranslations() {
  console.log('🚀 连接到数据库...');
  
  const sql = postgres(connectionString);
  
  try {
    // 检查是否已有翻译数据
    const countResult = await sql`SELECT COUNT(*) as count FROM public.translations`;
    const totalCount = parseInt(countResult[0].count);
    
    if (totalCount > 0) {
      console.log(`📊 发现 ${totalCount} 条现有翻译记录，跳过初始数据插入`);
    } else {
      console.log('📝 插入初始翻译数据...');
      
      // 插入初始翻译数据
      const initialTranslations = [
        // 中文翻译
        { key: 'welcome', language: 'zh', value: '欢迎', namespace: 'common' },
        { key: 'login', language: 'zh', value: '登录', namespace: 'auth' },
        { key: 'logout', language: 'zh', value: '退出', namespace: 'auth' },
        { key: 'dashboard', language: 'zh', value: '仪表盘', namespace: 'common' },
        { key: 'orders', language: 'zh', value: '订单', namespace: 'common' },
        { key: 'menu', language: 'zh', value: '菜单', namespace: 'common' },
        { key: 'settings', language: 'zh', value: '设置', namespace: 'common' },
        { key: 'new_order', language: 'zh', value: '新订单', namespace: 'orders' },
        { key: 'pending', language: 'zh', value: '待处理', namespace: 'orders' },
        { key: 'confirmed', language: 'zh', value: '已确认', namespace: 'orders' },
        
        // 英文翻译
        { key: 'welcome', language: 'en', value: 'Welcome', namespace: 'common' },
        { key: 'login', language: 'en', value: 'Login', namespace: 'auth' },
        { key: 'logout', language: 'en', value: 'Logout', namespace: 'auth' },
        { key: 'dashboard', language: 'en', value: 'Dashboard', namespace: 'common' },
        { key: 'orders', language: 'en', value: 'Orders', namespace: 'common' },
        { key: 'menu', language: 'en', value: 'Menu', namespace: 'common' },
        { key: 'settings', language: 'en', value: 'Settings', namespace: 'common' },
        { key: 'new_order', language: 'en', value: 'New Order', namespace: 'orders' },
        { key: 'pending', language: 'en', value: 'Pending', namespace: 'orders' },
        { key: 'confirmed', language: 'en', value: 'Confirmed', namespace: 'orders' },
        
        // 菲律宾语翻译
        { key: 'welcome', language: 'fil', value: 'Maligayang pagdating', namespace: 'common' },
        { key: 'login', language: 'fil', value: 'Mag-login', namespace: 'auth' },
        { key: 'logout', language: 'fil', value: 'Mag-log out', namespace: 'auth' },
        { key: 'dashboard', language: 'fil', value: 'Dashboard', namespace: 'common' },
        { key: 'orders', language: 'fil', value: 'Mga Order', namespace: 'common' },
        { key: 'menu', language: 'fil', value: 'Menu', namespace: 'common' },
        { key: 'settings', language: 'fil', value: 'Mga Setting', namespace: 'common' },
        { key: 'new_order', language: 'fil', value: 'Bagong Order', namespace: 'orders' },
        { key: 'pending', language: 'fil', value: 'Nakabinbin', namespace: 'orders' },
        { key: 'confirmed', language: 'fil', value: 'Nakumpirma', namespace: 'orders' },
      ];
      
      // 批量插入翻译数据
      for (const translation of initialTranslations) {
        await sql`
          INSERT INTO public.translations 
          (key, language, value, namespace, is_active)
          VALUES 
          (${translation.key}, ${translation.language}, ${translation.value}, ${translation.namespace}, true)
          ON CONFLICT (namespace, key, language) DO NOTHING
        `;
      }
      
      console.log(`✅ 成功插入 ${initialTranslations.length} 条初始翻译记录`);
    }
    
    // 统计各语言的翻译数量
    const stats = await sql`
      SELECT language, COUNT(*) as count 
      FROM public.translations 
      GROUP BY language 
      ORDER BY language
    `;
    
    console.log('\n📈 翻译统计数据:');
    stats.forEach(row => {
      console.log(`  ${row.language}: ${row.count} 条`);
    });
    
    console.log('\n🎉 初始翻译数据设置完成！');
    
    // 关闭连接
    await sql.end();
  } catch (error) {
    console.error('❌ 操作失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行插入
insertInitialTranslations();
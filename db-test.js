import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 江西云厨 - 数据库连接测试
 * 使用与生产环境相同的连接方式
 */

const getDatabaseUrl = () => {
  // 优先级：DATABASE_URL -> POSTGRES_URL
  return process.env.DATABASE_URL || 
         process.env.POSTGRES_URL || 
         "";
};

const rawConnectionString = getDatabaseUrl();

if (!rawConnectionString) {
  console.error('❌ 错误: 未找到 DATABASE_URL 或 POSTGRES_URL 环境变量');
  process.exit(1);
}

// 物理层优化：自动切换至事务分发端口 6543 并注入 SSL 协议
const getPooledUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('supabase.co')) {
      parsed.port = "6543"; 
      if (!parsed.searchParams.has('sslmode')) {
        parsed.searchParams.set('sslmode', 'require');
      }
    }
    return parsed.toString();
  } catch (e) {
    return url;
  }
};

const pooledUrl = getPooledUrl(rawConnectionString);

console.log('正在尝试连接到数据库...');
console.log('数据库URL:', pooledUrl.replace(/:\/\/.*@/, '://***@')); // 隐藏密码

try {
  // 生产级连接参数配置
  const client = postgres(pooledUrl, { 
    max: 8,                      // 连接池上限
    idle_timeout: 10,            // 空闲回收 (秒)
    connect_timeout: 10,         // 握手超时 (秒)
    prepare: false,              // 兼容事务模式
    onnotice: () => {},          // 抑制系统通知以节省日志空间
  });

  // 创建 Drizzle ORM 实例
  const db = drizzle(client);

  console.log('正在连接到数据库...');
  
  // 执行一个简单的查询来测试连接
  const result = await db.execute('SELECT NOW() as now');
  
  console.log('✅ 数据库连接成功!');
  console.log('连接时间:', result[0]?.now || 'N/A');
  console.log('数据库URL:', pooledUrl.replace(/:\/\/.*@/, '://***@')); // 隐藏密码
  
  // 尝试查询一些表来验证权限
  try {
    // 检查用户表是否存在并获取计数
    const userResult = await db.execute('SELECT COUNT(*) as count FROM "user" LIMIT 1');
    console.log('用户表记录数:', userResult[0]?.count || '无法获取');
  } catch (err) {
    console.log('提示: 无法查询用户表，可能是表名不同或权限限制:', err.message);
  }
  
  // 尝试查询其他可能的表
  try {
    // 检查菜单菜品表
    const dishResult = await db.execute('SELECT COUNT(*) as count FROM "menu_dishes" LIMIT 1');
    console.log('菜品表记录数:', dishResult[0]?.count || '无法获取');
  } catch (err) {
    console.log('提示: 无法查询菜品表:', err.message);
  }

  // 尝试查询订单表
  try {
    const orderResult = await db.execute('SELECT COUNT(*) as count FROM "orders" LIMIT 1');
    console.log('订单表记录数:', orderResult[0]?.count || '无法获取');
  } catch (err) {
    console.log('提示: 无法查询订单表:', err.message);
  }

  // 关闭连接
  await client.end();
  console.log('\n数据库连接测试完成');
  
} catch (error) {
  console.error('❌ 数据库连接失败:', error.message);
  if (error.code) {
    console.error('错误代码:', error.code);
  }
  process.exit(1);
}
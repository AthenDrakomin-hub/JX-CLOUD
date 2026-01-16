
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema.js';

/**
 * 江西云厨 - 物理连接中枢 (Vercel Serverless 优化 - 连接池模式)
 * 为 Vercel Edge 运行时和 Serverless 函数优化
 */

const getDatabaseUrl = () => {
    // Vercel 环境变量优先级
    return (process.env as any).DATABASE_URL || 
           (process.env as any).POSTGRES_URL || 
           (process.env as any).DIRECT_URL || // Supabase CLI 使用的变量
           "";
};

const rawConnectionString = getDatabaseUrl();

// 自动切换至 Supabase 事务池端口 6543 (关键优化)
const getPooledUrl = (url: string) => {
  if (!url) {
    console.error("❌ DATABASE_URL 未设置！请在 Vercel 项目设置中配置环境变量。");
    return "";
  }
  
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('supabase.co')) {
        parsed.port = "6543"; // 使用连接池端口以提高并发性能
    }
    return parsed.toString();
  } catch (e) {
    console.error("❌ 数据库连接字符串解析失败:", e);
    return url;
  }
};

const pooledUrl = getPooledUrl(rawConnectionString);

// Vercel Serverless 优化的连接池配置
const pool = new Pool({ 
  connectionString: pooledUrl,
  max: 5,           // 在 Serverless 环境中使用较小的连接池
  min: 0,
  idleTimeoutMillis: 30000,    // 30秒空闲超时
  connectionTimeoutMillis: 10000, // 10秒连接超时
  maxUses: 7500,    // 连接最大使用次数，防止内存泄漏
  keepAlive: true,  // 启用 TCP keep-alive
});

// 监听连接池事件以进行调试
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 数据库连接已建立');
  }
});

pool.on('error', (err) => {
  console.error('🚨 数据库连接池错误:', err);
});

export const db = drizzle(pool, { schema });

// 导出连接池以供手动管理连接
export { pool };
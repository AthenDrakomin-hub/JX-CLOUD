
import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '.env') });

console.log("DATABASE_URL Loaded:", !!process.env.DATABASE_URL); 
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema.js';

// 打印自检，不准再报模糊错误
console.log("🛠 [架构审计] 正在加载环境变量...");
console.log("DATABASE_URL 状态:", !!process.env.DATABASE_URL);
console.log("POSTGRES_URL 状态:", !!process.env.POSTGRES_URL);
console.log("当前读取到的 ENV 键名:", Object.keys(process.env));

/**
 * 江西云厨 - 物理连接中枢 (Vercel Serverless 优化 - 连接池模式)
 * 为 Vercel Edge 运行时和 Serverless 函数优化
 */

// 架构师指令：优先寻找 Vercel 注入的各种可能的连接字符串
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL ||  // Vercel 自动关联 Supabase 时生成的变量名
  process.env.POSTGRES_URL_NON_POOLING ||  // Vercel 自动关联 Supabase 时生成的变量名
  process.env.DIRECT_URL; // Supabase CLI 使用的变量

if (!connectionString) {
  throw new Error("❌ 严重错误：.env 文件存在但未被正确加载，请检查路径或 dotenv 配置！");
}

// 强制检查数据库连接字符串
const isProductionDB = !!connectionString;

if (isProductionDB) {
  console.log("🚀 生产数据库已就绪，正在关闭 Demo 模式...");
  // 初始化 Drizzle 生产连接
} else {
  console.warn("⚠️ 未检测到数据库连接字符串，系统进入演示模式。");
}

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

const pooledUrl = getPooledUrl(connectionString);

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
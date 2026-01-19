
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema';

/**
 * 江西云厨 - 物理连接中枢 (Server-side Only)
 * 严格遵循 Vercel Edge Runtime 优化规范
 */

const getDatabaseUrl = () => {
    // 优先级：DATABASE_URL -> POSTGRES_URL
    return (process.env as any).DATABASE_URL || 
           (process.env as any).POSTGRES_URL || 
           "";
};

const rawConnectionString = getDatabaseUrl();

// 物理层优化：自动切换至事务分发端口 6543 并注入 SSL 协议
const getPooledUrl = (url: string) => {
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

// 生产级连接参数配置
const client = postgres(pooledUrl, { 
  max: 8,                      // 连接池上限
  idle_timeout: 10,            // 空闲回收 (秒)
  connect_timeout: 3,          // 握手超时 (秒)
  prepare: false,              // 兼容事务模式
  onnotice: () => {},          // 抑制系统通知以节省日志空间
});

export const db = drizzle(client, { schema });

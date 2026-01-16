
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema.js';

/**
 * 江西云厨 - 物理连接中枢 (Vercel Serverless 优化)
 */

const getDatabaseUrl = () => {
    return (process.env as any).DATABASE_URL || 
           (process.env as any).POSTGRES_URL || // Vercel 默认注入的变量名
           "";
};

const rawConnectionString = getDatabaseUrl();

// 自动切换至 Supabase 事务池端口 6543
const getPooledUrl = (url: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('supabase.co')) {
        parsed.port = "6543"; 
    }
    return parsed.toString();
  } catch (e) {
    return url;
  }
};

const pooledUrl = getPooledUrl(rawConnectionString);

// Serverless 环境关键：限制 max 连接数以防池溢出
const client = postgres(pooledUrl, { 
  max: 5, 
  idle_timeout: 10,
  connect_timeout: 10,
  prepare: false 
});

export const db = drizzle(client, { schema });
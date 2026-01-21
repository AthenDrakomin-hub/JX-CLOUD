// drizzle/schema.js - 用于Supabase Edge Functions的Drizzle Schema导出
// 这个文件是为了满足Supabase Edge Functions的导入需求

// 由于ESM模块系统，我们在Edge Functions中需要导出schema
import * as schema from '../schema.ts';

// 导出所有内容
export { schema };
export * from '../schema.ts';
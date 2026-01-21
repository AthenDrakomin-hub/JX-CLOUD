import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { 
  user, session, account, verification, passkeys,
  users, menuDishes, orders, paymentMethods
} from '../schema';

// 不要直接提交敏感信息到代码中
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 环境变量未设置');
  process.exit(1);
}

// 注意：在生产环境中，您应该使用连接池配置而不是直接连接
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function runMigrations() {
  console.log('🚀 开始数据库迁移...');
  
  try {
    // 检查 translations 表是否存在
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'translations'
      ) AS table_exists;
    `);
    
    const tableExists = result.rows[0].table_exists;
    
    if (tableExists) {
      console.log('✅ translations 表已存在');
    } else {
      console.log('⚠️  translations 表不存在，正在创建...');
      
      // 手动创建 translations 表
      await db.execute(`
        CREATE TABLE IF NOT EXISTS public.translations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(200) NOT NULL,
          language VARCHAR(10) NOT NULL,
          value TEXT NOT NULL,
          namespace VARCHAR(50) NOT NULL DEFAULT 'common',
          context JSONB,
          version INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          CONSTRAINT uk_translations_key_lang_ns UNIQUE (namespace, key, language)
        );
      `);
      
      // 创建索引
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_translations_language ON public.translations(language);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_translations_namespace ON public.translations(namespace);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_translations_active ON public.translations(is_active) WHERE is_active = true;`);
      
      // 创建更新触发器函数
      await db.execute(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // 创建触发器
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS update_translations_updated_at 
        BEFORE UPDATE ON public.translations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      
      console.log('✅ translations 表创建成功');
    }
    
    // 启用 RLS 策略
    await db.execute(`
      ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
    `);
    
    // 创建 RLS 策略
    await db.execute(`
      DROP POLICY IF EXISTS "Allow public read translations" ON public.translations;
      CREATE POLICY "Allow public read translations" ON public.translations
        FOR SELECT USING (is_active = true);
    `);
    
    await db.execute(`
      DROP POLICY IF EXISTS "Allow admin write translations" ON public.translations;
      CREATE POLICY "Allow admin write translations" ON public.translations
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
          )
        );
    `);
    
    console.log('✅ 数据库迁移完成！');
    
    // 关闭连接
    await client.end();
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    await client.end();
    process.exit(1);
  }
}

runMigrations();
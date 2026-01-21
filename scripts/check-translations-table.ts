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

async function checkOrCreateTranslationsTable() {
  console.log('🚀 连接到数据库...');
  
  const sql = postgres(connectionString!);
  
  try {
    // 检查 translations 表是否存在
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'translations'
      ) AS table_exists;
    `;
    
    const tableExists = result[0].table_exists;
    
    if (tableExists) {
      console.log('✅ translations 表已存在于数据库中');
    } else {
      console.log('⚠️  translations 表不存在，正在创建...');
      
      // 创建 translations 表
      await sql`
        CREATE TABLE public.translations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(200) NOT NULL,                       -- 翻译键: welcome_message
          language VARCHAR(10) NOT NULL,                   -- 语言代码: zh, en, fil
          value TEXT NOT NULL,                             -- 翻译内容
          namespace VARCHAR(50) NOT NULL DEFAULT 'common', -- 命名空间: common, auth, orders, etc.
          context JSONB,                                   -- 动态参数模板: {"name": "string", "count": "number"}
          version INTEGER DEFAULT 1,                       -- 版本控制
          is_active BOOLEAN DEFAULT true,                  -- 是否启用
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          -- 唯一约束: 同一命名空间+键+语言只能有一条
          CONSTRAINT uk_translations_key_lang_ns UNIQUE (namespace, key, language)
        );
      `;
      
      // 创建索引
      await sql`CREATE INDEX idx_translations_key ON public.translations(key);`;
      await sql`CREATE INDEX idx_translations_language ON public.translations(language);`;
      await sql`CREATE INDEX idx_translations_namespace ON public.translations(namespace);`;
      await sql`CREATE INDEX idx_translations_active ON public.translations(is_active) WHERE is_active = true;`;
      
      // 创建更新触发器函数
      await sql`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // 创建触发器
      await sql`
        CREATE TRIGGER update_translations_updated_at 
        BEFORE UPDATE ON public.translations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
      
      // 启用 RLS (行级安全)
      await sql`ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;`;
      
      // 创建 RLS 策略
      await sql`
        CREATE POLICY "Allow public read translations" ON public.translations
          FOR SELECT USING (is_active = true);
      `;
      
      await sql`
        CREATE POLICY "Allow admin write translations" ON public.translations
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE users.id = auth.uid()::text 
              AND users.role = 'admin'
            )
          );
      `;
      
      console.log('✅ translations 表创建成功');
    }
    
    // 检查表结构是否完整
    console.log('🔍 检查表结构完整性...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'translations'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 translations 表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not nullable'})`);
    });
    
    console.log('🎉 数据库检查/更新完成！');
    
    // 关闭连接
    await sql.end();
  } catch (error) {
    console.error('❌ 操作失败:', error);
    await sql.end();
    process.exit(1);
  }
}

// 执行检查
checkOrCreateTranslationsTable();
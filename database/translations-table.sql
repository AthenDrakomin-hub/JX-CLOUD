-- 翻译字典表
CREATE TABLE IF NOT EXISTS public.translations (
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

-- 创建索引
CREATE INDEX idx_translations_key ON public.translations(key);
CREATE INDEX idx_translations_language ON public.translations(language);
CREATE INDEX idx_translations_namespace ON public.translations(namespace);
CREATE INDEX idx_translations_active ON public.translations(is_active) WHERE is_active = true;

-- 启用 RLS (行级安全)
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- 策略: 允许匿名读取
CREATE POLICY "Allow public read translations" ON public.translations
  FOR SELECT USING (is_active = true);

-- 策略: 仅 Admin 可写
CREATE POLICY "Allow admin write translations" ON public.translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_translations_updated_at 
  BEFORE UPDATE ON public.translations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 修复 translations 表的约束问题
-- 1. 添加主键约束（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'translations_pkey') THEN
    ALTER TABLE translations ADD CONSTRAINT translations_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- 2. 添加复合唯一约束，防止重复的 key-language-namespace 组合
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_key_lang_namespace') THEN
    ALTER TABLE translations ADD CONSTRAINT unique_key_lang_namespace UNIQUE (key, language, namespace);
  END IF;
END $$;

-- 3. 确保必要字段不为空
ALTER TABLE translations ALTER COLUMN key SET NOT NULL;
ALTER TABLE translations ALTER COLUMN language SET NOT NULL;
ALTER TABLE translations ALTER COLUMN value SET NOT NULL;

-- 4. 更新现有记录，确保字段值符合要求
UPDATE translations SET namespace = 'common' WHERE namespace IS NULL OR namespace = '';
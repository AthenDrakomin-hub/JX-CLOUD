-- Supabase Storage Bucket Configuration for JX Cloud

-- 1. 创建 materials 存储桶
INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('materials', 'materials', NULL, true, false, 5242880, 
   ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

-- 2. 设置存储桶策略 - 允许所有用户读取
CREATE POLICY "Allow public read access to materials bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');

-- 3. 设置存储桶策略 - 允许认证用户上传
CREATE POLICY "Allow authenticated users upload to materials bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- 4. 设置存储桶策略 - 允许认证用户更新
CREATE POLICY "Allow authenticated users update materials bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'materials');

-- 5. 设置存储桶策略 - 允许认证用户删除
CREATE POLICY "Allow authenticated users delete from materials bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');
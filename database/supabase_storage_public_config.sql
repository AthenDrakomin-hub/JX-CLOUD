-- Supabase Storage Bucket Configuration for JX Cloud
-- Public access policies for shared image assets

-- 1. 创建 materials 存储桶 (如果不存在)
INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('materials', 'materials', NULL, true, false, 5242880, 
   ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧的策略
DROP POLICY IF EXISTS "Allow public read access to materials bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users upload to materials bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users update materials bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users delete from materials bucket" ON storage.objects;
DROP POLICY IF EXISTS "Materials bucket authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Materials bucket authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Materials bucket authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Materials bucket authenticated delete" ON storage.objects;

-- 3. 创建策略 - 允许认证用户上传（基于所有者）
CREATE POLICY "Materials bucket authenticated insert" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials'
  AND (
    owner_id = (SELECT auth.uid()) 
    OR (metadata ->> 'owner') = (SELECT auth.uid())::text
  )
);

-- 4. 创建策略 - 允许认证用户更新（基于所有者）
CREATE POLICY "Materials bucket authenticated update" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materials'
  AND (
    owner_id = (SELECT auth.uid()) 
    OR (metadata ->> 'owner') = (SELECT auth.uid())::text
  )
)
WITH CHECK (
  bucket_id = 'materials'
  AND (
    owner_id = (SELECT auth.uid()) 
    OR (metadata ->> 'owner') = (SELECT auth.uid())::text
  )
);

-- 5. 创建策略 - 允许认证用户删除（基于所有者）
CREATE POLICY "Materials bucket authenticated delete" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials'
  AND (
    owner_id = (SELECT auth.uid()) 
    OR (metadata ->> 'owner') = (SELECT auth.uid())::text
  )
);

-- 6. 创建策略 - 允许所有人读取（公开访问）
CREATE POLICY "Materials bucket public select" ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');
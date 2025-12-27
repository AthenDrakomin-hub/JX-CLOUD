# Supabase 存储桶设置指南

## 创建存储桶

要为JX Cloud项目设置图片素材库的Supabase存储桶，请按照以下步骤操作：

### 1. 在Supabase控制台中创建存储桶

1. 登录到您的Supabase仪表板
2. 导航到 `Storage` 部分
3. 点击 `New bucket`
4. 输入桶名称：`materials`
5. 设置为公开访问（Public Access）

### 2. 使用SQL脚本配置策略（推荐：公开访问版本）

运行以下SQL脚本以设置适合共享图片素材的存储桶策略：

```sql
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
```

### 3. 环境变量

确保您的环境变量已正确配置：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 功能说明

- 图片上传限制为5MB
- 支持的图片格式：PNG, JPEG, JPG, WEBP, GIF
- 上传的图片存储在 `materials/public/` 路径下
- 文件名会自动生成唯一标识符以避免冲突
- 每个文件的所有权与上传用户关联
- 所有者可以管理自己的文件，但所有用户都可以查看图片

### 5. 安全考虑

- 认证用户可以上传、更新和删除自己的文件
- 所有用户都可以查看存储桶中的图片（适用于菜单图片等共享资源）
- 文件大小限制防止恶意大文件上传
- 使用唯一文件名避免覆盖攻击
- 所有者验证通过auth.uid()实现
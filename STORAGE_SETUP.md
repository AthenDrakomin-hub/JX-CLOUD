# Supabase 存储桶设置指南

## 创建存储桶

要为JX Cloud项目设置图片素材库的Supabase存储桶，请按照以下步骤操作：

### 1. 在Supabase控制台中创建存储桶

1. 登录到您的Supabase仪表板
2. 导航到 `Storage` 部分
3. 点击 `New bucket`
4. 输入桶名称：`materials`
5. 设置为公开访问（Public Access）

### 2. 使用SQL脚本配置策略

运行以下SQL脚本以设置正确的存储桶策略：

```sql
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
- 上传的图片具有公开访问权限
- 文件名会自动生成唯一标识符以避免冲突

### 5. 安全考虑

- 存储桶策略限制了上传权限为认证用户
- 文件大小限制防止恶意大文件上传
- 使用唯一文件名避免覆盖攻击
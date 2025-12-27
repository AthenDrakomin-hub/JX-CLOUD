# 部署说明

## 环境变量配置

在Vercel部署时，请设置以下环境变量：

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 部署步骤

1. Fork此仓库
2. 在Vercel中导入仓库
3. 在环境变量设置中添加上述变量
4. 部署完成

## Supabase配置

确保在Supabase项目中：

1. 已创建materials存储桶
2. 已运行database/supabase_storage_public_config.sql中的策略配置
3. 已启用orders表的Realtime功能
4. 已创建storage.objects_owner_updates审计表
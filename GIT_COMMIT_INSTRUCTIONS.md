# Git 提交说明

## 要执行的 Git 命令：

```bash
# 1. 检查当前状态
git status

# 2. 添加所有更改的文件（包括新创建的文档）
git add .

# 3. 提交更改
git commit -m "feat(docs): 整理文档结构，将所有文档移至 docs/ 目录

- 将所有文档文件移动到 docs/ 目录
- 更新 .vercelignore 以排除 docs/ 目录和 supabase 工具文件
- 创建 docs/README.md 说明文档结构
- 清理根目录，使结构更简洁
- 添加部署相关文档和验证报告"

# 4. 推送到远程仓库
git push origin main
```

## 更改摘要：
- 所有文档已移至 docs/ 目录
- 根目录已清理
- .vercelignore 已更新
- 添加了 supabase.exe 和 supabase.tar.gz 到忽略列表
- 创建了文档结构说明
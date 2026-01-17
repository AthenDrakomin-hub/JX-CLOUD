# Vite Illegal Import Fix Tools

一套用于检测和修复Vite项目中"非法引用链路"错误的工具集合。

## 工具列表

### 1. `quick-vite-check.js` - 快速检查器
**用途**: 快速扫描当前项目中的Vite非法数据库导入
**特点**: 只检查当前项目文件，避免系统文件干扰
**使用方法**: 
```bash
node quick-vite-check.js
```

### 2. `smart-db-checker.js` - 智能检查器
**用途**: 智能区分前后端文件，提供详细分析
**特点**: 能识别真正的前端组件vs后端脚本
**使用方法**:
```bash
node smart-db-checker.js
```

### 3. `check-project-db-imports.js` - 项目扫描器
**用途**: 扫描整个项目目录结构寻找非法导入
**特点**: 项目级扫描，包含修复建议
**使用方法**:
```bash
node check-project-db-imports.js
```

### 4. `vite-db-fix-helper.js` - 综合修复助手
**用途**: 全面的Vite非法导入检测和修复建议
**特点**: 最详细的分析和修复指导
**使用方法**:
```bash
node vite-db-fix-helper.js
```

## 常见问题解决

### 错误信息
```
Illegal reference chain error
This error usually occurs when frontend components execute import { db } from 'services/db'
```

### 正确做法
```javascript
// ❌ 错误 - 前端直接导入数据库
import { db } from '../services/db';
const users = await db.query('SELECT * FROM users');

// ✅ 正确 - 通过API通信
import { api } from '../api/client';
const users = await api.getUsers();
```

## 使用建议

1. **首次使用**: 运行 `quick-vite-check.js` 快速检查
2. **详细分析**: 使用 `smart-db-checker.js` 获取详细报告  
3. **全面扫描**: 用 `vite-db-fix-helper.js` 进行完整项目检查
4. **定期检查**: 在项目重构或添加新功能后运行检查

## 文件结构示例

```
项目根目录/
├── src/
│   ├── components/          # 前端组件（不应有db导入）
│   ├── api/                # API客户端（前端可导入）
│   └── pages/              # 页面组件（不应有db导入）
├── services/
│   └── db.server.ts        # 数据库服务（仅后端导入）
└── scripts/                # 后端脚本（可导入db）
```

## 注意事项

- 这些工具专注于检测可能导致Vite构建失败的非法导入
- 工具会自动排除node_modules和其他系统目录
- 建议在应用修复后重新运行检查确认问题已解决
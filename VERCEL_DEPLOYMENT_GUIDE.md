# Vercel 部署验证指南

## 1. 环境变量验证

### 在 Vercel 控制台中验证环境变量

1. 登录到 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 Settings → Environment Variables
4. 确保设置了以下变量：

```
VITE_SUPABASE_URL=https://zlbemopcgjohrnyyiwvs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Njg5MzksImV4cCI6MjA4MTQ0NDkzOX0.MTqfElN2lL2JvRrQ3jW2vV4YzX6C8yA9bR1D3eF5gH7
VITE_BETTER_AUTH_URL=https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/better-auth
VITE_BETTER_AUTH_SECRET=JiangxiJiudianSuperSecret2025Admin
VITE_BETTER_AUTH_JWKS_URL=https://www.jiangxijiudian.store/api/auth/jwks
```

### 验证环境变量是否生效

在浏览器控制台中运行：
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('BetterAuth URL:', import.meta.env.VITE_BETTER_AUTH_URL);
console.log('Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

## 2. 网络和跨域问题排查

### 常见问题及解决方案

1. **CORS 错误**：
   - 检查 `vercel.json` 中的 headers 配置
   - 确保 Supabase 项目中允许 Vercel 部署的域名

2. **请求超时**：
   - 亚太地区网络延迟较高，已在客户端配置中增加超时时间
   - 使用 `src/utils/network-diagnosis.ts` 进行网络质量检测

3. **认证失败**：
   - 验证 BetterAuth URL 格式是否正确
   - 检查 JWKS URL 是否可访问

## 3. 修复方案

### 代码修改

1. **Supabase 客户端优化** (`services/supabaseClient.ts` 和 `src/services/supabaseClient.ts`)
   - 增加网络超时处理
   - 针对亚太地区网络优化配置
   - 添加重试机制

2. **BetterAuth 客户端优化** (`src/services/frontend/auth-client.frontend.ts`)
   - 自定义 fetch 实现处理跨域和超时
   - 添加连接诊断功能

3. **Vercel 配置优化** (`vercel.json`)
   - 添加 CORS 头配置
   - 优化区域设置以减少延迟
   - 调整函数内存和超时设置

## 4. Vercel 日志查看方法

### 实时日志查看

1. **通过 CLI**：
   ```bash
   vercel logs your-project-name.vercel.app
   ```

2. **通过 Dashboard**：
   - 进入项目页面
   - 点击 "Logs" 标签页
   - 选择要查看的部署版本

### 浏览器开发者工具

1. 打开开发者工具 (F12)
2. 查看 Console 标签页查看错误信息
3. 查看 Network 标签页查看 API 请求状态

### 运行诊断工具

在应用中运行网络诊断：
```javascript
import { generateDiagnosticReport } from './src/utils/network-diagnosis';
const report = await generateDiagnosticReport();
console.log(report);

// 或者单独诊断各组件
import { diagnoseConnection } from './src/services/supabaseClient';
import { diagnoseBetterAuth } from './src/services/frontend/auth-client.frontend';
const supabaseDiagnosis = await diagnoseConnection();
const betterAuthDiagnosis = await diagnoseBetterAuth();
```

## 5. 部署后验证步骤

1. **部署完成后等待几分钟**让所有服务启动
2. **访问应用**并打开浏览器开发者工具
3. **运行环境变量验证**代码确认配置正确
4. **测试主要功能**如登录、数据读取等
5. **查看控制台和网络标签**确认无错误

## 6. 针对亚太地区的特殊配置

- `vercel.json` 中设置了 `regions: ["hnd1"]` 以使用日本东京区域，减少亚太地区用户延迟
- 在客户端增加了较长的超时时间（30秒）以应对网络波动
- 添加了网络质量检测工具以便监控性能
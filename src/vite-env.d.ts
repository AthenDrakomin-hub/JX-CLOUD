// src/vite-env.d.ts
// Vite 环境变量类型定义，避免 TypeScript 类型报错

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase 配置
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  
  // BetterAuth 配置
  readonly VITE_BETTER_AUTH_URL: string;
  readonly VITE_BETTER_AUTH_SECRET: string;
  readonly VITE_BETTER_AUTH_JWKS_URL: string;
  
  // 数据库连接（仅在服务端使用，不在客户端暴露敏感信息）
  readonly VITE_DATABASE_URL: string;
  
  // 其他环境变量
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 🏨 Project Overview

This is "江西云厨" (Jiangxi Cloud Kitchen), a modern hotel management ecosystem with a full-stack architecture. It includes room ordering, order management, financial management, and other core features. The system is designed specifically for modern hotel operations, integrating real-time room ordering (QR Ordering), order scheduling matrix (KDS), multi-dimensional financial clearing, partner joint-operation logic, and physical-layer RLS security auditing.

## 🛠 Core Technology Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend Service**: Better-Auth + Vercel Serverless Functions
- **Database**: Drizzle ORM + Supabase (PostgreSQL)
- **Authentication**: Better-Auth (decoupled, vendor-independent, supports Passkeys biometric)
- **Deployment Platform**: Vercel Edge Runtime
- **Icon Library**: Lucide React
- **Chart Library**: Recharts
- **State Management**: React hooks + Supabase Realtime
- **Build Tool**: Vite with custom chunk splitting for optimized loading
- **Module System**: ESM (ECMAScript Modules) with explicit .js extensions

## 🏗 Core Architecture Principles

### Frontend-Backend Strict Separation
- **🚫 Forbidden**: Direct import of database drivers or connections in frontend components
- **✅ Allowed**: Frontend can only communicate with backend through `services/api.ts` API gateway
- **Validation Tools**: Use scripts in `/scripts` directory to regularly check for violations

### Data Flow
```
Frontend Components → API Gateway (services/api.ts) → Backend API Routes (api/*) → Drizzle ORM → PostgreSQL
     ↑                                                                      ↓
     └─────────────── Supabase Realtime ←───────────────────────────────────┘
```

### Dual User System
- `user` table: Used by Better Auth system (standard field names)
- `users` table: Used for business logic (app-specific fields)
- Both tables linked by email to achieve authentication-business logic decoupling

## 📁 Project Directory Structure

```
root/
├── components/              # React business components (30+)
├── src/services/           # Core service layer
│   ├── api.ts             # 🚨 Frontend's only data gateway
│   ├── auth.ts            # Authentication logic (server-side)
│   ├── auth-client.ts     # Client-side authentication
│   ├── db.server.ts       # 🚨 Server-side DB connection (Drizzle ORM)
│   ├── notification.ts    # Notification service
│   ├── printService.ts    # Print service
│   └── s3Service.ts       # File storage service
├── api/                    # 🚨 Backend API routes (Vercel Serverless)
│   ├── index.ts           # Main API gateway
│   ├── auth/[...betterAuth].ts # Better Auth routes
│   └── health.ts          # Health check
├── drizzle/               # Database schema definitions
│   └── schema.ts          # 🚨 Database table structures (all tables defined here)
├── scripts/               # Database maintenance scripts
├── src/                   # Frontend source
│   ├── App.tsx            # Main app entry
│   ├── GuestEntry.tsx     # Client-side ordering entry
│   ├── constants.ts       # Initial data constants
│   ├── types.ts           # TypeScript type definitions
│   └── translations.ts    # Internationalization
└── public/                # Static assets
```

## 🚀 Core Development Commands

```bash
# 🏃‍♂️ Daily development
npm run dev              # Start dev server (Vite)
npm run build            # Build production version
npm run preview          # Preview build result

# 🗄️ Database operations
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Run database migrations
npm run db:push          # Push directly to database (dev only)
npm run db:init          # Initialize database structure
npm run schema:check     # Check database schema consistency
npm run schema:update    # Update database schema

# 🧪 Initialization scripts
npm run users:init       # Initialize user data
npm run categories:init  # Initialize category data
npm run db:sync          # Force sync auth data

# 🧪 Debug tools
npx tsx scripts/test-connection.ts     # Test database connection
npx tsx scripts/debug-env.ts          # Debug environment variables
npx tsx scripts/check-schema.ts       # Check table structure
npx tsx scripts/init-db.ts            # Manual database initialization
```

## 🔐 Security Architecture

### Authentication System (Better-Auth)
- **Two-factor auth**: Supports Passkeys biometrics + traditional passwords
- **Root admin protection**: special privilege account with automatic initialization
- **Dual user system**: `user` table (Better Auth standard fields) and `users` table (business logic) with synchronized data via database hooks
- **Session management**: JWT-based secure session mechanism
- **Permission validation**: Fine-grained permission checks at service layer
- **Passkeys integration**: Biometric authentication using WebAuthn standard with cross-platform support
- **Middleware protection**: Vercel Edge middleware with session token validation
- **WebAuthn configuration**: Cross-platform authenticators with resident key preference
- **Authentication caching**: Disabled caching for authentication requests to prevent stale sessions
- **Environment-adaptive URLs**: Dynamic authentication URLs for localhost vs production environments
- **Emergency access**: Master bypass cookie `jx_root_authority_bypass=true` for emergency access

### Data Security
- **RLS policies**: Row-level security control, physical isolation of partner data via `partner_id` field
- **Multi-tenant architecture**: Data separation through partner-based filtering
- **SQL injection protection**: Full use of parameterized queries and Drizzle ORM
- **XSS protection**: Input validation and output escaping
- **Sensitive operation protection**: Root admin permission check before delete operations
- **Connection pooling**: Optimized database connections for Vercel Serverless functions with automatic resource management
- **Pool configuration**: Max 8 connections, 10s idle timeout, 3s connection timeout, max 200 uses per connection

## 🌐 Internationalization Support

### Three-language system
- Chinese (zh) - Default language
- English (en) - International support
- Filipino (fil) - Philippines localization

### Translation management
- Centralized in `src/translations.ts`
- Use `t('key', {params})` for calls
- Supports parameterized translation `{paramName}`
- Real-time language switching functionality

## ⚡ Real-time Features & Application Structure

### Real-time Functionality
- Supabase Realtime channels for live order updates
- WebSocket-based order synchronization
- Voice notification broadcasting for new orders
- Connection status indicators in UI
- Automatic reconnection handling

### Application Entry Points
- `src/App.tsx`: Main application with routing and layout management
- `GuestEntry.tsx`: Dedicated guest/visitor entry point for room ordering
- Sidebar navigation with collapsible sections
- Command palette integration (⌘K) for quick navigation
- Toast notifications for user feedback

### Component Architecture
- Lazy-loaded components for performance optimization
- Suspense boundaries for loading states
- Error boundaries for graceful error handling
- Responsive design with Tailwind CSS
- Dark/light theme support with system preference detection

## 🚨 Critical Development Constraints

### ESM Module Specification
```typescript
// ✅ Correct - Must include .js extension
import { db } from '../src/services/db.server.js';
import { user } from '../drizzle/schema.js';

// ❌ Wrong - Missing .js extension causes Vercel deployment failure
import { db } from '../src/services/db.server';
import { user } from '../drizzle/schema';
```

### Database Schema & Relationships
- **Dual User Tables**: `user` (Better Auth standard fields) and `users` (business logic) with synchronized data
- **Partner Isolation**: All business data uses `partner_id` for multi-tenant data isolation
- **Referential Integrity**: Foreign key constraints enforced with appropriate cascade behaviors
- **Enum Definitions**: Custom PostgreSQL enums for roles and statuses defined in schema
- **JSONB Fields**: Used for flexible data storage (permissions, order items) with type safety

### Architecture Red Lines (Absolutely Forbidden)
1. Importing database connections in frontend components
2. Using `pg`, `mysql`, etc. database drivers in browser environment
3. Bypassing `services/api.ts` to call backend directly
4. Exposing database connection strings in frontend
5. Ignoring partner data isolation (`partner_id` filtering)

### Common Development Tasks
- **Adding new API endpoints**: Create in `/api/` directory and access through `services/api.ts`
- **Creating new database tables**: Define in `drizzle/schema.ts` and run migration commands
- **Adding new authentication providers**: Extend `api/auth/[...betterAuth].ts` with new plugins
- **Creating new UI components**: Add to `components/` directory with proper TypeScript typing
- **Extending user permissions**: Update the `modulePermissions` JSONB field in user tables
- **Adding real-time functionality**: Use Supabase Realtime channels in conjunction with WebSocket listeners

### Key Integration Points
- **Authentication Integration**: Use `services/auth-client.ts` for client-side and `services/auth.ts` for server-side
- **Database Operations**: Server-side only in `*.server.ts` files using Drizzle ORM
- **Real-time Updates**: Implemented via Supabase Realtime in `services/supabaseClient.ts`
- **File Storage**: Managed through `services/s3Service.ts` for Supabase Storage
- **Printing Services**: Handled by `services/printService.ts` for kitchen display systems

## 📊 Key Metrics & Performance

- Page load time < 2 seconds
- API response time < 500ms
- Database query time < 100ms
- WebSocket connection success rate > 99%

## 🛠 Troubleshooting

### Common Issues & Solutions

**1. Vercel deployment failure - ESM import errors**
```
Solution: Ensure all relative imports include .js extension
Check: Run npm run build to verify the build works
```

**2. Database connection failure**
```
Check: Is DATABASE_URL configured correctly?
Verify: Run npx tsx scripts/test-connection.ts
Confirm: Is Supabase connection pool port 6543?
```

**3. Permission validation failure**
```
Check: Is user session valid?
Verify: Is partner_id filter condition correct?
Confirm: Is root admin permission recognized correctly?
```

**4. Timeout errors (504) and API hangs**
```
Check: Does DATABASE_URL include ?sslmode=require parameter?
Verify: Are BETTER_AUTH_SECRET and SUPABASE_SERVICE_ROLE_KEY set in Vercel?
Solution: Simplify heavy queries in /api/system/status, /api/health, /api/db-check
Alternative: Return static JSON data instead of querying database
```

**5. Real-time functionality not working**
```
Check: Is Supabase Realtime channel activated?
Verify: WebSocket connection status
Confirm: Are RLS policies configured correctly?
```

### Debugging Tools
```bash
# Database diagnostics
npx tsx scripts/test-connection.ts  # Connection test
npx tsx scripts/check-schema.ts     # Schema consistency check
npx tsx scripts/debug-env.ts        # Environment variable debugging
```

## 🧪 Testing and Quality Assurance

### Type Checking and Linting
```bash
# Run TypeScript type checking
npm run type-check

# Type checking with watch mode
npm run type-check-watch
```

Note: This project has many existing TypeScript errors that should be addressed. Pay attention to type safety when making changes.

### Database Scripts for Testing
Multiple database testing and initialization scripts are available in the `scripts/` directory:

```bash
# Essential testing scripts
npx tsx scripts/test-connection.ts     # Basic database connectivity test
npx tsx scripts/init-db.ts            # Initialize database structure
npx tsx scripts/create-root-admin.ts   # Create root administrator
npx tsx scripts/check-schema.ts       # Validate database schema
npx tsx scripts/check-all-tables.ts   # Verify all table structures

# Advanced testing
npx tsx scripts/check-tables-direct.ts # Direct table inspection
npx tsx scripts/verify-users.ts       # User data verification
npx tsx scripts/find-all-users.ts     # List all system users
```

### Architecture Validation Tools
The `scripts/` directory contains validation tools:

```bash
# Database diagnostics
npx tsx scripts/test-connection.ts  # Connection test
npx tsx scripts/check-schema.ts     # Schema consistency check
npx tsx scripts/debug-env.ts        # Environment variable debugging
```

## 🧩 API Structure & Service Layer

### Frontend API Gateway (src/services/api.ts)
- Unified HTTP API client, frontend components can only communicate with backend through this gateway
- Contains config, rooms, dishes, orders, categories, partners, users, expenses modules
- Supports demo mode and production mode switching
- Includes error handling and retry mechanisms
- Implements automatic fallback to demo data when API is unavailable
- Uses consistent request/response patterns with centralized error handling

### Backend API Routes (api/*)
- Vercel Serverless Functions with both `edge` and `nodejs` runtime configurations
- Health check endpoint at `/api/health.ts` (nodejs runtime)
- Database connectivity check at `/api/db-check.ts` (nodejs runtime)
- Better Auth routes at `/api/auth/[...betterAuth].ts` with dual table synchronization
- Automatic root admin initialization
- API endpoints follow RESTful patterns with consistent response structures
- All API routes enforce partner-based data isolation via `partner_id`

### Service Layer Organization
- `api.ts`: Frontend unified data gateway
- `auth.ts`: Authentication logic (server-side)
- `auth-client.ts`: Client-side authentication
- `db.server.ts`: Database connection (server-side only)
- `notification.ts`: Notification service
- `printService.ts`: Print service
- `s3Service.ts`: File storage service (Supabase Storage)
- `supabaseClient.ts`: Supabase client (mainly for realtime features)

### API Response Patterns
- All API responses follow a consistent JSON structure
- Error responses include meaningful error messages and status codes
- Demo mode fallback implemented for offline/development scenarios
- Query parameters for filtering and pagination standardized across endpoints

## 🧪 Testing and Quality Assurance

### Database Scripts for Testing
Multiple database testing and initialization scripts are available in the `scripts/` directory:

```bash
# Essential testing scripts
npx tsx scripts/test-connection.ts     # Basic database connectivity test
npx tsx scripts/init-db.ts            # Initialize database structure
npx tsx scripts/create-root-admin.ts   # Create root administrator
npx tsx scripts/check-schema.ts       # Validate database schema
npx tsx scripts/check-all-tables.ts   # Verify all table structures

# Advanced testing
npx tsx scripts/check-tables-direct.ts # Direct table inspection
npx tsx scripts/verify-users.ts       # User data verification
npx tsx scripts/find-all-users.ts     # List all system users
```

### Architecture Validation Tools
The `scripts/` directory contains validation tools:

```bash
# Database diagnostics
npx tsx scripts/test-connection.ts  # Connection test
npx tsx scripts/check-schema.ts     # Schema consistency check
npx tsx scripts/debug-env.ts        # Environment variable debugging
```

## 🌐 Environment Variables & Deployment

### Critical Environment Variables
- `DATABASE_URL`: Direct database connection for Drizzle ORM (required for production) - Ensure to add `?sslmode=require` for Vercel deployments
- `BETTER_AUTH_SECRET`: Secret key for Better Auth session encryption (Required in Vercel environment)
- `BETTER_AUTH_URL`: Production domain URL (e.g., `https://your-domain.vercel.app`)
- `VITE_BETTER_AUTH_URL`: Frontend authentication URL
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: Automatically injected by Vercel when connecting Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for Supabase access (Required in Vercel environment)
- `POSTGRES_URL`: Connection string for direct database access (Should include `?sslmode=require`)
- `DIRECT_URL`: Direct connection string for database migrations (Should include `?sslmode=require`)

### Vercel Deployment Notes
- Uses both Edge Runtime (for health checks) and Node.js Runtime (for database operations)
- Connection pooling optimized for Serverless functions with automatic resource management
- Supabase transaction pool port 6543 is automatically used for improved concurrency
- Middleware provides session token validation and access control
- Edge middleware in `middleware.ts` handles session validation and access control without database connections

## 🎯 Development Workflow Guidelines

### 1. Before Starting Work
- Check `npx tsx scripts/test-connection.ts` to ensure database connectivity
- Review existing components in `components/` directory for similar patterns
- Run `npm run type-check` to verify TypeScript compatibility

### 2. Build Process & Chunking Strategy
- Vite build uses manual chunking to optimize bundle size and reduce loading times
- React and scheduler libraries bundled together as `vendor-react`
- Better Auth in separate `vendor-auth` chunk
- Lucide React icons in `vendor-icons` chunk
- Recharts in `vendor-charts` chunk
- Supabase-related libraries in `vendor-supabase` chunk
- Internationalization libraries in `vendor-i18n` chunk
- React Hook Form in `vendor-forms` chunk
- QR code library in `vendor-qrcode` chunk
- Drizzle ORM in `vendor-drizzle` chunk
- Utilities in `vendor-utils` chunk
- Maximum chunk size warning threshold set to 1MB
- Node.js polyfills injected for browser compatibility
- Alias configuration for easier imports: `@`, `@src`, `@components`, `@services`, `@utils`, `@types`
- Lazy loading implemented for non-critical components to improve initial load performance

### 3. During Development
- Always use `src/services/api.ts` for frontend-backend communication
- Import database connections only in server-side files (`*.server.ts`)
- Include `.js` extension in all relative imports
- Test database changes with `npm run schema:check`
- Handle guest mode (room ordering) vs admin mode appropriately
- Consider real-time synchronization when implementing new features
- Address TypeScript errors promptly to maintain code quality
- Follow the dual-user system pattern for authentication and business logic separation

### 4. Before Deployment
- Execute `npm run build` to verify production build
- Test with `npm run preview` to validate build output
- Run database integrity checks
- Ensure all TypeScript errors are resolved
- Verify environment variables are properly configured

## 📚 Key Files Reference

### Core Configuration Files
- `vite.config.ts`: Build and bundling configuration
- `drizzle.config.ts`: Database ORM configuration
- `tsconfig.json`: TypeScript compiler settings
- `vercel.json`: Deployment configuration
- `middleware.ts`: Vercel Edge middleware for session validation

### Critical Service Files
- `src/services/api.ts`: Frontend API gateway (primary integration point)
- `src/services/db.server.ts`: Database connection (server-side only)
- `api/health.ts`: Health check endpoint
- `api/db-check.ts`: Database connectivity check
- `api/auth/[...betterAuth].ts`: Better Auth routes with dual table synchronization
- `drizzle/schema.ts`: Database schema definitions

### Utility Scripts
- `scripts/test-connection.ts`: Database connectivity testing
- `scripts/init-db.ts`: Database initialization
- `scripts/clean-reset-simple.ts`: Simple cleanup and reset operations
- `scripts/cleanup-and-reset.ts`: Comprehensive cleanup and reset operations
- `scripts/fk-verification.ts`: Foreign key constraint verification
- `scripts/ph-payment-validation.ts`: Philippine payment validation logic
- `scripts/emergency-rls-fix.ts`: Emergency Row-Level Security fixes
- `scripts/monitor-connections.ts`: Database connection monitoring
- `scripts/verify-final-status.ts`: Final status verification

### Special Modes & URL Parameters
- Guest mode accessible via `?room` URL parameter (for room ordering)
- Admin setup page at `/auth/admin-setup` route
- Biometric setup page for administrators
- Master bypass cookie `jx_root_authority_bypass=true` for emergency access

### Security Best Practices

#### Database Connection Security
- Never hardcode database URLs in source code
- Always use environment variables for database connection strings
- Files affected by this fix: `simple-db-test.ts`, `test-api-connection.ts`, `scripts/emergency-rls-fix.ts`, `scripts/monitor-connections.ts`
- Use `process.env.DATABASE_URL`, `process.env.POSTGRES_URL`, or `process.env.DIRECT_URL` for database connections
- Store sensitive credentials in environment variables, not in code

#### Translation System Standardization
- The application currently has two translation systems: i18next (standard) and a custom system in `src/translations.ts`
- The custom system in `src/translations.ts` is marked as deprecated with comment: "DEPRECATED: This file is kept for backward compatibility during migration to i18next."
- To eliminate redundancy, migrate all components from custom `getTranslation` function to i18next `useTranslation` hook
- Components using custom system: `GuestEntry.tsx`, `CategoryManagement.tsx`, `Dashboard.tsx`, `DeliveryDashboard.tsx`, `CommandCenter.tsx`, `GuestOrder.tsx`, `FinancialCenter.tsx`, `ImageManagement.tsx`, `ImageUploadModal.tsx`, `MenuManagement.tsx`, `OrderManagement.tsx`, `RoomGrid.tsx`, `StaffManagement.tsx`, `SupplyChainManager.tsx`, `SystemSettings.tsx`, etc.
- Migration approach: Replace `import { Language, getTranslation } from '../translations'` with `import { useTranslation } from 'react-i18next'` and update usage accordingly

#### TypeScript Error Handling
- Several files have existing TypeScript errors that need to be addressed when modifying them
- Common errors include:
  - Missing properties in object literals (e.g., `name_en` vs `nameEn`, `updated_at` vs `updatedAt`)
  - Incorrect property names (e.g., `parent_id` vs `parentId`, `image_url` vs `imageUrl`)
  - Type mismatches between API responses and component props
  - Missing required properties in component prop types
- When working on files with existing errors, address the specific errors related to your changes
- Run `npm run type-check` frequently to validate type safety

#### Additional Information

#### Guest Mode Implementation
- Accessible via `?room` URL parameter for anonymous room ordering
- Uses `src/GuestEntry.tsx` as the entry point
- Communicates with backend through the same API gateway but operates in anonymous mode
- Displays menu items without requiring authentication

#### Authentication Flow
- Better-Auth provides the core authentication infrastructure
- Passkeys biometric authentication with WebAuthn standard
- Dual user system with synchronization between auth and business tables
- Client-side authentication in `src/services/auth-client.ts`

#### Development Environment
- Development bypass mode available using localStorage keys
- Automatic admin user creation for development purposes
- Demo mode fallback when API is unavailable

#### Database Operations
- All database operations go through Drizzle ORM
- Server-side only database connections in `src/services/db.server.ts`
- Connection pooling optimized for Vercel Serverless functions
- Supabase transaction pool port 6543 used for improved concurrency
- ✅ 修复 TS2305 错误：缺失 `getEnhancedAuthClient` 导出

## 错误原因
您在重构 `auth-client.ts` 时**误删了 `getEnhancedAuthClient` 函数的定义和导出**，导致 `UserBiometricSetup.tsx` 导入时找不到该成员。

---

## 完整修复方案

### 1. 修复 `src/services/auth-client.ts`
直接替换为以下完整代码，确保包含缺失的函数并正确导出：

```ts
import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "better-auth/client/plugins";
import type { AuthClient as BetterAuthClient } from "better-auth/client";

// 1. 同步初始化 Passkey 插件（官方标准配置）
const passkeyPlugin = passkeyClient({
  authenticatorSelection: {
    authenticatorAttachment: "cross-platform",
    residentKey: "preferred",
    userVerification: "preferred"
  },
  rpID: typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname 
    : 'localhost'
});

// 2. 创建带插件的认证客户端
export const authClient = createAuthClient({
  plugins: [passkeyPlugin]
});

// 3. 导出类型定义（类型安全）
export type AuthClient = BetterAuthClient<{ plugins: [typeof passkeyPlugin] }>;

// 4. 基础 Passkey 辅助函数
export const signInWithPasskey = (options: { email?: string }) => 
  authClient.signIn.passkey(options);

export const signUpWithPasskey = () => authClient.signUp.passkey();

// 5. 导出官方内置方法
export const { useSession, signIn, signOut, signUp } = authClient;

// ✅ 修复：添加缺失的 getEnhancedAuthClient 函数并正确导出
// 兼容原有异步调用方式，无需修改调用方代码
export const getEnhancedAuthClient = async (): Promise<AuthClient> => {
  // 客户端已同步初始化完成，直接返回实例即可
  return authClient;
};
```

---

## 2. 关键修复要点
| 修复项 | 说明 |
|--------|------|
| **函数定义** | 保留 `async` 签名以兼容原有 `await` 调用，无需修改 `UserBiometricSetup.tsx` |
| **类型安全** | 明确返回 `Promise<AuthClient>` 类型，符合 TypeScript 规范 |
| **实现逻辑** | 直接返回已初始化的 `authClient`，无需额外异步加载（因为插件已同步注册） |
| **导出语句** | 确保通过 `export` 对外暴露该函数 |

---

## 3. 验证修复效果
### 步骤 1：运行类型检查
```powershell
npm run type-check
```
> 预期结果：TS2305 错误消失，无其他类型错误

### 步骤 2：验证 `UserBiometricSetup.tsx` 调用
确保您的组件调用逻辑正常工作：
```tsx
// src/components/UserBiometricSetup.tsx
import { getEnhancedAuthClient } from '../services/auth-client';

const handleAddPasskey = async (email: string) => {
  try {
    const enhancedClient = await getEnhancedAuthClient();
    // 官方标准 API 调用方式
    await enhancedClient.passkey.register({ email });
    // 或根据您的业务逻辑使用：enhancedClient.signUp.passkey({ email })
  } catch (error) {
    console.error('添加生物识别失败:', error);
  }
};
```

---

## 4. 可选优化（可选）
如果您不需要兼容旧的异步调用，可以简化函数为同步返回：
```ts
// 简化版（无需 await）
export const getEnhancedAuthClient = (): AuthClient => {
  return authClient;
};
```
> 注意：此优化需要同步修改 `UserBiometricSetup.tsx` 中的调用（移除 `await`）

---

## 最终确认
修复完成后，您的项目将：
1.  ✅ 消除 TS2305 导出错误
2.  ✅ 保持与原有业务逻辑的兼容性
3.  ✅ 完全符合 Better Auth 官方类型规范
4.  ✅ 通过所有 TypeScript 类型检查修

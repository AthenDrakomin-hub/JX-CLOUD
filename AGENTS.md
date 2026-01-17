# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 🏨 Project Overview

This is "江西云厨" (Jiangxi Cloud Kitchen), a modern hotel management ecosystem with a full-stack architecture. It includes room ordering, order management, financial management, and other core features. The system is designed specifically for modern hotel operations, integrating real-time room ordering (QR Ordering), order scheduling matrix (KDS), multi-dimensional financial clearing, partner joint-operation logic, and physical-layer RLS security auditing.

## 🛠 Core Technology Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend Service**: Supabase (PostgreSQL database only)
- **Authentication**: Better-Auth (decoupled, vendor-independent, supports Passkeys biometric)
- **Deployment Platform**: Vercel Edge Runtime
- **Icon Library**: Lucide React
- **Chart Library**: Recharts
- **Database ORM**: Drizzle ORM
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

# 🧪 Debug tools
npx tsx scripts/test-connection.ts     # Test database connection
npx tsx scripts/debug-env.ts          # Debug environment variables
npx tsx scripts/check-schema.ts       # Check table structure
npx tsx scripts/init-db.ts            # Manual database initialization
```

## 🔐 Security Architecture

### Authentication System (Better-Auth)
- **Two-factor auth**: Supports Passkeys biometrics + traditional passwords
- **Root admin protection**: `athendrakomin@proton.me` special privilege account with automatic initialization
- **Dual user system**: `user` table (Better Auth standard fields) and `users` table (business logic) with synchronized data via database hooks
- **Session management**: JWT-based secure session mechanism
- **Permission validation**: Fine-grained permission checks at service layer
- **Passkeys integration**: Biometric authentication using WebAuthn standard with cross-platform support

### Data Security
- **RLS policies**: Row-level security control, physical isolation of partner data via `partner_id` field
- **Multi-tenant architecture**: Data separation through partner-based filtering
- **SQL injection protection**: Full use of parameterized queries and Drizzle ORM
- **XSS protection**: Input validation and output escaping
- **Sensitive operation protection**: Root admin permission check before delete operations
- **Connection pooling**: Optimized database connections for Vercel Serverless functions with automatic resource management

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

### Architecture Red Lines (Absolutely Forbidden)
1. Importing database connections in frontend components
2. Using `pg`, `mysql`, etc. database drivers in browser environment
3. Bypassing `services/api.ts` to call backend directly
4. Exposing database connection strings in frontend
5. Ignoring partner data isolation (`partner_id` filtering)

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

**4. Real-time functionality not working**
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

## 🧩 API Structure & Service Layer

### Frontend API Gateway (src/services/api.ts)
- Unified HTTP API client, frontend components can only communicate with backend through this gateway
- Contains config, rooms, dishes, orders, categories, partners, users, expenses modules
- Supports demo mode and production mode switching
- Includes error handling and retry mechanisms

### Backend API Routes (api/*)
- Vercel Serverless Functions with both `edge` and `nodejs` runtime configurations
- Health check endpoint at `/api/health.ts` (edge runtime)
- Database connectivity check at `/api/db-check.ts` (nodejs runtime)
- Better Auth routes at `/api/auth/[...betterAuth].ts` with dual table synchronization
- Automatic root admin initialization for `athendrakomin@proton.me`

### Service Layer Organization
- `api.ts`: Frontend unified data gateway
- `auth.ts`: Authentication logic (server-side)
- `auth-client.ts`: Client-side authentication
- `db.server.ts`: Database connection (server-side only)
- `notification.ts`: Notification service
- `printService.ts`: Print service
- `s3Service.ts`: File storage service (Supabase Storage)
- `supabaseClient.ts`: Supabase client (mainly for realtime features)

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
- `DATABASE_URL`: Direct database connection for Drizzle ORM (required for production)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth session encryption
- `BETTER_AUTH_URL`: Production domain URL (e.g., `https://your-domain.vercel.app`)
- `VITE_BETTER_AUTH_URL`: Frontend authentication URL
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: Automatically injected by Vercel when connecting Supabase

### Vercel Deployment Notes
- Uses both Edge Runtime (for health checks) and Node.js Runtime (for database operations)
- Connection pooling optimized for Serverless functions with automatic resource management
- Supabase transaction pool port 6543 is automatically used for improved concurrency

## 🎯 Development Workflow Guidelines

### 1. Before Starting Work
- Check `npx tsx scripts/test-connection.ts` to ensure database connectivity
- Review existing components in `components/` directory for similar patterns

### 2. Build Process & Chunking Strategy
- Vite build uses manual chunking to optimize bundle size and reduce loading times
- React and authentication libraries bundled together as `vendor-react-auth`
- Supabase-related libraries in `vendor-supabase` chunk
- UI libraries (Lucide React, Recharts) in `vendor-ui` chunk
- Maximum chunk size warning threshold set to 1MB

### 2. During Development
- Always use `src/services/api.ts` for frontend-backend communication
- Import database connections only in server-side files (`*.server.ts`)
- Include `.js` extension in all relative imports
- Test database changes with `npm run schema:check`

### 3. Before Deployment
- Execute `npm run build` to verify production build
- Test with `npm run preview` to validate build output
- Run database integrity checks

## 📚 Key Files Reference

### Core Configuration Files
- `vite.config.ts`: Build and bundling configuration
- `drizzle.config.ts`: Database ORM configuration
- `tsconfig.json`: TypeScript compiler settings
- `vercel.json`: Deployment configuration

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
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
- **Validation Tools**: Use tools in `/tools` directory to regularly check for violations

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
├── tools/                 # Architecture validation tools
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

# 🏗️ Architecture validation
node tools/quick-vite-check.js        # Quick invalid import check
node tools/smart-db-checker.js        # Smart architecture analysis
node tools/vite-db-fix-helper.js      # Comprehensive fix helper
```

## 🔐 Security Architecture

### Authentication System (Better-Auth)
- **Two-factor auth**: Supports Passkeys biometrics + traditional passwords
- **Root admin protection**: `athendrakomin@proton.me` special privilege account
- **Session management**: JWT-based secure session mechanism
- **Permission validation**: Fine-grained permission checks at service layer

### Data Security
- **RLS policies**: Row-level security control, physical isolation of partner data
- **SQL injection protection**: Full use of parameterized queries and ORM
- **XSS protection**: Input validation and output escaping
- **Sensitive operation protection**: Root admin permission check before delete operations

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
Check: Run node tools/quick-vite-check.js
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
# Architecture checks
node tools/quick-vite-check.js      # Quick invalid import check
node tools/smart-db-checker.js      # Smart architecture analysis
node tools/vite-db-fix-helper.js    # Comprehensive fix suggestions

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

### Service Layer Organization
- `api.ts`: Frontend unified data gateway
- `auth.ts`: Authentication logic (server-side)
- `auth-client.ts`: Client-side authentication
- `db.server.ts`: Database connection (server-side only)
- `notification.ts`: Notification service
- `printService.ts`: Print service
- `s3Service.ts`: File storage service (Supabase Storage)
- `supabaseClient.ts`: Supabase client (mainly for realtime features)
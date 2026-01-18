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
- `DATABASE_URL`: Direct database connection for Drizzle ORM (required for production)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth session encryption
- `BETTER_AUTH_URL`: Production domain URL (e.g., `https://your-domain.vercel.app`)
- `VITE_BETTER_AUTH_URL`: Frontend authentication URL
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: Automatically injected by Vercel when connecting Supabase

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

### 4. Before Deployment
- Execute `npm run build` to verify production build
- Test with `npm run preview` to validate build output
- Run database integrity checks

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
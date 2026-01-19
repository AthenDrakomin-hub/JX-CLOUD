# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is the **JX Cloud Terminal** - a comprehensive hospitality management system designed for modern hotels. It includes modules for QR ordering, Kitchen Display System (KDS), financial auditing, and multi-tenant security using PostgreSQL Row Level Security (RLS).

**Architecture**: Unified Supabase Edge Functions implementation with Better-Auth powered biometric authentication.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL 15, Edge Functions, Storage S3)
- **Authentication**: Better-Auth with Passkey/FIDO2 biometric support
- **ORM**: Drizzle ORM (schema-first definition)
- **Realtime**: Supabase Realtime (WebSocket channels for KDS)
- **Build Tool**: Vite
- **Package Manager**: npm

## Core Business Modules

- **📈 Dashboard**: Real-time business metrics with T+1 automatic revenue sharing logic
- **🛎️ Station Hub**: 67+ physical node control with dynamic QR generation and POS manual ordering
- **👨‍🍳 Order Matrix**: Enterprise KDS kitchen display system with thermal printing and fulfillment tracking
- **📦 Supply Chain**: High-precision inventory alerts, bilingual dish records, backup/recovery
- **🖼️ Visual Assets**: Supabase S3 protocol cloud gallery for product images
- **🔐 RBAC**: Fine-grained module-level permissions (C/R/U/D) with biometric login

## Key Architecture Patterns

- **Unified Edge Architecture**: All API requests routed through Supabase Edge Functions for consistent global performance
- **Physical Multi-tenant Isolation**: All business tables (Dishes, Orders, Expenses) bound to `partner_id`
- **JWT Physical Anchor**: Database extracts `auth.jwt()->'partner_id'`, preventing unauthorized cross-partner access
- **Runtime Alignment**: Drizzle ORM type derivation ensures frontend `camelCase` maps to DB `snake_case`
- **Biometric Authentication**: Full FIDO2 standard integration supporting fingerprint/face recognition
- **Dual User System**: Separation between auth users (Better-Auth) and business users (application-specific)
- **Physical Contract Mapping**: Consistent mapping between frontend camelCase and backend snake_case (e.g., `tableId` ↔ `table_id`, `partnerId` ↔ `partner_id`, `nameEn` ↔ `name_en`)
- **Clean Code Separation**: Frontend code (`src/`) separated from backend services (`services/`) and edge functions (`supabase/functions/`)

## API Structure

### Supabase Edge Functions API (Primary)
All API requests are handled through Supabase Edge Functions for optimal global performance:
- **Main Gateway**: `supabase/functions/api.ts` - Handles all business logic
- **Authentication**: `supabase/functions/auth.ts` - Better-Auth integration
- **Health Checks**: Built-in diagnostics and monitoring

### Authentication APIs
- `/api/auth/sign-in`: Traditional login/biometric handshake
- `/api/auth/sign-in/passkey`: Passkey/WebAuthn authentication endpoint
- `/api/auth/passkey/*`: FIDO2 credential registration and challenge verification
- `/api/auth/session`: High-security session management
- `/api/auth/test-passkey`: Test endpoint for passkey functionality

### Registration Management APIs
- `/api/auth/request-registration`: Submit new user registration requests
- `/api/auth/approve-registration`: Approve pending registrations
- `/api/auth/reject-registration`: Reject registration requests
- `/api/auth/registration-requests`: Get list of pending registrations

### System APIs
- `/api/health`: Edge node health check
- `/api/db-check`: Database latency and RLS compliance audit
- `/api/system/status`: System snapshot (order volume, connections)

### Business APIs via `services/api.ts`:
- Config: `api.config.get()` / `update()` - Global store name, theme, font family
- Dishes: `api.dishes.getAll()` / `create()` / `update()` / `delete()` - Physically isolated menu database
- Orders: `api.orders.create()` / `updateStatus()` / `getAll()` - Real-time stream
- Finance: `api.expenses.getAll()` / `create()` / `delete()` / `partners.getAll()` / `create()` / `update()` / `delete()` - Settlement and expenses
- Users: `api.users.upsert()` / `delete()` / `getAll()` - Business user and auth user dual-table sync
- Categories: `api.categories.getAll()` / `saveAll()` - Menu categorization
- Payments: `api.payments.getAll()` / `create()` / `update()` / `delete()` / `toggle()` - Payment method management
- Ingredients: `api.ingredients.getAll()` / `create()` / `update()` / `delete()` - Inventory management
- Archive: `api.archive.exportData()` / `importData()` - Data backup and restore
- Rooms: `api.rooms.getAll()` / `updateStatus()` - Hotel room status management

## Passkey Authentication Configuration

The system implements FIDO2/WebAuthn passkey authentication using Better-Auth with the following configuration:

- **Frontend Client**: `src/services/frontend/auth-client.frontend.ts` - Better-Auth React client
- **Server Integration**: `supabase/functions/auth.ts` - Edge Functions authentication handler
- **Database Schema**: Includes `passkey` table with proper relations to `user` table
- **Supabase Integration**: Uses Drizzle ORM adapter for PostgreSQL database operations
- **API Routing**: All auth requests handled through Supabase Edge Functions unified gateway

## Environment Variables

Critical variables that must be configured:
- `VITE_SUPABASE_URL`: Supabase access gateway
- `VITE_SUPABASE_ANON_KEY`: Frontend anonymous key
- `DATABASE_URL`: Drizzle physical connection (port 6543 transaction pool)
- `BETTER_AUTH_SECRET`: Session signing key (32 chars)
- `BETTER_AUTH_URL`: Base URL for auth callbacks (production deployments)

## Development Commands

- `npm run dev`: Start development server (Vite)
- `npm run build`: Build production bundle (Vite)
- `npm run type-check`: Type check without emitting (TSC)
- `npm run preview`: Preview production build locally
- `npx drizzle-kit generate`: Generate database migration files
- `npx drizzle-kit migrate`: Apply database migrations
- `npx drizzle-kit studio`: Open Drizzle Studio for database management

## Additional Useful Commands

- `npm outdated`: Check for outdated dependencies
- `npm audit`: Security audit of dependencies
- `npm list`: Show dependency tree

## Database Setup

1. Execute `database_setup.sql` to activate RLS policies
2. Visit `/auth/admin-setup` to bind first root admin biometric credential
3. Deploy category architecture via `Supply Chain -> Categories`

## Important Files

- `schema.ts`: Drizzle ORM schema definitions with RLS policies
- `types.ts`: Core TypeScript interfaces and enums
- `constants.ts`: Initial data and configuration values
- `src/App.tsx`: Main application component with routing logic
- `src/services/frontend/`: Frontend-specific service implementations
- `services/`: Server-side service implementations (Node.js environment)
- `supabase/functions/api.ts`: Primary Supabase Edge Functions API gateway
- `supabase/functions/auth.ts`: Authentication service implementation
- `services/auth-server.ts`: Better-Auth server configuration
- `services/db.server.ts`: Database connection and Drizzle setup
- `components/`: React components organized by functionality
- `scripts/`: Utility scripts for database management, translation handling, and deployment
- `database_setup.sql`: SQL script for RLS policy activation and table creation
- `src/components/AdminSetup.tsx`: Biometric admin credential setup
- `src/components/CommandCenter.tsx`: Main dashboard routing hub

## Development Best Practices

- All database queries must respect the `partner_id` isolation for multi-tenancy
- When modifying business logic, ensure RLS policies remain intact
- Use the `parseNumeric` utility when handling monetary values to prevent type conversion issues
- Maintain consistency between frontend camelCase and backend snake_case properties using mapping functions
- All new features should integrate with the existing biometric authentication system
- Real-time updates are handled through Supabase channels, ensure proper cleanup of subscriptions
- Use the dual-user system: auth users for authentication, business users for application logic
- Implement proper error handling and fallback mechanisms for offline/demonstration mode
- Follow the physical contract alignment pattern for database mappings (e.g., `tableId` ↔ `table_id`)
- Maintain the separation between Better-Auth managed tables and application-specific user tables
- Use the demo mode (`isDemoMode`) for offline development and testing
- Always validate monetary values using `parseNumeric` to prevent NaN issues
- Follow the CRUD permissions model for fine-grained access control
- **Code Organization**: Keep frontend code in `src/`, backend services in `services/`, and edge functions in `supabase/functions/`
- **Import Conventions**: Frontend imports use `.js` extensions, backend imports omit extensions

## Testing and Scripts

- Custom test scripts are located in the `scripts/` directory
- Use `npm run type-check` to validate TypeScript types before deployment
- Database migration scripts are available in the `scripts/` directory for schema updates
- Translation validation and population scripts are available for internationalization support
- Demo mode provides offline functionality for development without database connection
- Use Supabase client properly with error handling and type safety
- **Edge Functions Testing**: Test Supabase Edge Functions locally using `supabase functions serve`
- **Frontend Testing**: Use Vite development server for hot reloading and debugging

## Database Schema Notes

- Authentication tables (`user`, `session`, `account`, `verification`, `passkey`) follow Better-Auth conventions
- Business tables (`menu_dishes`, `orders`, `users`, `partners`, etc.) include `partner_id` for multi-tenancy
- All business data is physically isolated by `partner_id` with RLS enforcement
- Monetary values are stored as `numeric` type in database but converted to `number` in application layer
- JSONB fields are used for flexible data storage (items in orders, permissions, etc.)
# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is the **JX Cloud Terminal** - a comprehensive hospitality management system designed for modern hotels. It includes modules for QR ordering, Kitchen Display System (KDS), financial auditing, and multi-tenant security using PostgreSQL Row Level Security (RLS).

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL 15, Edge Functions, Storage S3)
- **Authentication**: Better-Auth with Passkey/FIDO2 biometric support
- **ORM**: Drizzle ORM (schema-first definition)
- **Realtime**: Supabase Realtime (WebSocket channels for KDS)
- **Build Tool**: Vite

## Core Business Modules

- **Dashboard**: Real-time business metrics with T+1 automatic revenue sharing logic
- **Station Hub**: 67+ physical node control with dynamic QR generation and POS manual ordering
- **Order Matrix**: Enterprise KDS kitchen display system with thermal printing and fulfillment tracking
- **Supply Chain**: High-precision inventory alerts, bilingual dish records, backup/recovery
- **Visual Assets**: Supabase S3 protocol cloud gallery for product images
- **RBAC**: Fine-grained module-level permissions (C/R/U/D) with biometric login

## Key Architecture Patterns

- **Physical Multi-tenant Isolation**: All business tables (Dishes, Orders, Expenses) bound to `partner_id`
- **JWT Physical Anchor**: Database extracts `auth.jwt()->'partner_id'`, preventing unauthorized cross-partner access
- **Runtime Alignment**: Drizzle ORM type derivation ensures frontend `camelCase` maps to DB `snake_case`
- **Biometric Authentication**: Full FIDO2 standard integration supporting fingerprint/face recognition

## API Structure

### Authentication APIs
- `/api/auth/sign-in`: Traditional login/biometric handshake
- `/api/auth/passkey/*`: FIDO2 credential registration and challenge verification
- `/api/auth/session`: High-security session management

### System APIs
- `/api/health`: Edge node health check
- `/api/db-check`: Database latency and RLS compliance audit
- `/api/system/status`: System snapshot (order volume, connections)

### Business APIs via `services/api.ts`:
- Config: `api.config.get()` / `update()` - Global store name, theme, font family
- Dishes: `api.dishes.getAll()` / `create()` / `update()` - Physically isolated menu database
- Orders: `api.orders.create()` / `updateStatus()` - Real-time stream
- Finance: `api.expenses.getAll()` / `partners.getAll()` - Settlement and expenses
- Users: `api.users.upsert()` - Business user and auth user dual-table sync

## Environment Variables

Critical variables that must be configured:
- `VITE_SUPABASE_URL`: Supabase access gateway
- `VITE_SUPABASE_ANON_KEY`: Frontend anonymous key
- `DATABASE_URL`: Drizzle physical connection (port 6543 transaction pool)
- `BETTER_AUTH_SECRET`: Session signing key (32 chars)

## Development Commands

- `npm run dev`: Start development server (Vite)
- `npm run build`: Build production bundle (Vite)
- `npm run type-check`: Type check without emitting (TSC)
- `npm run preview`: Preview production build locally

## Database Setup

1. Execute `database_setup.sql` to activate RLS policies
2. Visit `/auth/admin-setup` to bind first root admin biometric credential
3. Deploy category architecture via `Supply Chain -> Categories`

## Component Structure

The application follows a modular component architecture:

- `components/Sidebar.tsx`: Main navigation sidebar with module access control
- `components/Dashboard.tsx`: Business metrics overview and analytics
- `components/RoomGrid.tsx`: Physical room/table management interface
- `components/OrderManagement.tsx`: Order processing and status tracking
- `components/SupplyChainManager.tsx`: Menu and inventory management
- `components/FinancialCenter.tsx`: Revenue tracking and expense management
- `components/StaffManagement.tsx`: User and partner administration
- `components/SystemSettings.tsx`: Configuration and theme settings
- `components/GuestOrder.tsx`: Customer-facing QR ordering interface

## Service Layer

Key service files:
- `services/api.ts`: Centralized API communication layer with all business endpoints
- `services/auth-client.ts`: Authentication state management and session handling
- `services/supabaseClient.ts`: Supabase client initialization and configuration
- `services/notification.ts`: Browser notification service for order alerts

## Data Flow Architecture

1. **Authentication Flow**: Better-Auth → Session Management → Role-based Access Control
2. **Data Synchronization**: Real-time WebSocket channels for order updates
3. **Multi-tenancy**: Partner isolation through `partner_id` field enforcement
4. **Type Safety**: Drizzle ORM schema drives TypeScript interfaces automatically

## Important Files

- `schema.ts`: Drizzle ORM schema definitions with RLS policies
- `types.ts`: Core TypeScript interfaces and enums
- `constants.ts`: Initial data and configuration values
- `App.tsx`: Main application component with routing logic
- `middleware.ts`: Vercel edge middleware for authentication
- `services/api.ts`: Unified API service layer
- `components/`: React components organized by functionality

## Common Development Tasks

### Adding New Features
1. Define database schema in `schema.ts`
2. Add corresponding TypeScript interfaces in `types.ts`
3. Implement API methods in `services/api.ts`
4. Create React component in `components/` directory
5. Register route in `App.tsx` navigation

### Database Changes
1. Update schema in `schema.ts`
2. Run migrations via Drizzle Kit
3. Update corresponding TypeScript types
4. Test RLS policy compliance

### Component Development
1. Follow existing component patterns in the `components/` directory
2. Use TypeScript interfaces from `types.ts`
3. Leverage shared UI components and utilities
4. Implement proper error boundaries and loading states
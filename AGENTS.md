# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

JX CLOUD is an enterprise hospitality management suite built with React 19 and Supabase. It's designed for hotels, restaurants, and resorts with real-time order management, room status tracking, multi-language support, and financial auditing capabilities.

## Architecture

The system follows a cloud-native architecture with:
- **Frontend**: React 19 with TypeScript, Vite build tool
- **Backend**: Supabase (PostgreSQL) with real-time capabilities
- **Security**: Row-level security (RLS) policies and role-based access control
- **Data**: JSONB for order items, UUID for identifiers

Key tables:
- `users`: User/employee management with roles (admin, manager, staff)
- `rooms`: Room/table status tracking (ready, ordering) - auto-initialized with 64 rooms (8201-8232 and 8301-8332)
- `dishes`: Menu items with pricing and availability
- `orders`: Order management with status tracking
- `expenses`: Financial tracking and reporting
- `security_logs`: Security audit logging for sensitive operations
- `payment_configs`: Payment configuration management
- `materials`: Image library for menu items
- `translations`: Multi-language support data

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run utility tests/checks
npm run test:utils

# Check all database tables exist
tsx check-all-tables.ts
```

## Testing and Quality Assurance

The project uses a custom testing approach:
- Utility testing: `npm run test:utils` runs the check-all-tables.ts script to verify database connectivity
- Manual testing: Components should be tested in the development environment
- No formal unit test framework is currently implemented

## Environment Configuration

Required environment variables in `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional:
```env
GEMINI_API_KEY=your_gemini_api_key  # For AI features
```

## Key Files and Directories

- `App.tsx` - Main application component with all major UI modules
- `index.tsx` - Application entry point
- `services/` - API services and business logic
  - `api.ts` - Core API interface with CRUD operations for all entities
  - `supabaseClient.ts` - Database connection setup
  - `security.ts` - Security audit logging and access control
  - `business.ts` - Business logic operations
  - `utils.ts` - Utility functions
- `components/` - React UI components (Dashboard, RoomGrid, OrderManagement, etc.)
- `docs/` - Comprehensive documentation
- `api/` - Server-side API routes
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `check-all-tables.ts` - Database table verification utility
- `translations.ts` - Multi-language support implementation
- `types.ts` - TypeScript type definitions

## Important Notes

- Realtime subscriptions must be enabled for the `orders` table in Supabase
- The system uses automatic database initialization with 64 pre-configured rooms
- Security audit logging is implemented for sensitive operations via `security.ts`
- Multi-language support for Chinese, English, and Tagalog
- All database operations go through Supabase RLS policies
- Database initialization script is provided in README.md with all necessary tables and RLS policies
- Components use React.memo for performance optimization
- Payment and financial management modules are integrated
- Image library management for menu items and materials
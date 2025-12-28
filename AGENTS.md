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
- `rooms`: Room/table status tracking (ready, ordering)
- `dishes`: Menu items with pricing and availability
- `orders`: Order management with status tracking
- `expenses`: Financial tracking and reporting

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

# Run utility tests
npm run test:utils
```

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

- `App.tsx` - Main application component
- `index.tsx` - Application entry point
- `services/` - API services and business logic
  - `supabaseClient.ts` - Database connection
  - `api.ts` - API interface definitions
- `components/` - React UI components
- `docs/` - Comprehensive documentation
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration

## Important Notes

- Realtime subscriptions must be enabled for the `orders` table in Supabase
- The system uses automatic database initialization with 64 pre-configured rooms
- Security audit logging is implemented for sensitive operations
- Multi-language support for Chinese, English, and Tagalog
- All database operations go through Supabase RLS policies
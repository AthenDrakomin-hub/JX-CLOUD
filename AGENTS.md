# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is a Jiangxi Cloud Enterprise Hospitality Suite - a full-stack restaurant terminal system built with React and Supabase (PostgreSQL). The system provides comprehensive hotel restaurant management including room management, order processing, supply chain management, financial center, staff management, and system configuration.

## Architecture

- **Frontend**: React 19 with TypeScript, Vite build system
- **Backend**: Supabase (PostgreSQL) with edge functions for payment callbacks
- **Authentication**: Supabase authentication with role-based access control (admin, staff, maintainer)
- **State Management**: React hooks with context for global state management
- **UI Components**: Custom React components with Tailwind CSS styling
- **API Layer**: Direct Supabase integration with caching layer for performance
- **Data Synchronization**: Real-time sync mechanism with 30-second interval for orders, with caching layer for performance

## Key Modules

- **Dashboard**: Overview of orders, rooms, expenses, and dishes
- **Room Grid**: Hotel room management and status tracking
- **Order Management**: Order lifecycle from pending to completed
- **Supply Chain**: Dish and ingredient management
- **Financial Center**: Expense tracking and partner management
- **Staff Management**: User role and permission management
- **System Settings**: Configuration for printer, theme, and voice broadcast
- **Database Management**: Database operations and maintenance
- **Image Management**: Media library for dish images

## Development Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally

## Build and Optimization

- Vite build configuration with code splitting for vendor libraries (react, charts, icons, utils)
- Chunk size warning limit set to 1500KB
- CSS code splitting enabled
- Sourcemap disabled in production for smaller bundle size
- ES format output for modern browsers
- ESBuild minification enabled (identifiers, syntax, whitespace)

## Database Structure

- Supabase PostgreSQL with tables for: payment_configs, categories, ingredients, system_config, rooms, orders, dishes, users, expenses, partners, material_images, payments, audit_logs
- RLS (Row Level Security) policies for access control in `database/policies.sql`
- Edge functions for payment callbacks and other server-side logic in `database/functions.sql`
- Complete database schema definition in `database/schema.sql`
- Users table with UUID primary key, email, full_name, metadata, role, and auth_id fields
- Automatic updated_at triggers for all tables
- Audit logging for important tables (users, orders, dishes)

## Key Files

- `App.tsx` - Main application component with routing and state management
- `contexts/AuthContext.tsx` - Global authentication context with session management, login, logout, and token refresh
- `services/api.ts` - API abstraction layer with direct Supabase integration
- `services/supabaseClient.ts` - Supabase client initialization
- `services/apiCache.ts` - Caching layer for API responses to improve performance
- `services/createUserService.ts` - Service for integrating with Supabase Edge Function to create users via API
- `types.ts` - Type definitions for all entities including User, UserCreatePayload, UserUpdatePayload, and PaginatedResponse
- `constants.ts` - Initial data and configuration constants
- `components/` - React UI components for each module
- `components/SignUpLogin.tsx` - Enhanced authentication component supporting both login and registration with demo mode compatibility
- `vite.config.ts` - Vite build configuration with code splitting
- `database/` - Database schema, policies, and functions definitions

## API Layer Architecture

- Direct Supabase integration with caching layer for performance
- API caching: Built-in caching mechanism with configurable TTL (10-60 seconds depending on data type)
  - Rooms: 10 seconds TTL (frequently changing)
  - Orders: 15 seconds TTL (frequently updated)
  - Dishes: 30 seconds TTL (moderately stable)
  - System config: 60 seconds TTL (rarely changed)
- Timeout handling: 3-second timeout for cloud requests
- Parallel data fetching: All data types fetched in parallel with Promise.allSettled to prevent one failure from blocking others
- Selective sync: Only refreshes necessary data after operations instead of full refresh
- Caching strategy: API responses cached in memory with automatic cleanup of expired entries
- Data synchronization: 30-second interval sync for frequently changing data (orders)

## Security Considerations

- Default admin credentials have been removed from constants.ts for production use
- All authentication should be handled through Supabase Auth
- RLS policies are defined in database/policies.sql for fine-grained access control
- Production environment variables must be properly configured on Vercel
- Initial admin user must be created through Supabase Dashboard, not in code
- Environment variable access through VITE_ prefix for Vite compatibility
- Audit logging for critical operations (users, orders, dishes)
- Role-based access control with different permissions for admin, maintainer, and staff roles

## Production Setup

- Run database initialization script in database/init-production.sql after deployment
- Configure Supabase environment variables in Vercel project settings
- Create initial admin user via Supabase Dashboard
- Verify RLS policies are active and working correctly
- Set environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

## Environment Configuration

- Production mode only - requires Supabase URL and key configuration
- Supports Vercel environment variable naming convention (NEXT_PUBLIC_ prefix)
- Cross-platform environment variable detection (VITE_ for Vite, NEXT_PUBLIC_ for Vercel)
- Default fallback Supabase URL provided for development

## Key Features

- Multi-language support (Chinese/English)
- Real-time order status updates with voice broadcast
- Printer integration with configurable IP/port
- Customizable theme and typography settings
- Partner management system with commission tracking
- Ingredient inventory management with stock alerts
- Role-based access control with granular permissions
- Guest ordering via QR code with room-specific URLs
- Enhanced authentication with both login and registration support
- Supabase Edge Function integration for secure user creation
- Automatic audit logging for critical operations
- Hierarchical category management

## Authentication System

- Supabase-based authentication
- Username/password authentication via Supabase
- Enhanced SignUpLogin component supporting both login and registration
- Role-based access control (admin, staff, maintainer)
- Production-focused authentication system
- Secure user creation via Supabase Edge Function (create-user)

## API Integration

- createUserService for calling Supabase Edge Function create-user
- Secure user creation with service role authentication
- Validation and error handling for user creation
- Integration with StaffManagement component

## Testing and Linting

- No automated tests currently implemented in the codebase
- No linting configuration files found (no ESLint, Prettier, or similar tools configured)
- Manual testing recommended for all changes
- TypeScript compiler provides type checking during development

## Development Best Practices

- Use the caching layer in services/apiCache.ts for frequently accessed data
- Implement proper error handling with try/catch blocks when calling Supabase APIs
- Use the timeout wrapper in services/api.ts for cloud requests to prevent hanging
- Follow the existing data flow pattern: API → Cache → Component state → UI
- Maintain consistency with existing TypeScript interfaces in types.ts
- Follow the parallel data fetching pattern used in App.tsx for initial data loads
- Use the existing translation system for multi-language support
- Use Promise.allSettled for parallel API calls to prevent one failure from blocking others
- Clear relevant cache entries after data modifications to ensure consistency
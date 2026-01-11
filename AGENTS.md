# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is the "江西云厨终端系统" (JX Cloud) - an enterprise hospitality management system built with React, TypeScript, and Vite. The system uses Supabase for backend services and is designed for hotel/restaurant management with features for room management, order processing, inventory, and financial tracking.

## Development Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production (runs tsc and vite build)
- `npm run preview` - Preview the production build locally
- `npm run validate:production` - Run production environment validation checks
- `npm run validate:connection` - Validate Supabase connection and configuration
- `npm run test:validation` - Run validation tests (may terminate if environment variables are missing)

## Architecture Overview

- **Frontend**: React 19 with TypeScript, using Vite as build tool
- **Backend**: Supabase (PostgreSQL database with authentication)
- **API Layer**: Service located at `services/api.ts` handles all data operations
- **Authentication**: Supabase Auth with role-based permissions (admin, staff, maintainer)
- **State Management**: React hooks in App.tsx with centralized data fetching
- **UI Components**: Located in `components/` directory with modular structure
- **Edge Functions**: Vercel edge functions in `api/` directory for secure API gateway with modular routes in `/api/v1/`
- **Validation Layer**: Production validation utilities in `utils/` directory

## Key Data Flow

- All API calls go through the `api` object in `services/api.ts`
- Authentication state is managed in App.tsx
- Data is fetched in bulk and stored in component state
- Permissions are controlled via JSONB matrix in the database
- Demo mode is available when `isDemoMode` is true
- Environment variables are detected via `getEnv` function with fallbacks for different runtime contexts

## Important Files

- `App.tsx` - Main application component with routing and authentication
- `services/api.ts` - Core data access layer with CRUD operations for all entities
- `services/supabaseClient.ts` - Supabase client configuration with environment detection
- `types.ts` - TypeScript interfaces and enums for all data structures
- `constants.ts` - Initial data and default values for demo mode
- `utils/productionValidation.ts` - Production environment validation logic
- `utils/validationRunner.ts` - Validation runner script
- `components/` - UI components directory
- `api/index.ts` - Vercel edge function root API gateway
- `api/v1/route.ts` - Vercel edge function for versioned API endpoints
- `api/_shared/` - Shared utilities for API functions
- `api/admin/` - Administrative API endpoints
- `api/storage/` - Storage-related API endpoints
- `api/users/` - User management API endpoints

## Database Schema

The system uses Supabase PostgreSQL with tables for:
- `system_config` - Global system settings
- `menu_categories` - Food category definitions
- `menu_dishes` - Food items (prices stored in PHP as INTEGER)
- `orders` - Order records with JSONB for items
- `users` - User accounts with role-based permissions
- `rooms` - Hotel room tracking
- `expenses` - Financial tracking
- `partners` - Business partner management
- `ingredients` - Inventory management
- `payment_configs` - Payment method configurations

## Security Features

- Role-based access control (admin, staff, maintainer)
- JSONB permission matrix for fine-grained module access
- IP whitelisting for user accounts
- Service role key security via Vercel edge functions
- Row Level Security (RLS) for database protection
- Environment variable security with Vite's client-side variable prefixing
- Secure authentication with Supabase Auth and JWT tokens

## Validation and Testing

- Production validation suite in `utils/productionValidation.ts` includes:
  - Connection validation
  - Performance validation with cold start detection
  - Data integrity validation
  - Robustness validation with error rate thresholds
- Validation scripts in `utils/validationRunner.ts` for automated testing
- Validation commands:
  - `npm run validate:production` - Run comprehensive production validation
  - `npm run validate:connection` - Validate Supabase connection
  - `npm run test:validation` - Run validation tests with environment check
- Production readiness checklist includes SSL/TLS, JWT auth, CORS policies, and monitoring configurations

## Module Access Control

- JSONB matrix authorization model allows dynamic permission control
- Frontend intercepts access based on `module_permissions` field in users table
- Role-based permissions with admin override capability
- IP whitelisting for enhanced security

## Additional Architecture Details

- **Environment Detection**: Enhanced environment variable detection supporting multiple sources (Vite env, Node.js env, browser globals, localStorage)
- **Demo Mode**: Built-in demonstration mode activated when Supabase configuration is not present
- **Edge Functions**: Vercel edge functions provide secure API gateway that handles sensitive operations requiring Service Role permissions
- **Security Headers**: Production-grade CORS and security headers implemented in edge functions
- **Error Handling**: Comprehensive RLS-specific error handling with custom error messages for permission denied scenarios

## Additional Configuration

- **Build Configuration**: Vite configuration in `vite.config.ts` includes chunk optimization with manual chunking for vendor libraries (React core, charts engine, UI icons, utilities)
- **Constants**: Default room numbers, dish catalog, and user permissions defined in `constants.ts`
- **Translations**: Multi-language support available via `translations.ts`
- **Environment Detection**: Enhanced environment variable detection supporting multiple sources (Vite env, Node.js env, browser globals, localStorage)
- **Error Handling**: RLS-specific error handling with custom error messages for permission denied scenarios
- **Demo Mode**: Built-in demonstration mode activated when Supabase configuration is not present
- **Edge Function API Structure**: Modular API architecture with routes in `/api/v1/` for enhanced security and maintainability
- **API Gateway**: Edge functions in `/api/` directory serve as secure API gateway that handles sensitive operations requiring Service Role permissions

## Testing Information

There are no dedicated test files in the repository, but the validation system provides comprehensive production readiness checks via the validation utilities in the `utils/` directory.

## API Service Structure

The `services/api.ts` file implements a comprehensive CRUD API service with methods for:
- dishes: getAll, create, update, delete
- rooms: getAll, update
- orders: getAll, create, updateStatus
- categories: getAll, saveAll
- users: getAll, getProfile, create, update, delete, updatePermissions
- partners: getAll, create, update, delete
- expenses: getAll, create, delete
- ingredients: getAll, create, update, delete
- payments: getAll, create, update, delete, toggle
- config: get, update

Each method includes proper error handling with RLS error detection.

For system configuration retrieval, the service uses the Supabase Edge Function:
- `GET https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/global-config` with Authorization header
- Falls back to direct Supabase database access if the Edge Function is unavailable

## Edge Function API Structure

The system uses Supabase Edge Functions for backend operations:

### Supabase Edge Functions:
- `global-config` - Supabase-hosted function for retrieving system configuration:
  - URL: `https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/global-config`
  - `GET` method with `Authorization: Bearer <access_token>` header
  - Uses `requireAuth` middleware to validate authorization token
  - Leverages `SUPABASE_SERVICE_ROLE_KEY` for direct database access (bypassing RLS)
  - Returns system configuration with user role information for debugging/auditing
  - Supports CORS with configurable origins
  - Unified error response format: `{ error: { message, details? } }`

## Constants and Default Values

The system defines initial data in `constants.ts`:
- ROOM_NUMBERS: 64 standard rooms (8201-8232, 8301-8332) plus VIP rooms (VIP-666, VIP-888, VIP-000)
- INITIAL_DISHES: Over 120 predefined dishes across multiple categories (主食套餐类, 中式炒菜类, 粤式菜品, 中式主食类, 基础主食)
- INITIAL_USERS: Default admin user with full permissions
- CATEGORIES: Menu categories including '主食套餐类', '中式炒菜类', '粤式菜品', '中式主食类', '基础主食'

## Environment Configuration

The system uses enhanced environment variable detection supporting multiple sources:
- Vite environment variables (import.meta.env)
- Node.js process.env
- Browser globals (window.__ENV__)
- LocalStorage fallback

Environment variable prefixes:
- Frontend (requires VITE_ prefix for client-side access):
  - `VITE_PROJECT_URL` or `VITE_SUPABASE_URL`: Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- Edge Functions (no prefix required, accessed via process.env):
  - `SUPABASE_URL`: Supabase URL
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role key

## Demo Mode

The system includes a built-in demo mode that activates when Supabase configuration is not present:
- Uses localStorage for user data persistence
- Provides mock data for all entities
- Simulates all API operations locally
- Identified by the `isDemoMode` flag in `supabaseClient.ts`

## Additional Security Features

- RLS (Row Level Security) specific error handling with custom error messages
- Automatic service charge calculation (5% by default) on orders
- IP whitelisting for enhanced account security
- JWT token authentication with automatic refresh
- Client-side data validation before API submission

## Row Level Security (RLS) Policies

The database implements comprehensive RLS policies for fine-grained access control using standardized role-based patterns:

### Recommended RLS Policy Structure

Current policies should follow the unified pattern using `auth.jwt() ->> 'role'` for role determination:

**users**: User management with role-based access
- Policy: `users_admin_all` - Allows all operations for 'admin' role
- Policy: `users_developer_all` - Allows all operations for 'developer' role
- Policy: `users_authenticated_select` - Allows SELECT operations for any authenticated user

**system_config**: System-wide configuration with restricted access
- Policy: `Allow All Authenticated Read Access to System Config` - Allows SELECT operations for any authenticated user
- Policy: `system_config_admin_all` - Allows all operations for 'admin' role
- Policy: `system_config_developer_all` - Allows all operations for 'developer' role

**menu_categories**: Category management with role-based access
- Policy: `menu_categories_admin_dev_all` - Allows all operations for 'admin' and 'developer' roles
- Policy: `menu_categories_public_select` - Allows SELECT operations for public (unauthenticated) users

**rooms**: Room management with role-based access
- Policy: `rooms_admin_dev_all` - Allows all operations for 'admin' and 'developer' roles
- Policy: `rooms_staff_select` - Allows SELECT operations for 'staff' role only

**ingredients**: Inventory management with role-based access
- Policy: `ingredients_admin_dev_all` - Allows all operations for 'admin' and 'developer' roles
- Policy: `ingredients_staff_select` - Allows SELECT operations for 'staff' role only

**material_images**: Media assets with role-based access
- Policy: `material_images_admin_dev_all` - Allows all operations for 'admin' and 'developer' roles
- Policy: `material_images_staff_select` - Allows SELECT operations for 'staff' role only

**partners**: Partner management with tiered access
- Policy: `partners_admin_all` - Allows all operations for 'admin' role
- Policy: `partners_dev_maintainer_all` - Allows all operations for 'developer' and 'maintainer' roles
- Policy: `Allow Staff Read Access to Partners` - Allows SELECT operations for 'staff' role

**expenses**: Multi-role expense management
- Policy: `expenses_admin_dev_all` - Allows all operations for 'admin' and 'developer' roles
- Policy: `expenses_staff_select` - Allows SELECT operations for 'staff' role only

**payment_configs**: Payment configuration with role-based access
- Policy: `payment_configs_admin_all` - Allows all operations for 'admin' role
- Policy: `payment_configs_staff_select` - Allows SELECT operations for 'staff' role only

**audit_logs**: Audit log access restricted to admin role
- Policy: `audit_logs_admin_select` - Allows all operations for 'admin' role only

**orders**: Complex order access based on user role and ownership
- Policy: `orders_admin_via_users` - Allows all operations for users with 'admin' role
- Policy: `orders_staff_own` - Allows operations only on orders created by the user (updated_by = auth.uid())
- Policy: `orders_viewer_completed` - Allows SELECT operations for 'authenticated' users only on completed orders

### Policy Best Practices

- All policies should use `auth.jwt() ->> 'role'` for consistent role checking
- Overly permissive policies (USING (true) / WITH CHECK (true)) should be replaced with specific role-based checks
- Policies should be consolidated to avoid duplicate functionality
- Public access should be granted sparingly and explicitly
- Ownership-based policies (using auth.uid()) should be used for personal data access

### Common RLS Issues and Troubleshooting

- **403 Forbidden errors**: Usually indicate insufficient role permissions for the operation. Check that the user has the appropriate role (admin, developer, etc.) for the requested action.
- **OPTIONS vs POST requests**: The OPTIONS request is a CORS preflight that checks if the actual request is allowed. If OPTIONS passes but POST fails with 403, the issue is typically with RLS policies, not CORS configuration.
- **System config access**: The `system_config` table typically allows SELECT for authenticated users but restricts INSERT/UPDATE/DELETE to admin roles only.
- **Permission debugging**: Use the RLSErrorHandler component to get specific error messages and policy suggestions when encountering access issues.

### API Endpoints and Deployment Troubleshooting

- **404 Not Found errors**: Indicate that the requested API endpoint doesn't exist or isn't properly deployed. Common causes:
  - Endpoint not deployed to Supabase functions
  - URL path incorrect (case-sensitive)
  - Missing edge function configuration
  - Verify the function is deployed by checking Supabase dashboard

- **API Deployment Structure**: 
  - Supabase Edge functions are deployed to Supabase platform
  - Verify environment variables are set in Supabase deployment settings

- **Common API Issues**:
  - Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY (frontend) or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY (edge functions) in environment variables
  - Authentication token not properly passed to edge functions
  - CORS misconfiguration between frontend and edge function
  - Rate limiting on edge functions causing intermittent failures

## Type Checking and Linting

- Use `tsc` for type checking (part of the build process)
- No dedicated linting configuration found in the project (no ESLint/Prettier setup detected)
- The build process includes type checking as part of the `npm run build` command
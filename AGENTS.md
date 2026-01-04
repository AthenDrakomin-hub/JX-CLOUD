# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is a hospitality management system called "江西云厨" (JX Cloud) - a hotel/restaurant management solution that allows guests to order food from their rooms. The application uses React 19 with TypeScript, Vite build system, and Supabase as the backend, featuring both online and offline capabilities.

## Architecture

- **Frontend**: React 19 with TypeScript, Vite build system
- **Deployment**: Vercel platform with Supabase backend integration
- **Styling**: Tailwind CSS (loaded via CDN) with custom CSS variables and utility classes
- **Backend**: Supabase (PostgreSQL database with Row Level Security)
- **Edge Functions**: Supabase edge functions for server-side operations (authentication, CRUD operations, etc.)
- **State Management**: LocalStorage with virtual database that syncs to Supabase (hybrid storage engine)
- **UI Components**: Located in the `components/` directory
- **API Layer**: Service layer in `services/api.ts` with offline-first approach
- **Database**: PostgreSQL via Supabase with tables for rooms, dishes, orders, users, etc.

## Hybrid Storage Architecture (VirtualDB)

The system implements a sophisticated offline-first architecture:
- Local storage as the primary data layer for reliability during network outages
- Supabase cloud sync for multi-device consistency
- Sync queue mechanism to handle pending operations when offline
- Automatic reconciliation when connection is restored
- The VirtualDB implementation uses localStorage with specific storage keys for different data types:
  - `jx_virtual_rooms` - Hotel room data
  - `jx_virtual_orders` - Order information
  - `jx_virtual_dishes` - Menu items
  - `jx_virtual_expenses` - Financial tracking
  - `jx_virtual_users` - User accounts
  - `jx_pending_sync` - Operations queue for cloud sync
  - `jx_virtual_config` - System configuration
  - `jx_virtual_materials` - Image assets
  - `jx_virtual_translations` - Multi-language translations

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000, opens automatically)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Check for potential issues
npm run build
```

## Database Schema

The application uses Supabase with the following key tables:
- `rooms` - Hotel rooms with status tracking
- `dishes` - Menu items with pricing and inventory
- `orders` - Guest orders with status tracking
- `users` - Staff accounts with role-based permissions
- `config` - System configuration settings
- `expenses` - Financial tracking
- `ingredients` - Inventory management
- `security_logs` - Audit logging
- `payments` - Payment method configurations
- `translations` - Multi-language translations with zh/en/tl support
- `material_images` - Image asset management

## Key Features

- Room-based ordering system (rooms 8201-8232, 8301-8332, VIP rooms)
- Multi-language support (Chinese/English/Filipino) with database-driven translations
- Language switcher moved to top navigation bar for better accessibility
- Role-based access control (admin, manager, staff, partner)
- Offline-first architecture with sync capabilities
- Payment processing with multiple methods (GCash, Maya, GrabPay, Cash, Credit/Debit Card, Room Charge)
- Inventory management
- Financial reporting
- Security audit logging
- Forced online session management (single active session per user)
- IP whitelist functionality for enhanced security
- Two-factor authentication (2FA) using TOTP
- Real-time order notifications to kitchen
- Webhook integration for third-party messaging systems
- QR code generation for room-based ordering
- Real-time connection monitoring with accurate status display
- Multi-tenant support with partner-specific data isolation
- Push notifications for order status updates
- Data synchronization between local and cloud storage

## Environment Configuration

The application uses Vite environment variables prefixed with `VITE_`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## CORS Configuration

When deploying the application, ensure proper CORS configuration in Supabase:
- Access Supabase dashboard -> Authentication -> URL Configuration
- Add your domain to the allowed origins list (e.g., https://www.jiangxijiudian.store)
- For edge functions, configure CORS headers in the function code:
  - Add appropriate 'Access-Control-Allow-Origin' headers
  - Include 'Access-Control-Allow-Methods' and 'Access-Control-Allow-Headers'
- For production deployment, ensure the Supabase edge functions return proper CORS headers

## Important Files

- `App.tsx` - Main application component
- `services/api.ts` - Main API service with offline-first logic and VirtualDB implementation
- `services/supabaseClient.ts` - Supabase client configuration
- `services/mfaFixer.ts` - MFA status checking and fixing utilities
- `services/notification.ts` - Notification handling and push services
- `types.ts` - Type definitions for all entities
- `constants.ts` - Application constants and initial data
- `components/` - React UI components
- `vite.config.ts` - Vite build configuration with optimized chunking
- `translations.ts` - Multi-language translation management
- `components/ConnectionMonitor.tsx` - Real-time connection status monitoring component
- `users_admin_function.ts` - User administration functions
- `api/` - Directory containing Supabase Edge Functions:
  - `index.ts` - Main API gateway with health check endpoint
  - `set-user-password.ts` - Function to securely update user passwords using Supabase auth
  - `select-or-login-user.ts` - Function to securely select or authenticate users
  - `dish-crud-api.ts` - Function to handle dish CRUD operations
- `index.html` - HTML entry point with Tailwind CDN and custom CSS variables

## Styling and UI

- **Tailwind CSS**: Loaded via CDN in index.html for utility-first CSS framework
- **Custom Styles**: Defined in index.html style tag with CSS variables for consistent theming
- **Font Loading**: Google Fonts (Plus Jakarta Sans and Playfair Display) with preconnect for performance
- **CSS Variables**: Custom properties for gold (#d4af37), obsidian (#020617), and app background (#f8fafc)
- **Mobile Optimization**: Safe area handling, scroll behavior, and mobile-friendly styles

## Security Features

- Row Level Security (RLS) in Supabase database
- IP whitelist validation for user accounts
- Two-factor authentication (2FA) with TOTP
- Security audit logging for all user actions
- Account locking mechanism
- Session management with forced single session per user
- Multi-tenant data isolation for partner accounts
- Service-role only access for highly sensitive operations

## Connection Monitoring

- Real-time connection status detection with accurate cloud/online status
- Network connectivity verification using navigator.onLine API
- Database connection testing with actual queries
- Visual status indicator in the top navigation bar
- Automatic status refresh every 30 seconds
- Manual refresh button for immediate status check

## MFA (Multi-Factor Authentication) Fixes

- Database schema verification and repair for MFA fields
- Consistency check between two_factor_enabled flag and mfa_secret
- Automatic fixing of mismatched MFA configurations
- Batch processing for all user accounts
- SQL script for database-level MFA field corrections

## Multi-language Support

- Dynamic dish name display based on current language setting
- Chinese/English/Filipino language switching for menu items
- Proper dish name localization in guest ordering interface
- Search functionality that works across languages

## Database Security (RLS)

- Row Level Security (RLS) policies for all database tables
- Admin-specific access policies for full data management
- MFA-related field security with proper access controls
- Security audit logging for sensitive operations
- Fine-grained permission controls following least-privilege principle
- Multi-tenant data isolation using partnerId fields

## Sensitive Data Protection

- MFA secret fields protected with restricted access policies
- Service-role only access for highly sensitive operations
- Secure functions for MFA configuration management
- Recovery code generation with audit logging
- Separation of MFA status visibility from secret access

## MFA Security Implementation

- MFA-related security functions and triggers deployed
- Column-level protection for sensitive fields
- Audit logging for all MFA-related operations
- Secure update procedures for MFA configuration
- Verification scripts for policy validation

## Database Configuration Management

- Organized SQL scripts for MFA and connection monitoring
- Consolidated configuration files with removed duplicates
- Centralized documentation for database security features
- Structured implementation steps for easy deployment

## Payment Methods

The system supports multiple payment methods:
- GCash
- Maya
- GrabPay
- Credit/Debit Card
- Room Charge (Sign the Bill)
- Cash

## Build Configuration

The Vite build is optimized with:
- Code splitting for vendor libraries (React core, charts, UI icons, utilities)
- Custom chunk naming with hash for cache busting
- Large chunk size warning limit (1500KB) to optimize loading
- CSS code splitting enabled
- Automatic opening of browser on development start

## Testing and Linting

The project uses TypeScript strict mode for type checking. While no specific test framework is configured, all code should maintain type safety and follow the established patterns in the codebase.

For type checking and linting, use:
```bash
# Type checking
npx tsc --noEmit

# Check for potential issues
npm run build
```

## Development Workflow

- All code follows React 19 + TypeScript best practices with strict typing
- Components are memoized using React.memo() to optimize performance
- State management uses React hooks with proper dependency arrays
- API calls go through the VirtualDB layer for offline-first functionality
- Security logging is implemented for all sensitive operations
- Multi-language support is database-driven with fallback mechanisms
- Import paths should be relative to the current file location (e.g., `../services/api` from files in subdirectories)
- Multi-tenant support requires checking partnerId for appropriate data isolation
- Push notifications implemented via webhook integration for real-time updates
- Data submission handled through VirtualDB with automatic sync queue

## Room Configuration

The system supports 67 rooms:
- 32 rooms in the 82xx series (8201-8232)
- 32 rooms in the 83xx series (8301-8332) 
- 3 VIP rooms (VIP-666, VIP-888, VIP-000)

## Common Issues and Fixes

- **Missing CSS file**: index.html had a reference to non-existent index.css file which was removed since styles are handled via Tailwind CDN and inline styles
- **Import path errors**: Files in the services directory should use relative paths like `../types` when importing from the root directory
- **Supabase Edge Functions**: Files like users_admin_function.ts are designed to run in Supabase Edge Function environment (Deno) and may show TypeScript errors in local environment but work correctly when deployed to Supabase
- **Translation keys**: When adding new UI elements, ensure all translation keys used in components exist in translations.ts for all supported languages (zh, en, tl) to avoid TypeScript errors
- **TypeScript strict mode**: All function parameters should have explicit type annotations to comply with strict TypeScript settings
- **Login credentials inconsistency**: Login form shows placeholder "Access Password / password" but actual default admin password is "admin" (admin/admin). For other users, default password is "123456" if not set during creation.
- **CORS errors**: When deploying, ensure Supabase edge functions have proper CORS configuration to allow requests from your domain

## Common Development Tasks

- **Adding new features**: Implement through the VirtualDB layer to maintain offline capabilities
- **Database schema changes**: Update both local storage schema and Supabase tables with proper migration scripts
- **Security enhancements**: Follow RLS policies and audit logging requirements
- **Multi-language additions**: Update translations in both database and translations.ts file
- **Component development**: Place new components in the components/ directory following existing patterns
- **Partner-specific features**: Ensure proper partnerId isolation for multi-tenant functionality

## Deployment Configuration

The application is deployed on Vercel with Supabase backend integration:
- Client-side deployed on Vercel with Supabase backend services
- Supabase edge functions handle server-side operations (authentication, CRUD, etc.)
- Environment variables should be prefixed with VITE_ for client-side access
- The build process creates optimized chunks with specific naming conventions
- CDN-ready assets with cache busting hashes
- Ensure proper CORS configuration for cross-origin requests between frontend and Supabase functions

## Login and Password Management

### Default Credentials
- Admin user: `admin` / `admin`
- Other users default password: `123456` (if not set during creation)

### Password Reset Options
1. Use the built-in password reset functionality via the UI
2. Use the Supabase Edge Functions to update user passwords:
   - `set-user-password.ts` - Updates password via Supabase auth

### Troubleshooting Login Issues
If you're unable to log in:
1. Check if the default admin credentials work (`admin`/`admin`)
2. Ensure your Supabase backend is properly configured and accessible
3. Verify that the edge functions are deployed and accessible
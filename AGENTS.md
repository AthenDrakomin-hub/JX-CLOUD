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

## High-Level Architecture Overview

### System Architecture Layers

**1. Presentation Layer (src/)**
- React 19 frontend with TypeScript
- Component-based architecture organized by business modules
- Central routing through `App.tsx` with tab-based navigation
- State management using React hooks and context providers
- Internationalization support with runtime language switching

**2. Service Layer (services/ and src/services/)**
- **Frontend Services** (`src/services/`): Browser-compatible clients for authentication, API calls, and notifications
- **Backend Services** (`services/`): Node.js compatible services for database operations, file uploads, and business logic
- Dual-service pattern maintains clean separation between client and server concerns
- API abstraction layer in `services/api.ts` provides unified interface for all business operations

**3. Data Access Layer (supabase/functions/)**
- **Edge Functions Gateway**: `supabase/functions/api.ts` serves as primary API entry point
- **Authentication Handler**: `supabase/functions/auth.ts` manages Better-Auth integration
- **Supabase Integration**: Direct PostgreSQL access with RLS enforcement
- **Real-time Subscriptions**: WebSocket channels for live order updates and notifications

**4. Database Layer**
- **Schema Definition**: `schema.ts` defines all database tables with Drizzle ORM
- **Row Level Security**: Automatic tenant isolation through `partner_id` constraints
- **Multi-tenancy**: Physical separation of partner data at database level
- **Type Safety**: Runtime alignment between frontend camelCase and backend snake_case

### Key Architectural Patterns

**Physical Multi-tenancy**
- Every business table includes mandatory `partner_id` foreign key
- RLS policies enforce data isolation at database level
- JWT token extraction ensures request-level tenant context
- Cross-partner data access strictly prohibited

**Dual Authentication System**
- **Better-Auth**: Handles core authentication, sessions, and passkeys
- **Application Users**: Separate business user table for role-based access control
- **Biometric Integration**: Full FIDO2/WebAuthn support for secure authentication
- **Session Management**: JWT-based sessions with automatic refresh

**Contract Alignment Pattern**
- Frontend uses camelCase properties (`userId`, `partnerId`)
- Backend/database uses snake_case columns (`user_id`, `partner_id`)
- Automatic mapping functions ensure seamless integration
- Type-safe transformations prevent runtime errors

**Clean Separation Principles**
- Frontend code exclusively in `src/` directory
- Backend services in `services/` directory  
- Edge functions isolated in `supabase/functions/`
- Shared types and constants properly exported/imported
- Import convention: frontend uses `.js` extensions, backend omits extensions

## API Structure

### Supabase Edge Functions API (Primary)
All API requests are handled through Supabase Edge Functions for optimal global performance:
- **Main Gateway**: `supabase/functions/api/index.ts` - Handles all business logic
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
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for Edge Functions

## Development Commands

### Core Development
- `npm run dev`: Start development server (Vite) - Hot reload enabled
- `npm run build`: Build production bundle (Vite) - Minified output in `dist/`
- `npm run type-check`: Type check without emitting (TSC) - Validate TypeScript types
- `npm run preview`: Preview production build locally

### Testing
- `npm run test`: Run all tests using Jest
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report

### Database Management
- `npx drizzle-kit generate`: Generate database migration files from schema changes
- `npx drizzle-kit migrate`: Apply database migrations to target database
- `npx drizzle-kit studio`: Open Drizzle Studio GUI for database browsing and management
- `npx drizzle-kit push`: Push schema changes directly to database (development only)
- `npx drizzle-kit introspect`: Introspect existing database schema
- `npx drizzle-kit up`: Upgrade Drizzle Kit to latest version

### Supabase Edge Functions
- `supabase functions serve`: Run Supabase Edge Functions locally for testing
- `supabase functions serve --env-file .env.local`: Serve with local environment variables
- `supabase functions deploy`: Deploy Edge Functions to Supabase production
- `supabase functions deploy --no-verify-jwt`: Deploy without JWT verification (testing only)
- `supabase link`: Link local project to Supabase project
- `supabase start`: Start local Supabase development environment
- `supabase stop`: Stop local Supabase development environment

### Dependency Management
- `npm outdated`: Check for outdated dependencies
- `npm audit`: Security audit of dependencies
- `npm list`: Show dependency tree

## Additional Useful Commands

- `npm run type-check`: Validate TypeScript types across entire codebase
- `npm run test`: Run all tests using Jest
- `npm run test:watch`: Watch mode for continuous testing during development
- `npm run test:coverage`: Generate test coverage reports

## Critical Development Workflows

### Getting Started
1. **Environment Setup**: Copy `.env.example` to `.env.local` and configure required variables
2. **Database Initialization**: Run `npx drizzle-kit push` to sync schema to database
3. **Admin Setup**: Visit `/auth/admin-setup` to configure root administrator biometric credentials
4. **Category Configuration**: Navigate to Supply Chain → Categories to establish menu structure
5. **Development Server**: Run `npm run dev` to start local development environment

### Local Development Quick Start
```bash
# Clone and setup
git clone <repository-url>
cd jx-cloud-terminal
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Database setup
npx drizzle-kit push

# Start development
npm run dev
```

### Feature Development Process
1. **Schema Changes**: Modify `schema.ts`, then run `npx drizzle-kit generate` and `npx drizzle-kit migrate`
2. **API Development**: Add endpoints to `supabase/functions/api.ts` following existing patterns
3. **Frontend Integration**: Create/update components in `src/components/` using established service patterns
4. **Type Safety**: Ensure all new interfaces are added to `types.ts` with proper mappings
5. **Testing**: Validate changes in development mode before production deployment

### Deployment Pipeline
1. **Local Testing**: Use `supabase functions serve` to test Edge Functions locally
2. **Type Validation**: Run `npm run type-check` to ensure TypeScript compliance
3. **Production Build**: Execute `npm run build` to generate optimized bundle
4. **Function Deployment**: Deploy Edge Functions using `supabase functions deploy`
5. **Environment Promotion**: Update production environment variables accordingly

### Debugging and Monitoring
1. **Real-time Issues**: Monitor Supabase Realtime channel subscriptions and cleanup
2. **Database Performance**: Use Drizzle Studio to analyze query performance and RLS effectiveness
3. **Authentication Problems**: Check Better-Auth session validity and passkey registration status
4. **Multi-tenant Validation**: Verify `partner_id` constraints are properly enforced in all queries

### Advanced Debugging Techniques
- **Edge Function Debugging**: Use `console.log` in Edge Functions and check Supabase dashboard logs
- **Database Query Analysis**: Enable query logging in Drizzle Studio for performance optimization
- **Network Inspection**: Use browser DevTools Network tab to monitor API calls and response times
- **Memory Leak Detection**: Monitor React component re-renders using React DevTools Profiler
- **Real-time Subscription Debugging**: Check active Supabase channel subscriptions in browser console

## Directory Structure Overview

```
├── src/                          # Frontend application code
│   ├── components/              # React components organized by module
│   │   ├── Dashboard/           # Business metrics and analytics
│   │   ├── OrderManagement/     # KDS and order processing
│   │   ├── SupplyChainManager/  # Inventory and procurement
│   │   ├── FinancialCenter/     # Accounting and settlements
│   │   └── ...                  # Other business modules
│   ├── services/                # Frontend service clients
│   │   └── frontend/            # Browser-compatible implementations
│   └── App.tsx                  # Main application router and state
├── services/                     # Backend service implementations
│   ├── api.ts                   # Primary business logic gateway
│   ├── db.server.ts             # Database connection and Drizzle setup
│   └── auth-server.ts           # Better-Auth server configuration
├── supabase/functions/           # Edge Functions deployment
│   ├── api/                     # Main API gateway files
│   │   └── index.ts             # Main API gateway (primary entry point)
│   ├── auth.ts                  # Authentication handlers
│   └── better-auth.ts           # Better-Auth integration layer
├── database/                     # Database migration files
├── scripts/                      # Utility and deployment scripts
└── types/                        # Shared TypeScript definitions
```

## Core Module Responsibilities

**Dashboard Module**: Real-time business intelligence with automatic T+1 revenue calculations
**Station Hub**: Physical device management with QR code generation and manual POS ordering
**Order Matrix**: Kitchen Display System with thermal printer integration and fulfillment tracking
**Supply Chain**: Inventory management with precision alerts and bilingual product records
**Financial Center**: Multi-partner settlement processing and expense tracking
**Staff Management**: RBAC system with biometric authentication integration
**System Settings**: Global configuration management and tenant customization

## Performance Optimization Guidelines

### Frontend Performance
- **Bundle Optimization**: Use code splitting for large components and lazy loading for non-critical features
- **Image Optimization**: Compress images and use appropriate formats (WebP when supported)
- **Component Memoization**: Use `React.memo()` for expensive components and `useMemo/useCallback` for computations
- **Virtual Scrolling**: Implement windowing for long lists (especially in order management and inventory)
- **Request Caching**: Cache API responses appropriately using service worker or in-memory caching

### Database Performance
- **Query Optimization**: Use indexes on frequently queried columns, especially `partner_id` and timestamps
- **Connection Pooling**: Configure appropriate connection pool sizes in `DATABASE_URL`
- **RLS Policy Optimization**: Keep RLS policies simple and avoid complex joins in policy definitions
- **Pagination**: Implement cursor-based pagination for large datasets instead of offset-based pagination

### Edge Function Performance
- **Cold Start Optimization**: Minimize dependencies and keep function payloads small
- **Response Caching**: Implement appropriate caching headers for static data
- **Error Handling**: Use structured error responses to avoid unnecessary retries
- **Logging**: Use selective logging to avoid performance overhead in production

## Security Best Practices

### Authentication Security
- **Session Management**: Implement proper session expiration and refresh token rotation
- **Rate Limiting**: Configure rate limiting for authentication endpoints
- **Input Validation**: Validate all user inputs at both frontend and backend levels
- **CSRF Protection**: Implement CSRF tokens for sensitive operations

### Data Security
- **Encryption**: Use HTTPS for all communications and encrypt sensitive data at rest
- **Access Control**: Implement principle of least privilege for database roles
- **Audit Logging**: Log all sensitive operations for security monitoring
- **Regular Security Updates**: Keep all dependencies updated and monitor for vulnerabilities

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

## Common Development Tasks

### Adding New API Endpoints
1. Define the endpoint in `supabase/functions/api/index.ts` within the appropriate route handler
2. Add corresponding service method in `services/api.ts`
3. Create frontend service wrapper in `src/services/api.ts`
4. Update types in `types.ts` if new interfaces are needed
5. Test endpoint using local Edge Functions server

### Creating New Database Tables
1. Add table definition to `schema.ts` with proper RLS policies
2. Run `npx drizzle-kit generate` to create migration
3. Apply migration with `npx drizzle-kit migrate`
4. Add corresponding TypeScript interfaces in `types.ts`
5. Create CRUD service methods in `services/api.ts`

### Implementing New Components
1. Create component file in appropriate `src/components/` subdirectory
2. Follow existing component patterns for props, state, and styling
3. Integrate with service layer using established API methods
4. Add proper error handling and loading states
5. Ensure mobile responsiveness and accessibility

### Working with Authentication
1. Use `useSession()` hook for authentication state in components
2. Leverage Better-Auth client methods for login/logout flows
3. Implement role-based access control using user permissions
4. Handle biometric authentication through passkey APIs
5. Always validate session tokens before sensitive operations

### Real-time Data Handling
1. Subscribe to Supabase channels for live updates
2. Implement proper subscription cleanup in component effects
3. Handle reconnection logic for network interruptions
4. Use optimistic updates for better user experience
5. Implement proper loading and error states for real-time operations

### Internationalization
1. Add new translations to `translations.ts`
2. Use `getTranslation()` function for dynamic text retrieval
3. Support both Chinese and English languages
4. Consider RTL layout implications for future language support
5. Test translations across all supported languages

### Error Handling and Logging
1. Implement try/catch blocks around async operations
2. Use centralized error handling in service layers
3. Log errors appropriately for debugging and monitoring
4. Provide user-friendly error messages in UI components
5. Implement graceful degradation for offline scenarios

## Database Schema Notes

- Authentication tables (`user`, `session`, `account`, `verification`, `passkey`) follow Better-Auth conventions
- Business tables (`menu_dishes`, `orders`, `users`, `partners`, etc.) include `partner_id` for multi-tenancy
- All business data is physically isolated by `partner_id` with RLS enforcement
- Monetary values are stored as `numeric` type in database but converted to `number` in application layer
- JSONB fields are used for flexible data storage (items in orders, permissions, etc.)

## Key Utilities and Helpers

### Data Transformation
- `parseNumeric()`: Safely convert database numeric values to JavaScript numbers
- Mapping functions (`mapDishFromDB`, `mapOrderFromDB`): Convert between database snake_case and frontend camelCase
- Contract alignment utilities ensure consistent data flow between layers

### Constants and Configuration
- `ROOT_PROTECTION`: Root administrator email protection constant
- `INITIAL_DISHES`, `INITIAL_CATEGORIES`: Seed data for new installations
- Demo mode support for offline development and testing

### Security Considerations
- All business operations must validate `partner_id` to prevent cross-tenant data access
- JWT tokens contain tenant context that's extracted and validated at database level
- RLS policies are enforced at PostgreSQL level for maximum security
- Biometric authentication provides zero-password security model

## Troubleshooting Guide

### Common Issues and Solutions

**Database Connection Issues**
- Verify `DATABASE_URL` is correctly configured
- Check Supabase project credentials and network connectivity
- Ensure RLS policies are properly applied to all business tables

**Authentication Problems**
- Confirm `BETTER_AUTH_SECRET` is set and is 32 characters long
- Verify Better-Auth session validity in browser developer tools
- Check passkey registration status for biometric login issues

**Real-time Updates Not Working**
- Verify Supabase Realtime channel subscriptions are active
- Check WebSocket connection status in browser network tab
- Ensure proper cleanup of subscriptions to prevent memory leaks

**Type Errors**
- Run `npm run type-check` to identify TypeScript issues
- Check that all new interfaces are properly defined in `types.ts`
- Verify mapping functions maintain type safety between layers

**Performance Issues**
- Use Drizzle Studio to analyze slow queries
- Monitor Supabase dashboard for resource utilization
- Check for unoptimized real-time subscriptions
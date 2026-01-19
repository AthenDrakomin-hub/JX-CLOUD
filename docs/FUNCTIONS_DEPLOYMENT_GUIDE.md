# Supabase Edge Functions Deployment Analysis

## Current Functions Structure

Based on the project analysis, here are the Edge Functions that are implemented in the codebase:

### 1. Main API Gateway (supabase/functions/api/index.ts)
**Purpose**: Primary API gateway handling all business logic
**Endpoints**:
- GET `/api/health` - Health check and diagnostics
- GET `/api/db-check` - Database connectivity and RLS compliance
- GET `/api/dishes` - Retrieve menu dishes
- GET `/api/orders` - Retrieve orders
- GET `/api/users` - Retrieve users
- GET `/api/rooms` - Retrieve room statuses
- GET `/api/categories` - Retrieve menu categories
- POST `/api/auth/request-registration` - Handle registration requests
- POST `/api/auth/approve-registration` - Approve registration requests
- POST `/api/auth/reject-registration` - Reject registration requests
- GET `/api/auth/registration-requests` - Get pending registration requests

### 2. Authentication Service (supabase/functions/auth.ts)
**Purpose**: Authentication and user management
**Endpoints**:
- GET/POST `/auth/session` - Session management
- GET `/auth/get-session` - Session retrieval
- GET `/auth/health` - Auth service health
- POST `/auth/login` - Login endpoint
- POST `/auth/request-registration` - Registration request
- POST `/auth/approve-registration` - Registration approval
- POST `/auth/reject-registration` - Registration rejection
- GET `/auth/registration-requests` - Get registration requests

### 3. Better-Auth Integration (supabase/functions/better-auth.ts)
**Purpose**: Integration with Better-Auth for biometric authentication
**Endpoints**:
- Various endpoints following Better-Auth patterns

### 4. Internationalization Service (supabase/functions/i18n.ts)
**Purpose**: Translation and localization services
**Endpoints**:
- Translation API endpoints

### 5. Initialization Service (supabase/functions/init.ts)
**Purpose**: System initialization and setup
**Endpoints**:
- Initialization endpoints

### 6. Main Redirect Function (supabase/functions/api.ts)
**Purpose**: Redirect to new API entry point
**Behavior**: Redirects to `/api/index`

## Deployment Configuration

The functions are configured in `supabase/functions/config.json`:

```json
{
  "functions": {
    "better-auth": {
      "runtime": "deno1"
    },
    "api/auth/[...betterAuth]": {
      "runtime": "deno1"
    },
    "api/index": {
      "runtime": "deno1"
    }
  },
  "global": {
    "importMap": "./import_map.json"
  }
}
```

## Dependencies

All functions use the import map in `supabase/functions/import_map.json`:

```json
{
  "imports": {
    "better-auth/": "https://esm.sh/better-auth@1.4.15/",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.39.0",
    "drizzle-orm/": "https://esm.sh/drizzle-orm@0.45.1/"
  }
}
```

## Required Environment Variables

For successful deployment, these environment variables must be set in your Supabase project:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Secret for Better-Auth
- `BETTER_AUTH_URL` - Base URL for auth callbacks

## Deployment Steps

1. **Prepare Environment Variables**:
   ```bash
   supabase secrets set SUPABASE_URL='your_supabase_url'
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'
   supabase secrets set DATABASE_URL='your_database_url'
   supabase secrets set BETTER_AUTH_SECRET='your_auth_secret'
   supabase secrets set BETTER_AUTH_URL='your_auth_url'
   ```

2. **Deploy Functions**:
   ```bash
   supabase functions deploy better-auth
   supabase functions deploy api/index
   supabase functions deploy auth
   supabase functions deploy i18n
   supabase functions deploy init
   ```

3. **Verify Deployment**:
   - Check function logs in Supabase Dashboard
   - Test endpoints using curl or browser
   - Verify authentication flow works
   - Confirm RLS policies are enforced

## Important Notes

- All functions use Deno runtime (deno1)
- CORS headers are configured for cross-origin requests
- Functions implement RLS (Row Level Security) for multi-tenancy
- Authentication uses Better-Auth with biometric support
- Functions are designed for global edge deployment
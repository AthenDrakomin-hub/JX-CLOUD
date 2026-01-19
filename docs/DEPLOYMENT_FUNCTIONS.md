# Supabase Edge Functions Deployment Script

## Available Edge Functions for Deployment

Based on the project analysis, here are the Edge Functions that need to be deployed:

### 1. Main API Gateway Function
- **File**: `supabase/functions/api/index.ts`
- **Endpoint**: `/functions/v1/api/index`
- **Functions**:
  - Health check: `/api/health`
  - Database status: `/api/db-check`
  - Dishes management: `/api/dishes` (GET)
  - Orders management: `/api/orders` (GET)
  - Users management: `/api/users` (GET)
  - Rooms status: `/api/rooms` (GET)
  - Categories management: `/api/categories` (GET)
  - Registration management: 
    - `/api/auth/request-registration`
    - `/api/auth/approve-registration`
    - `/api/auth/reject-registration`
    - `/api/auth/registration-requests`

### 2. Authentication Service Function
- **File**: `supabase/functions/auth.ts`
- **Endpoint**: `/functions/v1/auth`
- **Functions**:
  - Session management: `/auth/session`
  - Session retrieval: `/auth/get-session`
  - Health check: `/auth/health`
  - Login endpoint: `/auth/login`
  - Registration request: `/auth/request-registration`
  - Registration approval: `/auth/approve-registration`
  - Registration rejection: `/auth/reject-registration`
  - Registration requests list: `/auth/registration-requests`

### 3. Internationalization Function
- **File**: `supabase/functions/i18n.ts`
- **Endpoint**: `/functions/v1/i18n`
- **Functions**: Translation services

### 4. Initialization Function
- **File**: `supabase/functions/init.ts`
- **Endpoint**: `/functions/v1/init`
- **Functions**: Initialization services

### 5. Better-Auth Integration Function
- **File**: `supabase/functions/better-auth.ts`
- **Endpoint**: `/functions/v1/better-auth`
- **Functions**: Better-Auth integration

## Deployment Commands

To deploy these functions, use the following commands:

```bash
# Deploy all functions
supabase functions deploy

# Deploy individual functions
supabase functions deploy api-index --import-map=supabase/functions/import_map.json
supabase functions deploy auth --import-map=supabase/functions/import_map.json
supabase functions deploy i18n --import-map=supabase/functions/import_map.json
supabase functions deploy init --import-map=supabase/functions/import_map.json
supabase functions deploy better-auth --import-map=supabase/functions/import_map.json

# Deploy with specific configurations
supabase functions deploy --no-verify-jwt  # For testing only
```

## Current Configuration (supabase/functions/config.json)

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

## Required Environment Variables

Make sure these environment variables are set in your Supabase project:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

## Deployment Checklist

- [ ] Verify all functions compile correctly
- [ ] Check that environment variables are properly configured
- [ ] Test function endpoints after deployment
- [ ] Verify RLS policies are working correctly
- [ ] Confirm authentication flows work as expected
- [ ] Validate multi-tenancy isolation
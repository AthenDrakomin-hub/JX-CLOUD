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
- **Edge Functions**: Vercel edge functions in `api/` directory for secure API gateway
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
- `api/index.ts` - Vercel edge function for secure API gateway

## Database Schema

The system uses Supabase PostgreSQL with tables for:
- `system_config` - Global system settings
- `menu_categories` - Food category definitions
- `menu_dishes` - Food items (prices stored in cents as BIGINT)
- `orders` - Order records with JSONB for items
- `users` - User accounts with role-based permissions
- `rooms` - Hotel room tracking
- `expenses` - Financial tracking
- `partners` - Business partner management
- `ingredients` - Inventory management
- `payments` - Payment method configurations

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

## Module Access Control

- JSONB matrix authorization model allows dynamic permission control
- Frontend intercepts access based on `module_permissions` field in users table
- Role-based permissions with admin override capability
- IP whitelisting for enhanced security
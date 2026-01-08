# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is the "江西云厨终端系统" (JX Cloud) - an enterprise hospitality management system built with React, TypeScript, and Vite. The system uses Supabase for backend services and is designed for hotel/restaurant management with features for room management, order processing, inventory, and financial tracking.

## Development Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production (runs tsc and vite build)
- `npm run preview` - Preview the production build locally

## Architecture Overview

- **Frontend**: React 19 with TypeScript, using Vite as build tool
- **Backend**: Supabase (PostgreSQL database with authentication)
- **API Layer**: Service located at `services/api.ts` handles all data operations
- **Authentication**: Supabase Auth with role-based permissions (admin, staff, maintainer)
- **State Management**: React hooks in App.tsx with centralized data fetching
- **UI Components**: Located in `components/` directory with modular structure

## Key Data Flow

- All API calls go through the `api` object in `services/api.ts`
- Authentication state is managed in App.tsx
- Data is fetched in bulk and stored in component state
- Permissions are controlled via JSONB matrix in the database
- Demo mode is available when `isDemoMode` is true

## Important Files

- `App.tsx` - Main application component with routing and authentication
- `services/api.ts` - Core data access layer
- `types.ts` - TypeScript interfaces and enums
- `services/supabaseClient.ts` - Supabase client configuration
- `constants.ts` - Initial data and default values

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

## Security Features

- Role-based access control (admin, staff, maintainer)
- JSONB permission matrix for fine-grained module access
- IP whitelisting for user accounts
- Service role key security via Vercel edge functions
- Row Level Security (RLS) for database protection
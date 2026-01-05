# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is a Jiangxi Cloud Enterprise Hospitality Suite - a full-stack restaurant terminal system built with React and Supabase (PostgreSQL). The system provides comprehensive hotel restaurant management including room management, order processing, supply chain management, financial center, staff management, and system configuration.

## Architecture

- **Frontend**: React 19 with TypeScript, Vite build system
- **Backend**: Supabase (PostgreSQL) with edge functions for payment callbacks
- **Authentication**: Supabase authentication with role-based access control (admin, staff, maintainer)
- **State Management**: React hooks with local storage fallback for offline functionality
- **UI Components**: Custom React components with Tailwind CSS styling
- **API Layer**: VirtualDB abstraction layer that syncs with Supabase, with localStorage fallback for demo mode

## Key Modules

- **Dashboard**: Overview of orders, rooms, expenses, and dishes
- **Room Grid**: Hotel room management and status tracking
- **Order Management**: Order lifecycle from pending to completed
- **Supply Chain**: Dish and ingredient management
- **Financial Center**: Expense tracking and partner management
- **Staff Management**: User role and permission management
- **System Settings**: Configuration for printer, theme, and voice broadcast

## Development Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally

## Database Structure

- Supabase PostgreSQL with tables for: payment_configs, categories, ingredients, system_config, rooms, orders, dishes, users, expenses, partners, material_images
- RLS (Row Level Security) policies for access control in `database/policies.sql`
- Edge functions for payment callbacks and other server-side logic in `database/functions.sql`
- Complete database schema definition in `database/schema.sql`

## Key Files

- `App.tsx` - Main application component with routing and state management
- `services/api.ts` - API abstraction layer with Supabase integration
- `types.ts` - Type definitions for all entities
- `constants.ts` - Initial data and configuration constants
- `components/` - React UI components for each module
- `vite.config.ts` - Vite build configuration with code splitting
- `database/` - Database schema, policies, and functions definitions

## Security Considerations

- Default admin credentials have been removed from constants.ts for production use
- All authentication should be handled through Supabase Auth
- RLS policies are defined in database/policies.sql for fine-grained access control
- Production environment variables must be properly configured on Vercel
- Initial admin user must be created through Supabase Dashboard, not in code

## Production Setup

- Run database initialization script in database/init-production.sql after deployment
- Configure Supabase environment variables in Vercel project settings
- Create initial admin user via Supabase Dashboard
- Verify RLS policies are active and working correctly
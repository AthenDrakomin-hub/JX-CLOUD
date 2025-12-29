# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

This is a hospitality management system called "江西云厨" (JX Cloud) - a hotel/restaurant management solution that allows guests to order food from their rooms. The application uses React with Supabase as the backend, featuring both online and offline capabilities.

## Architecture

- **Frontend**: React 19 with TypeScript, Vite build system
- **Backend**: Supabase (PostgreSQL database with Row Level Security)
- **State Management**: LocalStorage with virtual database that syncs to Supabase
- **UI Components**: Located in the `components/` directory
- **API Layer**: Service layer in `services/api.ts` with offline-first approach
- **Database**: PostgreSQL via Supabase with tables for rooms, dishes, orders, users, etc.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
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

## Key Features

- Room-based ordering system (rooms 8201-8232, 8301-8332, VIP rooms)
- Multi-language support (Chinese/English/Filipino) with database-driven translations
- Language switcher moved to top navigation bar for better accessibility
- Role-based access control (admin, manager, staff)
- Offline-first architecture with sync capabilities
- Payment processing with multiple methods (GCash, Maya, Cash, etc.)
- Inventory management
- Financial reporting
- Security audit logging
- Forced online session management (single active session per user)

## Environment Configuration

The application uses Vite environment variables prefixed with `VITE_`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Important Files

- `App.tsx` - Main application component
- `services/api.ts` - Main API service with offline-first logic
- `services/supabaseClient.ts` - Supabase client configuration
- `types.ts` - Type definitions for all entities
- `constants.ts` - Application constants and initial data
- `components/` - React UI components
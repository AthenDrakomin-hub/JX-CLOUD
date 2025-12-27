# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

JX Cloud (江西云厨) is an enterprise-grade hospitality management suite built with React 19 and Supabase. It's designed for hotels, restaurants, and resorts with features for room management, order processing, menu management, and staff management.

## Architecture

- **Frontend**: React 19 with TypeScript
- **Backend**: Supabase (PostgreSQL database with Realtime subscriptions)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (implied from class names)
- **UI Components**: Custom components with Lucide React icons
- **Database Schema**: Supabase PostgreSQL with tables for users, rooms, dishes, orders, expenses, translations, and security logs

## Key Data Models

- **Users**: Staff/manager/admin accounts with role-based access (id, username, name, role, last_login)
- **Rooms**: Hotel rooms/tables with status tracking (id, status: ready/ordering) - 64 rooms pre-configured (8201-8232 and 8301-8332)
- **Dishes**: Menu items with pricing, categories, and stock (id, name, price, category, stock, image_url)
- **Orders**: Order tracking with status management (id, room_id, items: JSONB, total_amount, status: pending/preparing/delivering/completed/cancelled)
- **Expenses**: Financial tracking for operations (id, category, amount, description, date)
- **Translations**: Multi-language support (key, zh, en, tl)
- **Security Logs**: Audit trail (id, user_id, action, ip, risk_level)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build with bundle analysis (for performance optimization)
npm run build:analyze
```

## Build and Optimization

- The application uses code splitting with manualChunks configuration to optimize bundle size
- Rollup plugins include visualizer for bundle analysis (stats.html)
- Terser is used for advanced minification
- Chunk size warning limit is set to 1000KB to address build warnings

## Environment Configuration

- Environment variables use VITE_ prefix for client-side access
- Required variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Demo mode activates when environment variables are missing, using fallback data
- Default admin credentials: username 'admin', password 'admin123'

## Database Initialization

Run the SQL script from README.md in Supabase SQL Editor to initialize all tables and pre-configure 64 rooms (8201-8232 and 8301-8332).

## API and Services Architecture

- **API Layer**: Located in `services/api.ts`, uses enhanced retry logic with fallback data for resilience
- **Supabase Client**: Configured with environment variable detection and demo mode handling
- **Realtime Subscriptions**: Implemented for order updates via Supabase Realtime
- **Audit Logging**: Security logs are maintained for critical actions
- **Enhanced Error Handling**: Comprehensive error handling with fallback mechanisms

## Component Structure

- **Main Components**: Dashboard, RoomGrid, OrderManagement, MenuManagement, FinanceManagement, StaffManagement, SystemSettings
- **Specialized Components**: GuestOrder (for guest ordering interface), ImageLibrary (for asset management), NotificationCenter (for real-time notifications)
- **Shared Components**: Sidebar, ErrorBoundary, ConfirmationModal, OptimizedImage

## Key Features

- Realtime order notifications via Supabase Realtime
- Multi-language support (Chinese, English, Filipino)
- Room status management
- Order lifecycle management (pending → preparing → delivering → completed/cancelled)
- Menu and inventory management
- Staff management system
- Financial tracking and expense management
- Security audit logging
- Guest ordering interface accessible via ?room= parameter
- QR code generation for room access

## Important Notes

- The application has a fallback mechanism for demo mode when Supabase is unavailable
- Uses enhanced retry logic with fallback data
- Realtime subscriptions are enabled for order updates
- Passwords are hardcoded for demo purposes (admin123, staff123)
- For production deployment on Vercel, ensure `orders` table has Realtime enabled in Supabase Dashboard
- Previously had React 19 compatibility issues with qrcode.react 3.2.0, resolved by updating to qrcode.react 4.2.0 which supports React 19
- The .npmrc file previously configured `legacy-peer-deps=true` due to React 19 compatibility issues, but this is now resolved
- Chunk size warning resolved by implementing code splitting with manualChunks configuration for better performance
- Added Supabase Storage integration for image upload and management in the ImageLibrary component
- Supabase storage buckets configured for public read access with owner-based write permissions for shared assets
- Storage objects indexed with idx_storage_objects_bucket_name for optimized file lookup performance
- Updated storage client to properly set owner metadata for RLS policy compliance
- Integrated set-owner-id Edge Function to ensure proper owner_id column population in storage.objects table
- Created comprehensive multilingual dictionary (Chinese/English/Filipino) for UI internationalization
- Production system deployed at https://www.jiangxijiudian.store/
- Enhanced font readability with improved color contrast and font stack
- Fixed mobile responsiveness issues with responsive sidebar and viewport settings
- Further optimized chunk sizes with enhanced manualChunks configuration to address build warnings
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
# Install dependencies (use legacy peer deps due to React 19 compatibility)
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

- Environment variables use VITE_ prefix for client-side access
- Required variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Demo mode activates when environment variables are missing
- Default admin credentials: username 'admin', password 'admin123'

## Database Initialization

Run the SQL script from README.md in Supabase SQL Editor to initialize all tables and pre-configure 64 rooms (8201-8232 and 8301-8332).

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

## Important Notes

- The application has a fallback mechanism for demo mode when Supabase is unavailable
- Uses enhanced retry logic with fallback data
- Realtime subscriptions are enabled for order updates
- Passwords are hardcoded for demo purposes (admin123, staff123)
- For production deployment on Vercel, ensure `orders` table has Realtime enabled in Supabase Dashboard
- Previously had React 19 compatibility issues with qrcode.react 3.2.0, resolved by updating to qrcode.react 4.2.0 which supports React 19
- The .npmrc file previously configured `legacy-peer-deps=true` due to React 19 compatibility issues, but this is now resolved
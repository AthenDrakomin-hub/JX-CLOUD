# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

JX CLOUD (江西云厨) is an enterprise-level hospitality management suite built with React 19 and Supabase. It provides a comprehensive system for hotels, restaurants, and resorts with features including room management, order processing, menu management, staff management, and financial tracking.

## Architecture

- **Frontend**: React 19 with TypeScript
- **Backend**: Supabase (PostgreSQL database with real-time capabilities)
- **UI Components**: React components with Lucide icons
- **State Management**: React hooks and local state (no Redux/Zustand)
- **Build Tool**: Vite
- **Database**: PostgreSQL via Supabase with RLS (Row Level Security)

## Key Components

- **App.tsx**: Main application with dashboard, room grid, order management, menu management, etc.
- **Services**: API service, Supabase client, notification service, AI service, business logic, security, network management
- **Components**: Modular UI components for each feature area (Dashboard, RoomGrid, OrderManagement, MenuManagement, etc.)

## Database Schema

The system uses a Supabase PostgreSQL database with these main tables:
- `users`: Staff/employee management with role-based access
- `rooms`: Room/table management (64 pre-configured rooms: 8201-8232 and 8301-8332)
- `dishes`: Menu items with pricing, categories, availability
- `orders`: Order tracking with status management
- `expenses`: Operational expense tracking
- `security_logs`: Audit logs for sensitive operations

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

# Run specific test file
npm run test:utils

# Alternative test command
tsx test-functions.ts
```

## Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `API_KEY`: Gemini API key (for AI features)
- `GEMINI_API_KEY`: Alternative Gemini API key variable

## Key Features

- Real-time order tracking and management
- Multi-language support (Chinese, English, and Tagalog)
- Role-based access control (admin, manager, staff)
- Financial management and expense tracking
- Menu management with inventory
- Room/table status management
- Security audit logging for sensitive operations
- Mobile-responsive design
- Payment processing with multiple payment methods (GCash, Maya, GrabPay, etc.)

## Authentication

The system uses simulated authentication in the frontend with:
- Admin user: username 'admin1', password 'admin123'
- Staff user: username 'staff1', password 'staff123'

## Security

- Row Level Security (RLS) policies in Supabase
- Automatic security logging for sensitive operations
- Role-based permissions system
- Client-side validation and sanitization
- Network error handling and request tracking

## Important Files

- `App.tsx`: Main application component
- `services/api.ts`: All API calls and security logging
- `services/supabaseClient.ts`: Database connection
- `services/business.ts`: Business logic validation
- `services/network.ts`: Network error handling and request tracking
- `types.ts`: TypeScript interfaces and enums
- `components/`: All UI components
- `README.md`: Database initialization scripts
- `tsconfig.json`: TypeScript configuration
- `vite.config.ts`: Vite build configuration

## Testing and Quality Assurance

- Unit tests: Run with `npm run test:utils` or `tsx test-functions.ts`
- API validation: Services include comprehensive validation for all data operations
- Type safety: Full TypeScript coverage with strict typing

## Key Services

- `api.ts`: Main API gateway with security logging
- `business.ts`: Business logic validation and rules
- `network.ts`: Network error handling and request tracking
- `security.ts`: Security utilities and audit functions
- `utils.ts`: General utility functions
- `notification.ts`: Notification service
- `aiService.ts`: AI functionality with Gemini API
- `supabaseClient.ts`: Database client configuration

## Key Components

- `Dashboard.tsx`: Main dashboard with analytics
- `RoomGrid.tsx`: Room/table management interface
- `OrderManagement.tsx`: Order processing and tracking
- `MenuManagement.tsx`: Menu and dish management
- `StaffManagement.tsx`: Employee management
- `FinanceManagement.tsx`: Financial tracking and reporting
- `PaymentManagement.tsx`: Payment processing
- `GuestOrder.tsx`: Guest-facing ordering interface

## Type Definitions

The `types.ts` file contains comprehensive TypeScript interfaces for:
- User roles and permissions (UserRole enum)
- Room and order statuses (RoomStatus, OrderStatus enums)
- Payment methods (PaymentMethod enum)
- All core data models (User, Dish, Order, Expense, SecurityLog, etc.)

## Deployment Notes

- Deploy frontend to Vercel
- Backend services hosted on Supabase
- Ensure Realtime subscription is enabled for the `orders` table in Supabase Dashboard
- Environment variables must be configured in deployment platform
- Database initialization script must be run in Supabase SQL Editor before deployment

## Documentation Structure

- `docs/` directory contains user manuals, admin guides, and technical documentation
- API documentation and database schema in README.md
- Deployment checklist in DeploymentChecklist.tsx component
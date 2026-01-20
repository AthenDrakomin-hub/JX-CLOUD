# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Executive Summary

**JX Cloud Terminal** is a comprehensive hospitality management system built with:
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions + PostgreSQL 15 with RLS
- **Auth**: Better-Auth with FIDO2/WebAuthn biometric support
- **Architecture**: Physical multi-tenancy with row-level security

Key features include QR ordering, KDS kitchen display, financial auditing, and supply chain management. All business data is isolated by `partner_id` using PostgreSQL RLS policies.

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
- **Edge Functions Gateway**: `supabase/functions/api/index.ts` serves as primary API entry point
- **Authentication Handler**: `supabase/functions/auth/index.ts` manages Better-Auth integration
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
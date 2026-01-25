# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

JX Cloud Terminal is a hospitality suite frontend application built with modern React 19. The project is now a pure frontend application with all backend dependencies removed.

## Architecture

- **Frontend**: React 19 application using Vite, located in `/frontend`
- **Shared**: Type definitions in `/shared` (for API interfaces)

## Key Technologies

- Frontend: React 19, TypeScript, Vite
- Build Tool: Vite
- Package Manager: npm

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production version
npm run build

# Preview built application
npm run preview
```

## Testing

No automated tests are currently configured in the project. Manual testing is recommended.

## Environment Configuration

- Environment variables are managed in `.env.local` for local development
- No API proxy configuration needed as it's a pure frontend application
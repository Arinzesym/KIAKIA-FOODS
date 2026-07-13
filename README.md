# KiaKia Foods Business Operating System

A production-ready SaaS-style web application scaffold for KiaKia Foods built with Next.js, TypeScript, Tailwind CSS, Shadcn-style UI components, Supabase, PostgreSQL, Recharts, React Hook Form, and Zod.

## Features
- Customer marketing site with Home, About, Services, and Contact
- Customer authentication flow with profile, saved addresses, order history, and quick reorder
- Smart order builder with live cost calculation and WhatsApp order submission
- Admin portal with dashboard metrics, order management, customer database, reports, and settings
- Modular and scalable codebase with reusable components
- Brand-ready colors, typography, and navigation

## Getting Started
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials and WhatsApp number
3. Run `npm install`
4. Run `npm run dev`

## Project Structure
- `src/app`: App routes and pages
- `src/components`: Reusable UI components and forms
- `src/lib`: Client helpers and data models

## Release Notes (July 2026)

### New Admin APIs
- `GET/PUT /api/admin/business-settings`: Server-backed business configuration (fees, market windows, runner bonus, currency) with compatibility-safe merge behavior.
- `GET/POST/PATCH/DELETE /api/admin/catalog`: Full admin catalog CRUD for weekly groceries and specialty items.

### Operational Checks
- `npm run lint`: Lint validation for code quality.
- `npm run test`: Unit tests for margin engine, OMS compatibility helpers, and dispatch fallback mapping.
- `npm run build`: Production build and type validation.
- `npm run db:smoke`: Database schema smoke-check for required OMS tables/columns (requires `SUPABASE_SERVICE_ROLE_KEY` and either `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`).

## Notes
- Payment is intentionally disabled. Orders are generated as WhatsApp messages.
- Ownership remains with KiaKia Foods; no proprietary platform lock-in.

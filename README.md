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

## Notes
- Payment is intentionally disabled. Orders are generated as WhatsApp messages.
- Ownership remains with KiaKia Foods; no proprietary platform lock-in.

# KiaKia Foods OMS v2

## Technical Architecture Document

Version: 2.0  
Date: July 2026  
Audience: Incoming Engineer / Technical Partner

---

## 1) Architecture Overview

Tech stack:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Supabase (PostgreSQL + API)
- Vercel deployment

High-level layers:
- UI layer: app routes and components
- Domain/business logic: reusable lib modules
- Data/service layer: API routes and Supabase admin client
- Persistence: PostgreSQL schema in Supabase
- Runtime config: environment variables and settings tables

Key principle: incremental extension of existing OMS, not a rewrite.

---

## 2) Code Structure

Core paths:
- src/app: routes (public, admin, api)
- src/components: shared UI and domain components
- src/lib: services, state, business logic, types, compatibility
- scripts: migration and smoke-check utilities
- public: static assets, icons, service worker

Important shared logic modules:
- src/lib/marginEngine.ts
- src/lib/businessSettings.ts
- src/lib/catalogApi.ts
- src/lib/dispatchFallback.ts
- src/lib/omsCompatibility.ts
- src/lib/StoreContext.tsx

---

## 3) Data Model and Schema

Primary entities:
- orders
- customers
- runner_tasks
- runner_assignments
- dispatches
- rider_assignments
- estate_batches
- delivery_batches
- products
- specialty_products
- admin_settings
- business_settings
- notifications
- estates

Notable order fields used by OMS v2:
- market_day
- product_line
- assigned_runner_id
- shopping_budget
- actual_spend
- shopping_margin
- runner_incentive
- business_margin
- delivery_batch_id
- custom_delivery
- custom_delivery_reason
- custom_delivery_requested_date
- custom_delivery_premium_fee
- delivery_margin
- receipt_images
- unavailable_items
- suggested_substitutions
- status_timeline

Schema sources:
- supabase-schema.sql
- scripts/migrations/20260713_oms_v2_runner_model.sql

Compatibility strategy:
- OMS route supports column/table variability via parser helpers in src/lib/omsCompatibility.ts.

---

## 4) API Surface

### Existing Core API
- POST/GET /api/oms
  - Snapshot retrieval and mutation entrypoint for operational resources.

### Auth and Admin APIs
- POST /api/auth/login
- GET /api/admin/users

### New Admin APIs
- GET, PUT /api/admin/business-settings
  - Server-backed settings persistence.
  - Merges business_settings and admin_settings for compatibility.

- GET, POST, PATCH, DELETE /api/admin/catalog
  - Product and specialty catalog CRUD.

Response style:
- JSON payloads with explicit error fields and fallback indicators where relevant.

---

## 5) Authentication and Authorization Flow

Current model:
- Cookie-based role context.
- Common cookies used in UI/API logic include auth-role and auth-name (and auth-token in logout flow).
- normalizeRole and role guards enforce access scope.

Role guard patterns:
- Admin-only checks in admin APIs.
- Delivery role checks for runner/rider flows.
- UI route visibility and nav determined from role.

Security roadmap:
- Harden session validation against backend auth provider.
- Move from role cookie trust to signed/verified token claims end-to-end.

---

## 6) State and Synchronization

Primary pattern:
- StoreContext holds client state for operational workflows.
- /api/oms remains source-of-truth sync endpoint.

Important behavior:
- Prefer backend truth and snapshot refresh over silent local divergence.
- Local fallback paths exist for resilience but should be observable to users.

---

## 7) Business Rule Engine

Margin calculations (src/lib/marginEngine.ts):
- Shopping Margin = allocatedBudget - actualSpend
- Runner Bonus = actualSpend x runnerBonusPercentage/100
- Business Margin = shoppingMargin - runnerBonus
- Delivery Margin = collectedDeliveryFees - dispatchCost

Dispatch/order mapping (src/lib/dispatchFallback.ts):
- Shared status mappings avoid route-level duplication.
- Fallback payload builder keeps update compatibility centralized.

Settings behavior (src/lib/businessSettings.ts):
- Server-first read/write via admin settings API
- Local storage fallback for continuity

---

## 8) Mobile and PWA Architecture

Mobile-first implementation aspects:
- Global touch-friendly control sizing and defaults in global styles
- Mobile drawer navigation
- Card layouts for narrow screens on operational tables

PWA components:
- src/app/manifest.ts
- public/sw.js
- src/components/PWARegistration.tsx
- public/icons/icon-192.svg
- public/icons/icon-512.svg

Current PWA level:
- Baseline installability and asset caching
- Future enhancements can add offline mutation queue and sync conflict resolution

---

## 9) Deployment and Environment

Deployment target:
- Vercel

Critical env vars:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Smoke-check script expectations:
- npm run db:smoke needs SUPABASE_SERVICE_ROLE_KEY and either SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.

Build pipeline essentials:
- npm install
- npm run lint
- npm run test
- npm run build

---

## 10) Testing Strategy

Unit tests added for core logic:
- src/lib/__tests__/marginEngine.test.ts
- src/lib/__tests__/dispatchFallback.test.ts
- src/lib/__tests__/omsCompatibility.test.ts

Recommended expansion:
- API handler tests for admin settings/catalog
- End-to-end tests for order->runner->dispatch lifecycle
- Visual regression checks for mobile breakpoints

---

## 11) Coding Standards

General standards:
- TypeScript-first, explicit types for API and domain contracts
- Reusable helpers for business logic and compatibility logic
- No hardcoded business constants where settings should control behavior
- Keep route handlers thin and push reusable logic into lib modules

Error handling:
- Return structured JSON errors from APIs
- Preserve user-safe fallback with explicit warning/notice states

Git practice:
- Small, meaningful commits
- Feature branches and PRs for major changes when team process requires

---

## 12) Operations Runbook (Minimum)

When onboarding or deploying updates:
1. Pull latest main
2. Install dependencies
3. Validate environment variables
4. Run lint, test, build
5. Run db smoke checks against target database
6. Verify mobile critical workflows in staging
7. Deploy to Vercel
8. Perform post-deploy smoke pass

---

## 13) Known Constraints and Technical Debt

- Compatibility shims are still needed because of schema variability across environments.
- Cookie role checks should be replaced with stronger signed claim verification over time.
- Service worker currently provides baseline caching, not full offline operations.

---

## 14) Recommended Next Technical Steps

1. Add contract tests for admin APIs and /api/oms mutation branches.
2. Introduce typed repository/service layer wrappers for all table access.
3. Add audit/event log table for high-impact operational transitions.
4. Add background jobs for report generation and notifications.
5. Prepare WhatsApp webhook ingestion boundary with idempotency handling.

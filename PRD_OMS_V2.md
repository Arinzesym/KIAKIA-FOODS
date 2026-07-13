# KiaKia Foods OMS v2

## Product Requirements Document (PRD)

Version: 2.0  
Date: July 2026  
Owner: Operations and Technical Team

---

## 1) Product Vision

Build a mobile-first operations platform that allows KiaKia Foods to execute market sourcing and delivery reliably, measure margin performance in real time, and scale without depending on manual coordination.

---

## 2) Goals and Non-Goals

### Goals
- Improve end-to-end operational visibility.
- Reduce execution errors in runner and dispatch handoffs.
- Automate margin calculations for all orders and batches.
- Keep existing OMS flows functional while extending capabilities.
- Provide stable mobile UX for field operations.

### Non-Goals
- Full inventory management in this phase.
- Fully automated WhatsApp API ingestion in this phase.
- Third-party route optimization integration in this phase.

---

## 3) Personas

### Admin/Operations Officer
Needs rapid order entry, assignment, and exception handling from phone and desktop.

### Runner
Needs quick task view, spend entry, receipt upload, and completion without admin complexity.

### Dispatch Rider
Needs clear delivery list, customer contact actions, and simple status progression.

### Business Owner
Needs dashboards, margin trends, and configurable fees/settings.

---

## 4) Functional Modules

### 4.1 Authentication and Role Routing
- Users sign in via admin login flow.
- Role-based routing controls visible pages and operations.
- Session cookies persist role context.

### 4.2 Dashboard
- KPI summary tiles with operational and margin metrics.
- Fast links to orders, dispatch, settings, reports.
- Mobile cards and desktop analytics layout.

### 4.3 Orders
- Create/edit orders.
- Attach customer, address, line items, market day, fees.
- Assign runner and rider.
- Track statuses and notes.
- View order detail page by order ID.

### 4.4 Runner Workflows
- Runner sees only assigned tasks.
- Start shopping, update actual spend, add notes.
- Upload/attach receipt artifact.
- Mark shopping completed and staged.

### 4.5 Dispatch/Rider Workflows
- Dispatch board for assignment and progression.
- Rider sees assigned deliveries.
- Quick call/WhatsApp/navigation actions.
- Update status through completion.

### 4.6 Delivery Batching
- Group by estate, market day, and window.
- Assign rider and track batch status.
- Compute delivery margin from fees and dispatch cost.

### 4.7 Product Catalog
- Weekly groceries and specialty items lines.
- CRUD for catalog entries.
- Specialty metadata: category, description, availability, lead time, minimum quantity.

### 4.8 Business Settings
- Manage service fee, default/custom delivery fee, runner bonus percent, market day labels, windows, currency.
- Persist settings server-side with fallback behavior.

### 4.9 Reporting and Analytics
- Basic operational reports and analytics pages.
- Expandable for deeper cohort, profitability, and SLA views.

### 4.10 PWA and Mobile Experience
- Manifest and service worker present.
- Installable app baseline.
- Touch-friendly controls and responsive layouts.

---

## 5) Screen Inventory and Requirements

### Public and Customer-Facing
- /: Landing page
- /about
- /services
- /contact
- /confirm-order
- /order-confirmation-success
- /toolkit
- /customer (future portal shell)

Requirements:
- Preserve current conversion flow to WhatsApp.
- Keep lightweight first-load behavior on mobile.

### Authentication
- /auth/admin-login
- /customer/auth/login
- /customer/auth/register
- /customer/auth/reset-password

Requirements:
- Role-based entry with safe handling of invalid/expired sessions.

### Admin Core
- /admin/dashboard
- /admin/orders
- /admin/orders/create
- /admin/orders/[orderId]
- /admin/customers
- /admin/dispatch
- /admin/estate-batching
- /admin/runners
- /admin/riders
- /admin/catalog
- /admin/analytics
- /admin/finance
- /admin/reports
- /admin/settings
- /admin/team

Requirements:
- Search/filter controls responsive on mobile.
- Table-to-card fallback on small screens.
- Action buttons with touch-safe dimensions.

### Runner/Rider Portals
- /runner
- /rider

Requirements:
- Minimal cognitive load.
- Prioritize action completion over dense data display.

---

## 6) Key Workflows

### Workflow A: Create and Assign Order
1. Admin creates order.
2. System computes totals and initial status.
3. Admin assigns runner and optional rider.
4. Notifications/dispatch records update.

Acceptance:
- Order appears in relevant admin lists immediately.
- Runner/rider views reflect assignment.

### Workflow B: Runner Shopping Completion
1. Runner opens assigned task.
2. Runner updates actual spend and notes.
3. Runner attaches receipt.
4. Runner marks completed/staged.
5. System recalculates shopping margin and bonus.

Acceptance:
- Margin fields update without manual entry.
- Status progression is recorded and visible to admin.

### Workflow C: Delivery Completion
1. Dispatch assigns/updates rider.
2. Rider updates status lifecycle.
3. Rider marks delivered/completed.
4. System syncs order and dispatch states.

Acceptance:
- Dispatch status and order status remain logically consistent.
- Completion reflected on dashboard and order detail.

### Workflow D: Catalog and Settings Administration
1. Admin updates catalog/settings.
2. API persists to database.
3. UI reflects updates and handles fallback if server unavailable.

Acceptance:
- Updates survive refresh and multi-session use.
- Error states are explicit and non-destructive.

---

## 7) User Stories and Acceptance Criteria

### Admin Stories
- As an admin, I can create an order in under 2 minutes on mobile.
- As an admin, I can assign a runner and rider from the same operational flow.
- As an admin, I can filter orders by estate, market day, status, and assignee.
- As an admin, I can adjust fees and bonus settings without code changes.

Acceptance:
- Filters produce deterministic results.
- Updated settings affect downstream calculations.

### Runner Stories
- As a runner, I can see only my current assignments.
- As a runner, I can submit actual spend and receipt from my phone.
- As a runner, I can report unavailable items/substitutions quickly.

Acceptance:
- Assignment visibility is role-scoped.
- Spend submission updates related margin fields.

### Rider Stories
- As a rider, I can contact customers and navigate from assignment screen.
- As a rider, I can progress delivery status with one tap actions.

Acceptance:
- Status transitions update both rider and admin views.

---

## 8) Business Rules

- Runner bonus rate is configurable (default 5%).
- Delivery premium fee is configurable and never hardcoded.
- Market day classification controls sourcing cycle and filtering.
- Margin calculations are system-owned and auto-derived.

---

## 9) UX and Mobile Requirements

- Minimum touch target around 44px.
- Keep primary actions in thumb reach on small screens.
- Convert dense tables to stacked cards where appropriate.
- Maintain readable typography and safe spacing at 320-414 widths.

Breakpoint validation targets:
- 320, 375, 390, 414, 768, 1024, desktop.

---

## 10) Quality and Observability

- Lint/build must pass on every significant change.
- Unit tests for margin and compatibility logic.
- Manual smoke checks for critical workflows.
- Migration/schema smoke script for deployment readiness.

---

## 11) Release Readiness Checklist

- Functional:
  - Order create/edit/assignment works.
  - Runner/rider flows work.
  - Settings and catalog persistence works.
  - Margins calculate correctly.
- Technical:
  - npm run lint passes.
  - npm run test passes.
  - npm run build passes.
  - npm run db:smoke passes in environment with Supabase credentials.
- UX:
  - Mobile smoke across target breakpoints completed.

---

## 12) Risks and Mitigations

- Risk: schema drift across environments.
  - Mitigation: compatibility helpers and db smoke checks.
- Risk: mobile regression from desktop-first updates.
  - Mitigation: explicit mobile acceptance criteria and breakpoint QA.
- Risk: fallback mode hides persistence failures.
  - Mitigation: visible notices and server-first design.

---

## 13) Success Metrics

- Reduced assignment and dispatch turnaround time.
- Reduced manual margin calculation effort.
- Increased on-time task completion rate.
- Stable mobile usability for field teams.


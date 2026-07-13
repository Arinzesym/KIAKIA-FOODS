# KiaKia Foods

## IT Project Brief
### Order Management System (OMS) v2

Version: 2.0  
Date: July 2026  
Prepared For: Incoming Software Engineer / Technical Partner

---

## 1) Company Overview

KiaKia Foods is a grocery sourcing and delivery company in Abuja, Nigeria.

The business helps customers buy groceries and specialty food items from local markets without visiting the market physically. Customers mostly interact through WhatsApp, while internal execution runs through a custom OMS.

Strategic direction:
- Scale from owner-led operations into a structured execution platform.
- Support multiple markets, runners, and dispatch riders.
- Prepare for automated WhatsApp order intake and customer self-service.

---

## 2) Business Model

### A. Delivery Fee Margin

Orders are grouped by estate/location and routed in batches.

Business logic:
- Each customer pays a delivery fee.
- Multiple orders can share one dispatch run.
- Delivery Margin = Total Delivery Fees Collected - Actual Dispatch Cost.

### B. Shopping Margin

Each runner receives an allocated budget per order.

Business logic:
- Shopping Margin = Allocated Budget - Actual Spend.
- Runner Bonus = 5% x Actual Spend.
- Business Shopping Margin = Shopping Margin - Runner Bonus.

### C. Specialty Product Sales

Weekend operations include specialty products such as:
- Dried and Peppered Goat Meat
- Dried and Peppered Catfish
- Crayfish
- Ogbono
- Egusi
- Cocoa Products
- Other dry food items

---

## 3) Current Operations Flow

Customer -> WhatsApp Order -> Operations Team -> OMS -> Runner Assignment -> Market Purchase -> Central Staging Point -> Delivery Batch -> Dispatch Rider -> Customer

---

## 4) Existing System Baseline

Current OMS already includes:
- Marketing/landing pages
- Customer order builder
- WhatsApp order submission
- Admin dashboard and order tracking
- Vercel deployment

Guiding principle: extend, do not rewrite.

Required:
- Preserve existing behavior where possible.
- Keep backward compatibility for users, routes, and operational workflows.

---

## 5) Project Objectives

Evolve OMS from a simple order tracker into a full operations platform covering:
- Customer operations
- Admin/operations coordination
- Runner workflows
- Dispatch rider workflows
- Market day planning
- Delivery batching
- Financial margin tracking
- Reporting and analytics

---

## 6) User Roles and Responsibilities

### Administrator

Responsible for:
- Creating and editing orders
- Assigning runners
- Managing delivery batches
- Managing product catalog
- Monitoring operations
- Managing settings and fees
- Viewing reports and analytics

### Runner

Responsible for:
- Viewing assigned tasks
- Completing shopping tasks
- Uploading receipts
- Entering actual spend
- Reporting unavailable items
- Suggesting substitutions

Access restrictions:
- No financial reports
- No admin settings
- No other runner assignments

### Dispatch Rider

Responsible for:
- Viewing assigned deliveries/batches
- Viewing address and route context
- Contacting customers
- Updating delivery status
- Uploading proof of delivery (future-ready)

### Customer (Roadmap)

Future self-service:
- Login
- Order history
- Repeat order
- Delivery tracking

---

## 7) Core Functional Scope

### Order Management Fields

Each order should support:
- Order ID
- Customer details
- Contact details
- Estate and address
- Order items
- Market day
- Assigned runner
- Delivery batch
- Allocated budget
- Actual spend
- Shopping margin
- Runner bonus
- Delivery margin
- Status and notes

### Product Catalog

Two lines:
- Weekly Groceries (weekday cycle)
- Specialty Items (weekend cycle)

Each product should support:
- Category
- Description
- Image
- Availability
- Lead time
- Unit and price reference

### Market Day Management

Support at minimum:
- Weekday market cycle
- Weekend market cycle

Orders must be filterable by market day.

### Runner Assignment

Admin sends task context:
- Shopping list
- Budget
- Notes
- Estate
- Deadline

Runner submits:
- Actual spend
- Receipt image(s)
- Completion status

### Financial Engine

System should compute margins automatically. No manual spreadsheet calculations should be required.

### Delivery Batching

Grouping keys:
- Estate
- Market day
- Delivery window

Batch should include:
- Assigned rider
- Included orders
- Dispatch cost
- Total delivery fees
- Calculated margin

### Custom Deliveries

Support premium off-schedule delivery with configurable premium fee from settings.

No hardcoded pricing.

---

## 8) Dashboard Expectations

Operational dashboard should show:
- Today orders
- Orders by estate
- Orders by market day
- Runner performance
- Delivery performance
- Shopping margin
- Delivery margin
- Weekly revenue
- Weekly profit
- Pending orders and assignments
- Custom deliveries
- Specialty product sales

---

## 9) Mobile-First Requirement

Primary users work on Android phones:
1. Runners
2. Dispatch riders
3. Operations staff

Implications:
- Responsive layouts on all major pages
- Tables become cards on small screens
- Touch-friendly controls and navigation
- PWA-ready posture for installable app behavior

Desktop remains supported, but is secondary.

---

## 10) Technical Expectations

Architecture should remain clean and maintainable:
- Separate UI, domain logic, services, data access, and configuration
- Reuse business logic modules to avoid duplication
- Keep rules configurable, not hardcoded
- Document major rules, migrations, and compatibility decisions

---

## 11) Deployment Context

Current deployment:
- Vercel

Future needs:
- PostgreSQL/Supabase maturity
- Background jobs
- WhatsApp webhook automation
- Notifications
- Cloud file storage
- Scheduled/automated reporting

---

## 12) Delivery Roadmap

Phase 1:
- Runner management
- Delivery batching
- Financial calculations

Phase 2:
- Dispatch rider portal
- Reporting
- Mobile optimization
- PWA

Phase 3:
- WhatsApp API automation
- Customer portal
- Push notifications
- Inventory layer

Phase 4:
- AI-assisted forecasting
- Route optimization
- Vendor management
- Multi-city rollout

---

## 13) Engineering Principles

The engineer should:
- Extend current OMS, not rebuild from scratch
- Preserve working functionality
- Build for long-term operations
- Prioritize mobile usability and reliability
- Keep changes auditable through meaningful Git commits and PRs
- Document architecture and schema changes with each major increment

---

## 14) Definition of Success

OMS v2 is successful when KiaKia Foods can coordinate dozens to hundreds of weekly orders with minimal manual overhead, while maintaining clear visibility into:
- Runner assignment execution
- Delivery batching performance
- Margin and profitability health
- Operational bottlenecks

The platform must remain fast, secure, mobile-friendly, and extensible for growth.

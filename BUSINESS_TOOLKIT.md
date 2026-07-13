# KiaKia Foods Business Toolkit

## 1. Market positioning

Focus on direct B2C orders from households in gated communities, apartment estates, and compound neighborhoods.

- Customers place orders through WhatsApp.
- Your app aggregates household orders and groups them by estate for efficient delivery.
- Deliveries are grouped by estate to lower cost while keeping orders individual.

## 2. Capital-light model

Use market sourcing with your own order and delivery coordination.

- Do not hold inventory at the estate level.
- Use a market runner to collect all orders from the local market.
- Bring the haul to a central estate dispatch point.
- Batch deliveries estate-by-estate, then distribute house-by-house.

## 3. Revenue streams

- Per-order transaction fee (3–5%)
- Delivery service fee per household order
- Premium services: priority delivery, scheduled delivery, in-estate dispatch optimization, order tracking

## 4. Launch strategy

1. Pilot one estate with direct customer WhatsApp orders.
2. Capture each household order individually.
3. Send a market runner to fulfill the estate batch.
4. Group deliveries by estate at the dispatch point.
5. Use the pilot to scale the same model into neighboring estates.

## 5. Growth model

Expand by:

- adding more estates with the same B2C delivery grouping
- encouraging resident referrals and repeat orders
- launching premium delivery bundles for speed or scheduled drops
- improving efficiency with established market and estate routes

## 6. Profit focus

Maximize profit by:

- keeping fixed costs low
- increasing order volume from each estate
- reducing last-mile cost by estate grouping
- charging per household order plus delivery service fees

## 7. Product priorities

- WhatsApp-driven order capture
- Estate-grouped delivery coordination
- Central market sourcing and dispatch
- Accurate individual household fulfillment
- Simple repeat-order and order history support
- Mobile-first runner, rider, customer, and admin workflows

## 8. Why this works

- Direct customers use a simple WhatsApp channel.
- Grouped estate deliveries lower transport costs.
- Each household order remains individual, preserving order revenue.
- The platform and delivery coordination are the scalable advantage.

## 9. Brand identity

Use these colors across the web app and toolkit:

- Primary brand green: `#3a8d4b`
- Deep forest green: `#163a1d`
- Accent leaf green: `#84d696`
- Support background: `#f6fbf4`

These colors match the web app theme and make the brand feel warm, energetic, and professional.

---

### Site route

Visit the toolkit page in the app at:

`/toolkit`

This is your practical B2C delivery model and operations playbook.

## 10. Mobile-first execution standard

The OMS is optimized for phones first, then tablets and desktop.

- Runner and rider actions are one-handed and touch-safe.
- Order creation and dispatch updates are streamlined for fast field use.
- Core breakpoints to validate: 320, 375, 390, 414, 768, 1024, and desktop widths.
- PWA installation is enabled for faster repeat access.

## 11. Cloud-backed controls

Admin settings and catalog now support server-backed persistence, with local fallback safety:

- Settings API: `GET/PUT /api/admin/business-settings`
- Catalog API: `GET/POST/PATCH/DELETE /api/admin/catalog`
- Pages consume server data first and gracefully continue when cloud sync is unavailable.

## 12. Operational hardening checklist

Before go-live or major releases, run:

1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. `npm run db:smoke`

`db:smoke` validates critical migration expectations for required OMS tables and columns.

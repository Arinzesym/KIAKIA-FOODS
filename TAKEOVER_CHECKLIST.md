# KiaKia Foods OMS v2

## Project Takeover Checklist

Purpose: Ensure complete handover to incoming IT owner with clear accountability, access transfer, and production continuity.

Date: ____________________  
Outgoing Owner: ____________________  
Incoming Owner: ____________________

---

## A) Core Handover Documents

- [ ] IT Brief shared: [IT_BRIEF_OMS_V2.md](IT_BRIEF_OMS_V2.md) / [IT_BRIEF_OMS_V2.docx](IT_BRIEF_OMS_V2.docx)
- [ ] PRD shared: [PRD_OMS_V2.md](PRD_OMS_V2.md) / [PRD_OMS_V2.docx](PRD_OMS_V2.docx)
- [ ] Technical Architecture shared: [TECHNICAL_ARCHITECTURE_OMS_V2.md](TECHNICAL_ARCHITECTURE_OMS_V2.md) / [TECHNICAL_ARCHITECTURE_OMS_V2.docx](TECHNICAL_ARCHITECTURE_OMS_V2.docx)
- [ ] README release notes reviewed: [README.md](README.md)

Sign-off (A): ____________________

---

## B) Repository and Code Ownership

- [ ] GitHub repo access granted (write/maintain/admin as agreed)
- [ ] Branch protection rules reviewed and confirmed
- [ ] Default branch and merge policy explained
- [ ] Current stable baseline shared (latest pushed commit)
- [ ] Local setup verified on incoming owner's machine

Primary references:
- [README.md](README.md)
- [package.json](package.json)

Sign-off (B): ____________________

---

## C) Secrets and Environment Variables

- [ ] All required env vars transferred via secure channel (not chat/email plain text)
- [ ] Local environment setup verified against template
- [ ] Vercel env vars configured in Development/Preview/Production
- [ ] Supabase keys verified for intended scopes

Primary references:
- [.env.local.example](.env.local.example)

Sign-off (C): ____________________

---

## D) Infrastructure and Deployment Access

- [ ] Vercel project access transferred
- [ ] Domain and DNS access transferred
- [ ] Build/deploy command flow tested
- [ ] Rollback procedure tested or documented
- [ ] Incident escalation path documented

Sign-off (D): ____________________

---

## E) Database and Migration Ownership

- [ ] Supabase project owner/admin access granted
- [ ] Baseline schema reviewed
- [ ] Latest migration reviewed and understood
- [ ] Backup/restore process documented and tested

Primary references:
- [supabase-schema.sql](supabase-schema.sql)
- [scripts/migrations/20260713_oms_v2_runner_model.sql](scripts/migrations/20260713_oms_v2_runner_model.sql)

Sign-off (E): ____________________

---

## F) API and Service Layer Handover

- [ ] OMS API behavior reviewed
- [ ] Admin Business Settings API reviewed
- [ ] Admin Catalog API reviewed
- [ ] Compatibility and fallback behavior reviewed

Primary references:
- [src/app/api/oms/route.ts](src/app/api/oms/route.ts)
- [src/app/api/admin/business-settings/route.ts](src/app/api/admin/business-settings/route.ts)
- [src/app/api/admin/catalog/route.ts](src/app/api/admin/catalog/route.ts)
- [src/lib/omsCompatibility.ts](src/lib/omsCompatibility.ts)
- [src/lib/dispatchFallback.ts](src/lib/dispatchFallback.ts)

Sign-off (F): ____________________

---

## G) Operational Settings and Business Rules

- [ ] Current business settings exported/reviewed
- [ ] Catalog data exported/reviewed
- [ ] Margin formulas reviewed and validated
- [ ] Configurable fees confirmed (no hardcoded business values)

Primary references:
- [src/lib/businessSettings.ts](src/lib/businessSettings.ts)
- [src/lib/catalogApi.ts](src/lib/catalogApi.ts)
- [src/lib/marginEngine.ts](src/lib/marginEngine.ts)

Sign-off (G): ____________________

---

## H) Quality Gates and Release Checks

Run and record results:

- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build
- [ ] npm run db:smoke

Smoke-check requirements:
- [ ] SUPABASE_SERVICE_ROLE_KEY present
- [ ] SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL present

Primary reference:
- [scripts/migration-smoke-check.mjs](scripts/migration-smoke-check.mjs)

Sign-off (H): ____________________

---

## I) Known Risks and Open Items

- [ ] Outstanding bugs and risks listed and acknowledged
- [ ] Schema compatibility caveats reviewed
- [ ] Mobile-first priorities reviewed
- [ ] Future roadmap scope boundaries clarified

Optional reference:
- [BUSINESS_TOOLKIT.md](BUSINESS_TOOLKIT.md)

Sign-off (I): ____________________

---

## J) Week 1 Ownership Plan

- [ ] Day 1: Access verification (GitHub, Vercel, Supabase)
- [ ] Day 2: Local setup + full quality gate run
- [ ] Day 3: Staging smoke test for core workflows
- [ ] Day 4: Production deployment readiness review
- [ ] Day 5: First independent maintenance task completed

Sign-off (J): ____________________

---

## Final Takeover Confirmation

Outgoing Owner confirms transfer is complete:  
Name: ____________________  
Signature: ____________________  
Date: ____________________

Incoming Owner confirms takeover accepted:  
Name: ____________________  
Signature: ____________________  
Date: ____________________

# frontend-v3 Migration — Progress Tracker

## How to use this file

This file is the **single source of truth** for the frontend-v3 migration project. Update it whenever:
- A task is started or completed
- A bug or issue is discovered
- An architectural decision is made
- A question arises that needs an answer before proceeding

Keep the Summary Dashboard in sync with milestone statuses. Add entries to the Known Issues Log and Decisions Log as they occur. Do not delete old entries — mark them resolved.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 Completed | Done and verified |
| 🟡 In Progress | Actively being worked on |
| 🔴 Blocked | Cannot proceed without external input |
| 🟠 Halted | Started but paused |
| 🔵 In Review | Done, awaiting review |
| ⚪ Pending | Not started yet |
| ✅ | Task complete |
| ❌ | Task not started |
| ⚠️ | Task has a known issue |

---

## Summary Dashboard

| # | Milestone | Status | % Complete | Blockers |
|---|-----------|--------|------------|---------|
| 0 | Architecture & Agent Guidance | 🟢 Completed | 100% | — |
| 1 | Project Scaffolding & Tooling | 🟢 Completed | 100% | — |
| 2 | Auth Feature | 🟢 Completed | 100% | — |
| 3 | Shared Layout & Navigation | 🟢 Completed | 100% | — |
| 4 | Dashboard Feature | 🟢 Completed | 100% | — |
| 5 | Runs Feature | 🟢 Completed | 100% | — |
| 6 | Options Feature | 🟢 Completed | 100% | — |
| 7 | Risk Feature | 🟢 Completed | 100% | — |
| 8 | Financial Feature | 🟢 Completed | 100% | — |
| 9 | Quantum Visualizations | ⚪ Pending | 0% | — |
| 10 | Network Feature | 🟢 Completed | 100% | — |
| 11 | Docs & Settings Features | 🟢 Completed | 100% | — |
| 12 | Performance Audit & Bundle Optimization | ⚪ Pending | 0% | — |
| 13 | E2E Verification | ⚪ Pending | 0% | — |

---

## Milestone 0 — Architecture & Agent Guidance

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-02
### Completed: 2026-05-02

### Tasks

- [x] `architecture.md` — feature-first directory structure documented
- [x] `CLAUDE.md` — agent guidance for Claude written
- [x] `DESIGN.md` — Airtable-inspired design system documented (Haas Grotesk, near-black CTAs, signature cards)
- [x] `AGENTS.md` — agent context and conventions written
- [x] `.cursor/rules/frontend-v3.mdc` — Cursor IDE rule created

### Issues

_None._

### Notes

All planning and architecture documents are in place. The Next.js 16 scaffold (`package.json`, `node_modules`, `.next/`) also exists. Actual feature implementation has not started.

---

## Milestone 1 — Project Scaffolding & Tooling

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-03
### Completed: 2026-05-04

### Tasks

- [ ] Set up `src/constants/routes.ts` — typed app route constants
- [ ] Set up `src/constants/api.ts` — backend API endpoint constants
- [ ] Set up `src/constants/backend.ts` — base URLs and service config
- [ ] Set up `src/constants/query-keys.ts` — TanStack Query key factory
- [ ] Set up `src/constants/auth.ts` — auth-related constants (cookie names, expiry, etc.)
- [ ] Set up `src/constants/config.ts` — environment config with validation
- [ ] Set up `src/constants/ui.ts` — shared UI constants (breakpoints, animation durations, z-index map)
- [ ] Set up `src/providers/QueryProvider.tsx` — TanStack Query client wrapper
- [ ] Set up `src/providers/ThemeProvider.tsx` — theme/dark-mode provider
- [ ] Set up `src/providers/AuthProvider.tsx` — auth session context provider
- [ ] Set up `src/shared/components/ui/` — shadcn/ui base components
- [ ] Set up `src/shared/components/layout/` — layout component stubs
- [ ] Set up `src/shared/hooks/` — shared utility hooks
- [ ] Set up `src/shared/lib/` — shared utility functions
- [ ] Set up `src/shared/types/` — shared TypeScript types
- [ ] Configure TanStack Query client (staleTime, retry, refetchOnWindowFocus)
- [ ] Configure Better Auth server instance + MongoDB adapter
- [ ] Configure React Hook Form globally (no per-component setup needed)
- [ ] Set up `src/middleware.ts` for route protection (protect `/dashboard`, `/runs`, `/options`, `/risk`, `/finance`, `/network`, `/analytics`, `/settings`)
- [ ] Migrate `tailwind.config.ts` with DESIGN.md tokens (colors, fonts, spacing)
- [ ] Migrate `globals.css` with CSS custom properties from DESIGN.md

### Issues

_None yet._

### Notes

- Constants architecture is critical — complete this before any feature work so magic strings never appear in feature code.
- `query-keys.ts` should use the factory pattern: `{ all: () => [...], lists: () => [...], detail: (id) => [...] }`.
- TanStack Query client config: `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false` as defaults.
- Better Auth requires `BETTER_AUTH_SECRET` and `MONGODB_URI` env vars.

---

## Milestone 2 — Auth Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-03
### Completed: 2026-05-05

### Tasks

- [ ] `features/auth/server/auth.ts` — Better Auth server instance with email OTP plugin
- [ ] `features/auth/server/session.ts` — RSC session helper (`getSession()` using `auth.api.getSession`)
- [ ] `features/auth/hooks/use-auth.ts` — client hook wrapping Better Auth `useSession`
- [ ] `features/auth/hooks/use-signin.ts` — mutation hook for sign-in
- [ ] `features/auth/hooks/use-signup.ts` — mutation hook for sign-up
- [ ] `features/auth/components/signin-form.tsx` — React Hook Form + Zod resolver
- [ ] `features/auth/components/signup-form.tsx` — React Hook Form + Zod resolver
- [ ] `features/auth/components/trial-banner.tsx` — trial/free-tier status banner
- [ ] `features/auth/schemas/signin.schema.ts` — Zod schema for sign-in
- [ ] `features/auth/schemas/signup.schema.ts` — Zod schema for sign-up
- [ ] `features/auth/types.ts` — auth-related TypeScript types
- [ ] `app/api/auth/[...all]/route.ts` — Better Auth catch-all handler
- [ ] `app/(auth)/signin/page.tsx` — sign-in page (RSC wrapper)
- [ ] `app/(auth)/signup/page.tsx` — sign-up page (RSC wrapper)
- [ ] `app/(auth)/layout.tsx` — auth layout (centered card)
- [ ] Verify OTP email flow end-to-end (request OTP → receive email → verify → session created)
- [ ] Verify protected route redirect (unauthenticated → redirect to /signin)
- [ ] Verify post-auth redirect (signin → /dashboard)

### Issues

_None yet._

### Notes

- Better Auth's email OTP plugin sends a 6-digit code. The custom email sender must be configured via `sendVerificationOTP` in the auth config.
- The v2 implementation used Resend for email. Check if the same Resend API key is available.
- Session strategy: Better Auth uses DB sessions (stored in MongoDB). No JWT management needed on the app side.
- The `(auth)` route group should NOT be wrapped by the main app sidebar layout.

---

## Milestone 3 — Shared Layout & Navigation

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-03
### Completed: 2026-05-05

### Design Spec: See `frontend-v3/SPEC.md` for full UI & navigation architecture.

### Tasks

#### Constants & Config
- [ ] `constants/navigation.ts` — typed `NAV_CONFIG` with 5 rail items (Dashboard, Network, Lab, Docs, Settings)
- [ ] `constants/breadcrumbs.ts` — `BREADCRUMB_LABELS` map for auto-breadcrumb resolution

#### Shell Components
- [ ] `shared/components/layout/dashboard-shell.tsx` — main shell reads `NAV_CONFIG`, renders rail + sidebar + content
- [ ] `shared/components/layout/icon-rail.tsx` — 5-icon vertical rail (68px wide)
- [ ] `shared/components/layout/rail-item.tsx` — single rail icon + label with active state
- [ ] `shared/components/layout/workspace-switcher.tsx` — static "QG" monogram (future: dropdown)
- [ ] `shared/components/layout/sidebar-panel.tsx` — conditional sidebar renderer (static vs dynamic)

#### Static Sidebar Components
- [ ] `shared/components/layout/static-sidebar.tsx` — renders `NavGroupConfig[]` (for Network, Docs, Settings)
- [ ] `shared/components/layout/sidebar-group.tsx` — group heading + list of links
- [ ] `shared/components/layout/sidebar-link.tsx` — single nav link with active state indicator

#### Dynamic Sidebar Components (Lab)
- [ ] `shared/components/layout/dynamic-sidebar.tsx` — renders `NavToolConfig[]` with history items
- [ ] `shared/components/layout/lab-tool-group.tsx` — collapsible group: header + [+ New] + history items + "View all"
- [ ] `shared/components/layout/lab-history-item.tsx` — single history entry (status badge + label + time)

#### Header & Breadcrumbs
- [ ] `shared/components/layout/site-header.tsx` — top header bar container
- [ ] `shared/components/layout/auto-breadcrumbs.tsx` — config-driven breadcrumbs (reads URL + NAV_CONFIG + BREADCRUMB_LABELS)

#### User Navigation
- [ ] `shared/components/layout/nav-user.tsx` — user avatar + plan badge + dropdown (trial status from auth context)

#### Root Layouts
- [ ] `app/layout.tsx` — root layout with providers: `ThemeProvider` > `AuthProvider` > `QueryProvider`
- [ ] `app/(main)/layout.tsx` — main authenticated layout wrapping `DashboardShell`

### Issues

_None yet._

### Notes

- **Design spec:** Full architecture documented in `frontend-v3/SPEC.md` and on Notion.
- The sidebar uses shadcn `Sidebar` primitives (Collapsible, SidebarGroup, SidebarMenuItem, etc.).
- Dashboard rail item has `hasSidebar: false` — sidebar collapses, main content gets full width.
- Lab sidebar fetches recent jobs via 4 parallel TanStack Query hooks (one per tool).
- `nav-user.tsx` must display trial status from auth context.
- `app/layout.tsx` provider order matters: `ThemeProvider` > `AuthProvider` > `QueryProvider`.
- **No Analytics rail icon** — analytics content is placed contextually (Bloch sphere in run detail, fidelity in network, etc.).

---

## Milestone 4 — Dashboard Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-04
### Completed: 2026-05-05

### Design Spec: See `SPEC.md` §7.1 for block map.

### Tasks

- [ ] `features/dashboard/types.ts` — dashboard data types
- [ ] `features/dashboard/server/dashboard-service.ts` — RSC data fetcher using `React.cache()`
- [ ] `features/dashboard/lib/dashboard-transformers.ts` — data transformation utilities (ported from v2)
- [ ] `features/dashboard/hooks/use-dashboard-data.ts` — TanStack Query hook for dashboard stats
- [ ] `features/dashboard/hooks/use-activity-feed.ts` — TanStack Query hook for recent activity (limit 5)
- [ ] `features/dashboard/components/dashboard-kpi-cards.tsx` — 4 KPI summary cards (Nodes, Services, Fidelity, Qubits)
- [ ] `features/dashboard/components/dashboard-health-status.tsx` — 2 mini-cards (health badge + environment info)
- [ ] `features/dashboard/components/dashboard-activity-feed.tsx` — recent 5 jobs across all Lab tools
- [ ] `features/dashboard/components/dashboard-quick-actions.tsx` — static action buttons linking to Lab tools
- [ ] `app/(main)/dashboard/page.tsx` — RSC page, full-width (no sidebar), server-side KPI data

### Issues

_None yet._

### Notes

- **Full-width layout** — Dashboard has `hasSidebar: false` in NAV_CONFIG, so no sidebar.
- `dashboard-transformers.ts` exists in v2 at `src/lib/dashboard-transformers.ts` — port it directly, do not rewrite.
- Dashboard page should use RSC for KPI cards (no loading spinner on first paint).
- Activity feed is client-side (TanStack Query) — shows shimmer skeleton while loading.
- **NOT on Dashboard:** 3D network graph (→ Network > Topology), area charts (→ Network > Fidelity), service table (→ Network > Services), Bloch spheres (→ Run detail).

---

## Milestone 5 — Runs Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-05
### Completed: 2026-05-05

### Tasks

- [ ] `features/runs/types.ts` — Run, RunStatus, Fragment, FragmentDAG types
- [ ] `features/runs/lib/fragment-dag-model.ts` — DAG data model utilities
- [ ] `features/runs/lib/fragment-flow-format.ts` — ReactFlow node/edge format converters
- [ ] `features/runs/lib/peer-flow-model.ts` — peer network flow model
- [ ] `features/runs/lib/run-status.ts` — status enum and helpers
- [ ] `features/runs/lib/run-transformers.ts` — API response → UI model transformers
- [ ] `features/runs/hooks/use-runs-list.ts` — TanStack Query list hook
- [ ] `features/runs/hooks/use-run-detail.ts` — TanStack Query detail hook with polling on active status
- [ ] `features/runs/hooks/use-create-run.ts` — TanStack Query mutation hook
- [ ] `features/runs/hooks/use-quantum-run-detail.ts` — full quantum detail with circuit data
- [ ] `features/runs/server/runs-service.ts` — RSC data fetchers
- [ ] `features/runs/components/runs-table.tsx` — sortable/filterable runs list
- [ ] `features/runs/components/run-status-badge.tsx` — status pill component
- [ ] `features/runs/components/run-detail-header.tsx` — run detail page header
- [ ] `features/runs/components/run-metrics-panel.tsx` — quantum metrics display
- [ ] `features/runs/components/run-create-form.tsx` — RHF + Zod run creation form
- [ ] `features/runs/components/fragment-flow-canvas.tsx` — ReactFlow visualization (**dynamic import, ssr: false**)
- [ ] `features/runs/components/quantum-circuit-viewer.tsx` — circuit display component
- [ ] `app/(main)/runs/page.tsx` — runs list page
- [ ] `app/(main)/runs/new/page.tsx` — create new run page
- [ ] `app/(main)/runs/[runId]/page.tsx` — run detail page
- [ ] `app/(main)/runs/[runId]/fragment-flow/page.tsx` — fragment flow visualization page

### Issues

_None yet._

### Notes

- `fragment-flow-canvas.tsx` uses ReactFlow which is browser-only and heavy — MUST be dynamically imported.
- Polling interval for active runs: 3000ms. Stop polling when status is `completed` or `failed`.
- Run creation form needs circuit configuration fields — reference v2 for the full field set.

---

## Milestone 6 — Options Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-05
### Completed: 2026-05-05

### Tasks

- [ ] `features/options/types.ts` — OptionsJob, OptionsRequest, OptionsResult types
- [ ] `features/options/schemas/options-request.schema.ts` — Zod schema
- [ ] `features/options/hooks/use-options-job.ts` — TanStack Query with polling on pending status
- [ ] `features/options/hooks/use-options-batch.ts` — mutation for batch CSV upload
- [ ] `features/options/server/options-service.ts` — RSC data fetchers
- [ ] `features/options/components/options-pricing-form.tsx` — RHF + Zod
- [ ] `features/options/components/options-result-card.tsx` — pricing result display
- [ ] `features/options/components/options-result-dashboard.tsx` — full results view
- [ ] `features/options/components/options-hero.tsx` — page hero section
- [ ] `features/options/components/batch/batch-upload-panel.tsx` — CSV drag-and-drop
- [ ] `features/options/components/batch/batch-results-dashboard.tsx` — batch results table/chart
- [ ] `features/options/components/batch/batch-benchmark-client.tsx` — benchmark comparison
- [ ] `app/(main)/options/page.tsx` — single options pricing page
- [ ] `app/(main)/options/batch/page.tsx` — batch pricing page
- [ ] `app/api/options/route.ts` — proxy to backend `/api/options`
- [ ] `app/api/options/batch/route.ts` — proxy for batch upload

### Issues

_None yet._

### Notes

- Polling interval for options job: 2000ms. Stop when status is `completed` or `failed`.
- Batch upload accepts CSV with columns: `S, K, T, r, sigma, option_type`. Validate on the client before upload.
- Reference v2 `batch-upload-panel.tsx`, `batch-results-dashboard.tsx`, `batch-benchmark-client.tsx` for UI patterns.

---

## Milestone 7 — Risk Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-05
### Completed: 2026-05-05

### Tasks

- [ ] `features/risk/types.ts` — RiskJob, RiskRequest, RiskResult, PortfolioItem types
- [ ] `features/risk/schemas/risk-request.schema.ts` — Zod schema for form validation
- [ ] `features/risk/hooks/use-risk-job.ts` — TanStack Query with polling
- [ ] `features/risk/hooks/use-risk-upload.ts` — mutation for CSV portfolio upload
- [ ] `features/risk/server/risk-service.ts` — RSC data fetchers
- [ ] `features/risk/components/risk-upload-panel.tsx` — portfolio CSV upload
- [ ] `features/risk/components/risk-hero.tsx` — page hero
- [ ] `features/risk/components/risk-job-card.tsx` — job status card
- [ ] `features/risk/components/risk-job-progress.tsx` — progress bar/stepper
- [ ] `features/risk/components/risk-result-dashboard.tsx` — VaR / CVaR / risk metrics display
- [ ] `features/risk/components/risk-analytics-client.tsx` — interactive analytics panel
- [ ] `app/(main)/risk/page.tsx` — risk analysis page
- [ ] `app/api/risk/route.ts` — proxy to backend `/api/risk`
- [ ] `app/api/risk/[jobId]/route.ts` — job status proxy

### Issues

_None yet._

### Notes

- Risk engine runs async jobs. Poll `/api/risk/{jobId}` every 2000ms until `status === "completed"`.
- Reference v2 `risk-engine.py` for the backend API contract.
- CSV format: one row per asset with columns `ticker, weight, value`. Validate before upload.

---

## Milestone 8 — Financial Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-05
### Completed: 2026-05-05

### Tasks

- [ ] `features/financial/types.ts` — Portfolio, FactorReturn, Allocation, HistoricalReturn types
- [ ] `features/financial/schemas/` — Zod schemas for all financial form inputs
- [ ] `features/financial/hooks/use-portfolio-comparison.ts` — TanStack Query with polling
- [ ] `features/financial/hooks/use-factor-analysis.ts` — TanStack Query hook
- [ ] `features/financial/hooks/use-portfolio-upload.ts` — CSV upload mutation
- [ ] `features/financial/server/financial-service.ts` — RSC data fetchers with `React.cache()`
- [ ] `features/financial/lib/financial-transformers.ts` — API → chart-ready data transformers
- [ ] `features/financial/components/portfolio-upload-panel.tsx`
- [ ] `features/financial/components/portfolio-comparison-chart.tsx` — dynamic import
- [ ] `features/financial/components/factor-attribution-table.tsx`
- [ ] `features/financial/components/allocation-pie-chart.tsx` — dynamic import
- [ ] `features/financial/components/historical-returns-chart.tsx` — dynamic import
- [ ] `app/(main)/finance/page.tsx` — financial overview
- [ ] `app/(main)/finance/portfolio/page.tsx` — portfolio analysis
- [ ] `app/(main)/finance/comparison/page.tsx` — portfolio comparison
- [ ] `app/(main)/finance/factors/page.tsx` — factor model analysis
- [ ] `app/(main)/finance/allocation/page.tsx` — asset allocation
- [ ] `app/api/finance/route.ts` and sub-routes

### Issues

_None yet._

### Notes

- Dataset files are in `dataset/massive/` and `dataset/damodaran/` — financial feature may reference these.
- Chart components (recharts/Victory) are browser-only — all must use `next/dynamic`.
- Factor analysis uses the Fama-French 3-factor model (dataset in `dataset/massive/F-F_Research_Data_Factors_daily.csv`).

---

## Milestone 9 — Quantum Visualizations

### Status: ⚪ Pending
### Owner: —
### Started: —
### Completed: —

### Tasks

- [ ] `features/quantum/types.ts` — Gate, QubitState, CircuitLayer, BlochVector types
- [ ] `features/quantum/lib/circuit-composer.ts` — circuit composition logic
- [ ] `features/quantum/lib/visual-circuit.ts` — visual layout utilities for circuit display
- [ ] `features/quantum/hooks/use-circuit-composer.ts` — stateful circuit builder hook
- [ ] `features/quantum/components/bloch-sphere.tsx` — Three.js Bloch sphere (**dynamic import, ssr: false**)
- [ ] `features/quantum/components/visual-circuit-builder.tsx` — drag-and-drop circuit builder (**dynamic import, ssr: false**)
- [ ] `features/quantum/components/gate-palette.tsx` — quantum gate selector
- [ ] `features/quantum/components/circuit-output-panel.tsx` — measurement results

### Issues

_None yet._

### Notes

- Bloch sphere uses Three.js — absolutely cannot SSR. Wrap in `next/dynamic({ ssr: false })` with a skeleton fallback.
- Visual circuit builder is the most complex component in the app. Budget significant time.
- Gate set: H, X, Y, Z, CNOT, T, S, RX, RY, RZ, Toffoli.

---

## Milestone 10 — Network Feature

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-05
### Completed: 2026-05-05

### Design Spec: See `SPEC.md` §7.4 for block map.

### Tasks

#### Network Feature
- [ ] `features/network/types.ts` — Node, Peer, Circuit, Zone, Mesh types
- [ ] `features/network/server/network-service.ts`
- [ ] `features/network/hooks/use-network-topology.ts`
- [ ] `features/network/hooks/use-network-nodes.ts`
- [ ] `features/network/hooks/use-network-fidelity.ts`
- [ ] `features/network/components/network-3d-graph.tsx` — force-directed 3D graph (**dynamic import, ssr: false**)
- [ ] `features/network/components/node-table.tsx` — full data table with search/filter/sort
- [ ] `features/network/components/service-table.tsx` — service registry table
- [ ] `features/network/components/fidelity-chart.tsx` — interactive area chart (**dynamic import**)
- [ ] `features/network/components/dag-viewer.tsx` — DAG visualization
- [ ] `features/network/components/circuit-path-viewer.tsx` — circuit path viewer
- [ ] `features/network/components/zone-map.tsx` — zone map
- [ ] `app/(main)/network/mesh/page.tsx`
- [ ] `app/(main)/network/nodes/page.tsx`
- [ ] `app/(main)/network/services/page.tsx`
- [ ] `app/(main)/network/fidelity/page.tsx`
- [ ] `app/(main)/network/circuits/page.tsx`
- [ ] `app/(main)/network/dag/page.tsx`
- [ ] `app/(main)/network/zones/page.tsx`

### Issues

_None yet._

### Notes

- **No standalone Analytics section** — analytics content is placed contextually:
  - Bloch Spheres → Run detail page (Quantum State tab, M5/M9)
  - Fidelity trends → Network > Fidelity page (this milestone)
  - Financial analytics → Financial job result pages (M8)
  - Run-specific analytics → Run detail page (Overview tab, M5)
- 3D network graph likely uses `three-forcegraph` or `react-force-graph-3d` — confirm package before implementing.
- Each network page has ONE block. No overlap with other pages.

---

## Milestone 11 — Docs & Settings Features

### Status: 🟢 Completed
### Owner: —
### Started: 2026-05-05
### Completed: 2026-05-05

### Tasks

#### Settings Feature
- [ ] `features/settings/types.ts`
- [ ] `features/settings/hooks/use-settings.ts`
- [ ] `features/settings/components/profile-form.tsx` — RHF + Zod
- [ ] `features/settings/components/api-keys-panel.tsx`
- [ ] `features/settings/components/notifications-form.tsx`
- [ ] `app/(main)/settings/profile/page.tsx`
- [ ] `app/(main)/settings/api-keys/page.tsx`
- [ ] `app/(main)/settings/notifications/page.tsx`
- [ ] `app/(main)/settings/billing/page.tsx`
- [ ] `app/(main)/settings/team/page.tsx`
- [ ] `app/(main)/settings/security/page.tsx`

#### Docs Pages
- [ ] `app/(main)/docs/getting-started/page.tsx`
- [ ] `app/(main)/docs/api/page.tsx`
- [ ] `app/(main)/docs/quantum-gates/page.tsx`
- [ ] `app/(main)/docs/circuits/page.tsx`
- [ ] `app/(main)/docs/options-pricing/page.tsx`
- [ ] `app/(main)/docs/risk-engine/page.tsx`

### Issues

_None yet._

### Notes

- Docs pages are likely static MDX or plain TSX — no server data needed.
- Settings pages require auth; server-side session check before rendering.
- API keys panel needs careful security treatment — never log or expose full keys.

---

## Milestone 12 — Performance Audit & Bundle Optimization

### Status: ⚪ Pending
### Owner: —
### Started: —
### Completed: —

### Tasks

- [ ] Add `@next/bundle-analyzer` and run initial audit (`ANALYZE=true bun run build`)
- [ ] Document initial bundle sizes as baseline
- [ ] Confirm all heavy components use `next/dynamic` with `ssr: false`:
  - [ ] `fragment-flow-canvas.tsx` (ReactFlow)
  - [ ] `bloch-sphere.tsx` (Three.js)
  - [ ] `visual-circuit-builder.tsx` (Three.js / Canvas)
  - [ ] `network-3d-graph.tsx` (three-forcegraph)
  - [ ] All recharts/Victory chart components
- [ ] Audit all imports — no barrel imports from `shared/components/ui/` (must import directly, e.g. `shared/components/ui/button`)
- [ ] Add `React.cache()` wrappers to all RSC data fetchers in `*/server/*-service.ts`
- [ ] Audit and set `export const runtime = "edge"` on qualifying stateless API proxy routes
- [ ] Verify `next.config.ts` has `experimental.optimizePackageImports` set correctly
- [ ] Run Lighthouse on `/dashboard`, `/runs`, `/options`, `/risk` pages
- [ ] Document Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- [ ] Address any Lighthouse score below 80

### Issues

_None yet._

### Notes

- Run bundle analyzer after Milestone 5 (Runs) is complete, since ReactFlow is the heaviest dependency.
- Edge runtime is NOT compatible with MongoDB or server-side auth — only use for pure proxy/transform routes.
- `React.cache()` deduplicates fetch calls within a single RSC render tree; critical for routes that fetch user data in multiple server components.

---

## Milestone 13 — E2E Verification

### Status: ⚪ Pending
### Owner: —
### Started: —
### Completed: —

### Tasks

#### Auth Flow
- [ ] Sign up with new email → receive OTP → verify → land on `/dashboard`
- [ ] Sign in with existing credentials → land on `/dashboard`
- [ ] Sign out → redirected to `/signin`
- [ ] Unauthenticated access to `/dashboard` → redirected to `/signin`
- [ ] Expired session → middleware redirects to `/signin`

#### Options Pricing Flow
- [ ] Submit single options pricing request with valid inputs
- [ ] Poll job status — verify loading state shows
- [ ] Job completes → result card displays correct price
- [ ] Submit with invalid inputs → form shows Zod validation errors
- [ ] Upload valid CSV batch file → results dashboard populates

#### Risk Analysis Flow
- [ ] Upload valid portfolio CSV → job starts
- [ ] Poll job status → progress indicator updates
- [ ] Job completes → VaR / CVaR / risk metrics display correctly
- [ ] Upload malformed CSV → error state shown

#### Runs Flow
- [ ] Create new run with valid circuit configuration
- [ ] Run list shows new run with correct status
- [ ] Navigate to run detail → metrics panel loads
- [ ] Fragment flow page loads ReactFlow canvas without error

#### Dashboard
- [ ] `/dashboard` loads without console errors
- [ ] KPI cards show data (not blank)
- [ ] Network stats panel renders
- [ ] No layout shift after hydration

### Issues

_None yet._

### Notes

- E2E tests can be written using Playwright (already scaffolded in the repo).
- Run E2E suite against the local dev server (`bun run dev`) with the real backend-v2 running.
- All flows must pass before any milestone is considered production-ready.

---

## Known Issues Log

| ID | Milestone | Description | Severity | Status | Fix Applied | Pending Action |
|----|-----------|-------------|----------|--------|-------------|----------------|
| — | — | No issues logged yet | — | — | — | — |

---

## Decisions & Changes Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-05-02 | Feature-first directory structure over layer-first (`features/<name>/` vertical slices) | Co-location of related code improves discoverability; scales better than `components/`, `hooks/`, `services/` at the top level | All new code goes under `src/features/<name>/`; shared code under `src/shared/` |
| 2026-05-02 | TanStack Query v5 replacing raw `fetch` in `useEffect` | Built-in caching, request deduplication, background refetch, polling support, and DevTools integration eliminate ~80% of manual async state code | All client-side data fetching uses `useQuery` / `useMutation`; no raw `useEffect` fetches |
| 2026-05-02 | Better Auth replacing custom JWT + OTP implementation | Battle-tested library; official MongoDB adapter; built-in email OTP plugin; session management out of the box; eliminates custom crypto code | `app/api/auth/[...all]/route.ts` catch-all replaces 4 separate auth API routes from v2 |
| 2026-05-02 | React Hook Form v7 + Zod resolvers replacing manual `useState` form state | Uncontrolled inputs = better performance (no re-render on every keystroke); Zod resolvers co-locate schema with component; consistent validation DX | All forms use `useForm({ resolver: zodResolver(schema) })`; no manual `useState` for form fields |
| 2026-05-02 | All constants in `src/constants/` (routes, api, backend, query-keys, auth, config, ui) | No magic strings anywhere in feature code; compiler-safe refactors; single source of truth for URLs, keys, and config | Every route, API endpoint, and query key must be imported from `src/constants/` — never hardcoded |
| 2026-05-02 | Heavy visualization components use `next/dynamic` with `ssr: false` | Three.js, ReactFlow, and 3D graph libs are browser-only and large; SSR would crash and bloat the initial bundle | `bloch-sphere.tsx`, `fragment-flow-canvas.tsx`, `visual-circuit-builder.tsx`, `network-3d-graph.tsx` all dynamically imported |
| 2026-05-02 | Bun as package manager (not npm or pnpm) | Speed; already used in frontend-v2; consistent developer environment | Use `bun install`, `bun run dev`, `bun run build` — never `npm` or `npx` in this project |
| 2026-05-03 | 5-icon rail navigation (Dashboard, Network, Lab, Docs, Settings) — no standalone Analytics | v2 analytics pages were empty placeholders; analytics content placed contextually (Bloch sphere in run detail, fidelity in network, financial analytics in finance results) | Removes 7+ empty analytics routes; every block exists in exactly one place |
| 2026-05-03 | Lab sidebar uses ChatGPT-style dynamic history pattern | Researchers need quick access to recent jobs; mirrors mental model of "sessions" like ChatGPT threads; prepares for Workspace 2 (Autonomous Labs) agent conversations | Lab sidebar fetches last 5 jobs per tool via TanStack Query; collapsible groups with [+ New] buttons |
| 2026-05-03 | Config-driven navigation via `NAV_CONFIG` in `constants/navigation.ts` | v2's monolithic 860-line `dashboard-shell.tsx` required editing 5+ places to add a page; config-driven approach requires only 2 files | Adding a page: edit `navigation.ts` + create route file. Shell and breadcrumbs auto-update |
| 2026-05-03 | Dashboard has no sidebar (full-width layout) | Dashboard is a single page answering "is everything healthy?"; sub-navigation adds no value; full width gives KPI cards room to breathe | Dashboard rail item has `hasSidebar: false`; sidebar collapses when dashboard is active |
| 2026-05-03 | Workspace switcher slot built into rail from day one | H2 vision adds "Autonomous Labs" workspace (ChatGPT-like agent interface); retrofitting a workspace switcher would require shell rewrite | `WorkspaceSwitcher` component exists at top of rail; currently static; future: dropdown to switch workspaces |
| 2026-05-03 | Run detail page uses tabs (Overview, Quantum State, Fragment Flow) instead of separate routes | Keeps all run context in one place; eliminates 2 extra route entries; Bloch sphere and Fragment Flow are per-run analytics, not standalone pages | Tabs use `?tab=` query param; Fragment Flow and Quantum State are `next/dynamic` loaded on tab switch |

---

## Pending Questions

1. **Email provider for OTP** — Is the Resend API key from v2 available for v3? Or do we need a new key? Required before Milestone 2 (Auth) can be verified end-to-end.

2. **MongoDB connection** — Is the same MongoDB Atlas cluster used for v2 also the target for v3? Or a new database/collection namespace? Required before Milestone 2.

3. **Backend-v2 base URL** — What is the `BACKEND_URL` for local dev and production? (Used in `src/constants/backend.ts`.) Required before Milestone 1.

4. **Better Auth secret** — `BETTER_AUTH_SECRET` needs to be a strong random string. Generate one and store in `.env.local`. Required before Milestone 2.

5. **3D network graph library** — Confirm whether to use `react-force-graph-3d`, `three-forcegraph`, or a custom Three.js implementation for the network topology visualization. Required before Milestone 10.

6. **Edge runtime scope** — Which API routes are safe for edge runtime? Options and risk job submission routes call MongoDB — they CANNOT use edge. Need explicit list before Milestone 12.

7. **Lighthouse score targets** — What are the minimum acceptable Lighthouse scores before shipping? (Suggested: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 80.) Confirm before Milestone 12.

8. **Trial/free-tier logic** — What are the limits for the free tier shown in `trial-banner.tsx`? (e.g., max N runs, max N options jobs per day?) Required before Milestone 2 (trial-banner.tsx) and Milestone 6.

---

_Last updated: 2026-05-05_

<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order
1. `search_graph` — find functions, classes, routes, variables by pattern
2. `trace_path` — trace who calls a function or what it calls
3. `get_code_snippet` — read specific function/class source code
4. `query_graph` — run Cypher queries for complex patterns
5. `get_architecture` — high-level project summary

## When to fall back to grep/glob
- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples
- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->

## Learned User Preferences

- UI cards should be neutral glass (no per-card color fills); ambient glow gradients go behind sections in the page background
- Hover states on clickable cards should show a gradient wash matching the card's icon color
- Background glow positions should match the horizontal position of the cards they sit behind
- Follow `frontend/DESIGN.md` strictly for colors, variables, and component styling
- User prefers animated lucide icons throughout the UI
- Disable trial/auth gating during development via `NEXT_PUBLIC_TRIAL_DISABLED=true` env var
- Remove non-interactive or data-less cards; consolidate small status indicators to top-right area
- Detail/result pages must be full-width — never apply `max-w-*` constraints to detail page content containers
- History table rows (Options/Risk/Finance) must be clickable via `router.push` with hover gradient matching the page accent color — no separate "View" column

## Learned Workspace Facts

- frontend uses barrel imports from feature folders (`@/features/network`, `@/features/runs`)
- Backend API returns snake_case; frontend transformers in `features/*/lib/*-transformers.ts` convert to camelCase
- Backend folder is `backend/` (renamed from `backend-v2/`); Python package name `quantum_backend_v2` (underscores) is intentionally kept as-is — do NOT rename it
- Backend `ServiceQualityTracker` in `api/routers/service_quality.py` provides gate_set/connectivity/fidelity from Qiskit transpilation; backend is FastAPI on port 8081, frontend is Next.js 16 on port 3000
- Proxy middleware is in `frontend/src/proxy.ts` (not `src/middleware.ts`)
- After renaming a Next.js project directory, run `rm -rf frontend/.next` — Turbopack bakes absolute paths into the build cache; stale cache causes "Next.js package not found" panics on every HMR update
- Sidebar status color lookups must call `.toLowerCase()` on the status before map lookup — backend sends uppercase statuses (QUEUED, COMPILING, EXECUTING, COMPLETED, FAILED); `STATUS_COLORS` maps use lowercase keys
- Circuit submission uses `BACKEND.CIRCUITS.SUBMIT` (`POST /api/v1/circuits/submit` accepts `{circuit: "..."}`); job detail uses `BACKEND.JOBS.DETAIL` (`GET /api/v1/jobs/{id}`) — do NOT use `BACKEND.WORKFLOWS.RUNS` for these
- The shadcn `SidebarProvider` wrapper has `w-full min-h-svh` which breaks flex layouts when used as a child — must override with `!w-auto !min-h-0 flex-none`; `DashboardShell` main content wrapper keeps `ml-1.5` left gap but is flush on all other edges (no `my-*`/`mr-*`/`rounded-*`)
- Shared detail-page components live at `src/shared/components/detail/` — `GlassCard`, `SectionTitle`, `JobMetaStrip`, `MetricGrid`, `DataTable`, `FieldList`, `ResultValue`; use these across Options, Risk, and Finance detail pages for consistent UI
- VAULT is a planned IPFS feature (top-level nav rail): Phase 1 = Circuit Library (`/vault/circuits`) + Workflow Cloning (`/vault/runs`) via Helia P2P; Pinata pinning is NOT in Phase 1; Provenance/Verification deferred to Phase 2
- `PageHeader` is the standard shared page header at `src/shared/components/layout/page-header.tsx`; `DataTable` `getRowKey` must append row index for uniqueness; job IDs must not be truncated in `AutoBreadcrumbs` `formatSegment`

# CONTEXT

Root-level context pack for AI agents (Claude Code, Cursor, Codex, etc.) working in this repository.

Read this file first in every new session. It answers:

- what this platform is
- what exists today (not aspirational docs)
- how the code is organized across backend, frontend-v2, and legacy directories
- where the important code lives, with exact file paths
- what caveats matter before changing anything

Last verified against codebase state: April 2026.

---

## Thesis

A research-oriented platform that treats quantum-style operations as discoverable network services, orchestrates them through a Python FastAPI coordinator over real `py-libp2p`, exposes them through a Next.js operator console, persists state to Postgres + MongoDB, and augments completed runs with Qiskit-based quantum analysis.

A secondary financial-analysis workflow uses QAOA-based portfolio optimization through the same infrastructure.

## What This Platform Is Not

The docs mix current POC scope with long-term ambition. The codebase today is **not**:

- a real quantum hardware control stack (uses Qiskit statevector simulation)
- a production multi-tenant platform (auth is dev-mode stubs)
- a multi-coordinator consensus system
- a finished bring-your-own-node marketplace
- a complete experiment/baseline-comparison harness

Treat it as a serious proof-of-concept orchestration platform with a growing operator console.

---

## Active Directories (where you should work)

| Directory | Role | Tech |
|---|---|---|
| `backend/` | **Primary backend** | Python 3.11, FastAPI, py-libp2p (Trio), Qiskit, SQLAlchemy (Postgres), Beanie (MongoDB) |
| `frontend-v2/` | **Primary frontend** | Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Zustand, ReactFlow, Recharts |
| `docs/` | Documentation corpus | Markdown |

## Legacy Directories (reference only, do not extend)

| Directory | Role | Notes |
|---|---|---|
| `backend/` | Old backend | SQLite-only, simpler libp2p, `quantum_coordinator` package. Kept for reference. |
| `frontend/` | Old frontend | Vite SPA, single ~3900-line `App.tsx`. Replaced by `frontend-v2/`. |

## Other Root Files

| File | Purpose |
|---|---|
| `docker-compose.yaml` | Runs `backend` + `frontend-v2` + Caddy. Uses Neon Postgres and Atlas MongoDB by default. |
| `MANUAL.md` | EC2 + Docker + Caddy deployment runbook |
| `.env.example` | Template for Docker/deployment env vars |
| `deploy/Caddyfile` | Reverse proxy config |

---

## Backend-v2 Architecture

Package: `src/quantum_backend_v2/`

### Entrypoints

- CLI: `quantum_backend_v2.main:main` (registered as `quantum-backend` console script)
- Bootstrap: `bootstrap/application.py` → `create_application()` builds the FastAPI app
- Lifespan: `api/app.py` handles startup (init persistence, start discovery, run recovery) and shutdown

### Layer Map

| Layer | Path | Responsibility |
|---|---|---|
| **API** | `api/routers/`, `api/models/`, `api/deps/`, `api/errors/` | FastAPI routers, request/response models, auth deps, error contracts |
| **Application** | `application/` | Business logic: `CircuitJobService`, `FinancialJobService`, `EnrollmentService`, distributed statevector execution |
| **Identity** | `identity/` | User roles (ADMIN/OPERATOR/DEVELOPER/VIEWER), trust tiers, token claims, API keys |
| **Persistence** | `persistence/postgres.py` | SQLAlchemy ORM: users, enrollments, workflow runs, execution plans, financial jobs, reservation events (append-only), execution events (append-only) |
| **Persistence** | `persistence/mongodb.py` | Beanie documents: peer capabilities, topology projections, benchmark results, provenance bundles |
| **Persistence** | `persistence/local_log.py` | JSONL append-only peer log (fsync) |
| **Libp2p** | `libp2p/` | Real py-libp2p host (Ed25519), GossipSub pubsub, stream RPC, Trio thread bridged to asyncio, embedded dev worker swarm |
| **Discovery** | `discovery/` | `DiscoveryService` + `PeerRegistry`: drain pubsub events → upsert MongoDB projections, stale-peer TTL, enrollment visibility |
| **Protocols** | `protocols/` | Wire schemas: execution, reservation, quality, peersync |
| **Reservations** | `reservations/` | Event-sourced state machine: REQUESTED → ACCEPTED → COMMITTED → CANCELLED/EXPIRED/REJECTED |
| **Runtime** | `runtime/` | Execution state machine, crash recovery on startup |
| **Quality** | `quality/` | Service quality catalog: transpiles each service circuit against Qiskit BasicSimulator for fidelity |
| **Workflows** | `workflows/` | Benchmark models and service |
| **Packages** | `packages/` | Package signing and replication |
| **Planning** | `planning/` | DAG planning models |
| **Provenance** | `provenance/` | Provenance bundle models |

### Configuration

All config flows through `QB2_*` environment variables → `AppSettings.from_env()` Pydantic model.

Critical env vars:

| Variable | Purpose |
|---|---|
| `QB2_ENVIRONMENT` | development / staging / production / test |
| `QB2_API_HOST` / `QB2_API_PORT` | Bind address (default 0.0.0.0:8081) |
| `QB2_AUTH_REQUIRED` | Auth toggle (false for local dev) |
| `QB2_POSTGRES_TARGET` | `local` or `neon` |
| `QB2_POSTGRES_LOCAL_DSN` / `QB2_POSTGRES_NEON_*_DSN` | Postgres connection strings |
| `QB2_MONGODB_TARGET` | `local` or `remote` |
| `QB2_MONGODB_*_URI` | MongoDB connection strings |
| `QB2_LIBP2P_ENABLED` | Enable/disable real libp2p |
| `QB2_LIBP2P_DEV_SERVICE_PEER_COUNT` | Embedded worker peers (default 4) |

### API Endpoints (28+)

**System**: `GET /`, `GET /api/v1/health`, `GET /api/v1/ready`

**Bootstrap**: `GET /api/v1/bootstrap/libp2p`, `GET /api/v1/bootstrap/libp2p/runtime`

**Discovery**: `GET /api/v1/discovery/peers`, `GET /api/v1/discovery/peers/{peer_id}`, `GET /api/v1/discovery/topology`, `GET /api/v1/discovery/network/topology`

**Enrollment**: `POST /api/v1/enrollment/peers`, `GET /api/v1/enrollment/peers`, `GET /api/v1/enrollment/peers/{peer_id}`, `POST /api/v1/enrollment/peers/{peer_id}/action`

**Circuits**: `POST /api/v1/circuits/submit`

**Jobs**: `GET /api/v1/jobs`, `GET /api/v1/jobs/{job_id}`

**Plans**: `GET /api/v1/plans/{plan_id}`

**Services**: `GET /api/v1/services`

**Metrics**: `GET /api/v1/metrics/fidelity/{node_id}`

**Finance**: `POST /api/v1/finance/submit`, `GET /api/v1/finance/{job_id}`, `GET /api/v1/finance/{job_id}/comparison`, `GET /api/v1/finance`

**Workflows**: `POST /api/v1/workflows/runs`, `GET /api/v1/workflows/runs/{run_id}`, `POST /api/v1/workflows/benchmarks`, `GET /api/v1/workflows/benchmarks/{benchmark_id}`

**Reservations**: `POST /api/v1/reservations`, `GET /api/v1/reservations/{reservation_id}`, `POST /api/v1/reservations/{reservation_id}/cancel`

### Auth Model (dev-mode)

- `QB2_AUTH_REQUIRED=false` → all requests become a local dev-admin with ADMIN + DEVELOPER roles
- `QB2_ALLOW_DEV_BEARER_TOKENS=true` → accepts `Bearer dev-<user_id>` tokens
- Production JWT surface exists as a stub

### Quantum Execution Flow

1. Client submits OpenQASM to `POST /api/v1/circuits/submit`
2. `CircuitJobService` creates a `WorkflowRunRecord` (QUEUED)
3. Background: waits for service peers → compiles execution plan → distributes fragments via libp2p RPC → streams results → assembles final quantum state
4. Status: QUEUED → COMPILING → EXECUTING → COMPLETED / FAILED
5. Qiskit builds the quantum result: counts, probabilities, statevector, Bloch vectors, entanglement entropy, density matrices, fidelity, observable expectations

### Quantum Gate/Service Types (11)

`hadamard`, `cnot`, `cz`, `controlled_unitary`, `programmable_gate`, `qft`, `teleportation`, `bell_pair`, `syndrome_extraction`, `distillation`, `measurement_feedforward`

Aliases: `h` → hadamard, `cx`/`cnot` → cnot, `bell` → bell_pair, `teleport` → teleportation, `measure` → measurement_feedforward, unknown → programmable_gate

### Libp2p Runtime

- Coordinator runs a real py-libp2p host with Ed25519 keypair
- GossipSub pubsub for peer advertisement and heartbeat topics
- Stream-based RPC for reservation prepare/commit/cancel and fragment dispatch
- Runs in a daemon **Trio** thread, bridged to asyncio via `queue.SimpleQueue`
- **Embedded dev swarm**: configurable N worker peers (default 4) run alongside the coordinator, each with their own libp2p host and fragment execution capability

### Persistence

**Postgres** (transactional, event-sourced): users, enrollments, workflow runs, execution plans, financial jobs, reservation events, execution events

**MongoDB** (projections/documents): peer capabilities, topology projections, benchmark results, provenance bundles

**Local JSONL** (append-only peer log): protocol events, reservation/execution transitions, package installs, sync checkpoints

### Running Locally

```bash
cd backend
make install    # uv sync --extra dev
make run        # scripts/demo-start.sh
make run-clean  # scripts/demo-start.sh --clean (flush runtime artifacts first)
make test       # uv run pytest
make lint       # ruff + mypy
```

### Tests

20 unit tests in `tests/unit/` covering: health, config, auth, discovery (API + bootstrap + registry + service), distributed execution, execution service, reservations, financial (API + comparison + portfolio + summary), benchmarks, persistence, DAG planning, package manifests/signing, libp2p peerstore.

---

## Frontend-v2 Architecture

Framework: Next.js 16 (App Router), React 19, TypeScript, Bun package manager.

### IMPORTANT for AI agents

`frontend-v2/AGENTS.md` warns: this uses a newer version of Next.js with breaking changes. Read `node_modules/next/dist/docs/` before writing any Next.js code.

### Routing

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Redirects to `/dashboard` |
| `/login` | `src/app/login/page.tsx` | Login shell (no backend integration) |
| `/dashboard` | `src/app/(main)/dashboard/page.tsx` | 3D network graph, stats, charts, data table |
| `/runs` | `src/app/(main)/runs/page.tsx` | Unified run list (circuit + financial) |
| `/runs/new` | `src/app/(main)/runs/new/page.tsx` | Visual circuit builder + OpenQASM editor |
| `/runs/[runId]` | `src/app/(main)/runs/[runId]/page.tsx` | Run detail, quantum analysis, fragment flow |
| `/runs/[runId]/fragment-flow` | `.../fragment-flow/page.tsx` | Full-page fragment DAG canvas |
| `/finance` | `src/app/(main)/finance/page.tsx` | CSV upload, portfolio optimization, quantum-vs-classical comparison |

### BFF Proxy Pattern

The browser **never** calls the Python backend directly. Next.js API routes (`src/app/api/`) proxy all requests:

- `src/lib/backend-client.ts` — server-only HTTP client, reads `QUANTUM_BACKEND_URL` (default `http://127.0.0.1:8080`)
- `src/lib/backend-normalizers.ts` — defensively normalizes backend responses
- `src/lib/dashboard-transformers.ts`, `src/lib/run-transformers.ts` — reshape data into frontend snapshots

### State Management

Zustand stores:
- `src/store/dashboard-store.ts` — dashboard snapshot, loading/error, selected node
- `src/store/runs-store.ts` — run list + per-run detail, optimistic updates

Custom hooks with polling:
- `useDashboardData` — `/api/dashboard`, refreshes every 30s
- `useRunsList` — `/api/runs`, refreshes every 5s
- `useRunDetail` — `/api/runs/[id]`, refreshes every 2s (stops on terminal state)
- `useRunQuantumFullDetail` — fetches full detail on demand
- `useCreateRun` — POST + optimistic update + navigate
- `useCircuitComposer` — OpenQASM editor state, templates, snippets

### Key Interactive Components

1. **3D Peer Network Graph** (`dashboard-network-3d.tsx`) — `react-force-graph-3d`, WebGL, orbit controls, collision physics
2. **Bloch Sphere** (`bloch-sphere.tsx`) — `@qctrl/visualizer`, paginated multi-qubit display
3. **Fragment Flow DAG** (`fragment-flow-canvas.tsx`) — `@xyflow/react` (ReactFlow), animated edges, service type badges
4. **Visual Circuit Builder** (`visual-circuit-builder.tsx`) — `@dnd-kit` drag-and-drop grid, real-time OpenQASM generation
5. **Quantum Analysis Section** (`run-quantum-analysis-section.tsx`) — ~1150 lines: measurement histograms, probability distributions, observable expectations, entanglement entropy, Bloch vectors, statevector tables, density matrices

### Styling

- Tailwind CSS 4 with oklch color space (light + dark themes)
- shadcn/ui v4 (radix-luma style, olive base color)
- Custom "Clay" design system documented in `DESIGN.md`

### Running Locally

```bash
cd frontend-v2
bun install
bun run dev     # default: http://localhost:3000
```

Set `QUANTUM_BACKEND_URL` if backend is not at `http://127.0.0.1:8080`.

---

## Docker Compose (full stack)

```bash
cp .env.example .env
docker compose up --build
```

Services: `backend` (port 8080), `frontend-v2` (port 3000), `caddy` (ports 80/443).

Default: Neon Postgres (`QB2_POSTGRES_TARGET=neon`), Atlas MongoDB (`QB2_MONGODB_TARGET=remote`), libp2p enabled with 4 dev worker peers.

---

## Documentation Corpus (`docs/`)

### Current-state (trust these)

| File | Content |
|---|---|
| `ARCHITECTURE.md` | ~740-line deep architecture walkthrough with Mermaid diagrams |
| `design.md` | Design rationale, cost model, failure model, protocol contracts |
| `requirements.md` | 14 functional + 5 non-functional requirements |
| `tasks.md` | M0-M6 milestone checklist |
| `PROGRESS.md` | Frontend migration status |
| `FINANCIAL_MODELING_FOUNDATIONS.md` | Track A (corporate) vs Track B (quantum finance) analysis |

### Future-state (aspirational, not implemented)

| File | Vision |
|---|---|
| `FUTURE_ROADMAP.md` | 5-milestone evolution overview |
| `future-roadmap/01-*` | M1: Production SDK & Platform |
| `future-roadmap/02-*` | M2: Bring Your Own Node |
| `future-roadmap/03-*` | M3: Autonomous Research & Drug Discovery |
| `future-roadmap/04-*` | M4: Torrent-Native Service Network |
| `future-roadmap/05-*` | M5: Hydra Self-Healing Network |

**Do not confuse future-roadmap docs with current implementation.**

### Delivery Status

- **M0-M4**: Implemented (foundation, discovery, planning, coordination, API + persistence)
- **M5** (Evaluation Plane): Not started
- **M6** (Hardening): Not started

---

## Key Differences: backend vs legacy backend

| Aspect | `backend/` (legacy) | `backend/` (active) |
|---|---|---|
| Package name | `quantum_coordinator` | `quantum_backend_v2` |
| Persistence | SQLite only | Postgres + MongoDB + local JSONL |
| Config prefix | `QC_*` | `QB2_*` |
| Config format | YAML file + env overrides | Pure env vars → Pydantic |
| Reservations | Simple state machine | Event-sourced append-only log |
| Executions | Runtime events in SQLite | Event-sourced append-only log |
| Discovery | Pubsub → in-memory registry + SQLite | Pubsub → registry → MongoDB projections |
| Enrollment | None | Full enrollment workflow with trust tiers |
| Auth | Optional API key (`X-API-Key`) | Role-based (ADMIN/OPERATOR/DEVELOPER/VIEWER) + trust tiers |
| Finance | Full profiling + DCF + correlations + anomalies | QAOA portfolio optimization + quantum-vs-classical comparison |
| Plan storage | In-memory cache only | Persisted in Postgres (`ExecutionPlanRecord`) |
| Workers | Embedded libp2p nodes | Embedded dev swarm with per-worker peerstore + fragment execution |

## Key Differences: frontend-v2 vs legacy frontend

| Aspect | `frontend/` (legacy) | `frontend-v2/` (active) |
|---|---|---|
| Framework | Vite SPA | Next.js 16 App Router |
| Structure | Single `App.tsx` (~3900 lines) | 25+ focused components + pages |
| State | All local `useState` | Zustand stores |
| API calls | Direct `fetch()` to backend (CORS) | BFF proxy via Next.js API routes |
| Routing | Tab state in component | File-based routing |
| Types | Inline in api client | Dedicated `types/` directory (6 modules) |

---

## Where To Start By Task

**Backend API or orchestration**:
→ `backend/src/quantum_backend_v2/api/routers/` then `application/`

**Circuit parsing or planning**:
→ `backend/src/quantum_backend_v2/planning/` and `application/distributed_statevector.py`

**Libp2p or peer discovery**:
→ `backend/src/quantum_backend_v2/libp2p/` then `discovery/`

**Persistence or data models**:
→ `backend/src/quantum_backend_v2/persistence/postgres.py` (ORM) and `persistence/mongodb.py` (Beanie docs)

**Alembic migrations**:
→ `backend/alembic/`

**Frontend pages or components**:
→ `frontend-v2/src/app/(main)/` for pages, `frontend-v2/src/components/` for components

**Frontend API layer**:
→ `frontend-v2/src/app/api/` (route handlers) and `frontend-v2/src/lib/backend-client.ts`

**Frontend state or hooks**:
→ `frontend-v2/src/store/` and `frontend-v2/src/hooks/`

**Frontend types**:
→ `frontend-v2/src/types/`

**Docker or deployment**:
→ `docker-compose.yaml`, `backend/Dockerfile`, `frontend-v2/Dockerfile`, `MANUAL.md`

**Docs or roadmap**:
→ `docs/README.md` — separate current-state docs from future-roadmap docs before making claims

---

## Caveats That Matter

1. **Trio/asyncio bridge**: The libp2p layer runs in a Trio thread. Communication with the asyncio FastAPI world happens through `queue.SimpleQueue` (events) and `trio.from_thread.run` (RPC). Do not mix Trio and asyncio primitives.

2. **No WebSockets**: Neither backend nor frontend-v2 uses WebSockets. The legacy backend had a WS endpoint (`/api/v1/jobs/{job_id}/ws`), but backend relies on polling from the frontend and libp2p pubsub for peer communication.

3. **Auth is dev-mode**: `QB2_AUTH_REQUIRED=false` by default. Production JWT is a stub. Do not build features that assume real auth exists.

4. **Next.js version**: frontend-v2 uses Next.js 16 which has breaking changes from AI training data. Always check `node_modules/next/dist/docs/` before writing Next.js code.

5. **Embedded dev swarm**: The libp2p "network" in local dev is a coordinator + N worker peers all running in the same process. This is a controlled demo fabric, not an open heterogeneous node ecosystem.

6. **Quantum modeling simplifications**: Teleportation = ancilla-free SWAP. Syndrome extraction and distillation = orchestration steps (no stabilizer measurement). Fidelity = consistency reference against ideal compiled state, not hardware tomography.

7. **Financial workflow**: backend implements QAOA-based portfolio optimization with quantum-vs-classical comparison reports. This is different from the legacy backend's simpler profiling + DCF + anomaly detection approach.

8. **Bun, not npm**: frontend-v2 uses Bun as its package manager. Use `bun install` and `bun run dev`, not npm/yarn.

9. **uv, not pip**: backend uses `uv` for Python package management. Use `uv sync` and `uv run`, not pip.

---

## Reading Order For New Sessions

1. **This file** (`CONTEXT.md`)
2. `README.md` (quick start)
3. `docs/ARCHITECTURE.md` (system architecture)
4. `docs/tasks.md` (delivery status)
5. Then the specific code area relevant to the task

# CONTEXT

This file is the root-level context pack for agents working in this repository.

It is meant to answer, quickly and accurately:

- what this platform is
- what exists today
- how the main workflows work
- where the important code lives
- what is current implementation vs future roadmap
- what caveats matter before changing anything

This summary is based on the current codebase and docs as of this workspace state, not just aspirational docs.

## One-Sentence Thesis

This repository is a research-oriented platform that treats quantum-style operations as discoverable network services, orchestrates them through a Python FastAPI coordinator over `py-libp2p`, exposes them through a modern Next.js operator console, persists execution state to SQLite, and augments completed runs with Qiskit-based analysis.

There is also a newer financial-analysis workflow in the same platform that reuses the operator console and backend infrastructure, even though the main docs still focus mostly on the quantum/distributed-orchestration story.

Important nuance: the richer finance engine currently lives in legacy `backend/`; `backend-v2/` currently exposes a narrower finance parity flow centered on CSV profiling.

## What The Platform Does Today

At a practical level, the platform currently provides:

- a Python backend coordinator in `backend/`
- a primary operator UI in `frontend-v2/`
- a legacy Vite dashboard in `frontend/`
- a documentation corpus in `docs/`
- Docker + Caddy deployment support at the repo root
- SQLite persistence for jobs, runtime events, service ads, reservations, and financial jobs
- a demo libp2p fabric with embedded service nodes
- a circuit submission and execution workflow
- a financial CSV analysis workflow

## What This Platform Is Not

This is important because the docs intentionally mix current POC scope with long-term ambition.

The current repository is **not**:

- a real quantum hardware control stack
- a full quantum internet implementation
- a production multi-tenant platform
- a multi-coordinator consensus system
- a complete bring-your-own-node marketplace
- a finished experiment/baseline-comparison harness

Treat it as a serious proof-of-concept orchestration platform with a growing operator console, not as a complete production network.

## Current Product Identity

The cleanest mental model is:

1. The backend treats quantum capabilities as services attached to nodes.
2. Service nodes advertise capabilities and fidelity over libp2p.
3. The coordinator compiles a circuit into dependency-aware fragments.
4. The runtime reserves nodes, executes fragments, retries/falls back on failure, and stores runtime events.
5. Qiskit reconstructs useful quantum analysis from the executed plan.
6. The frontend gives operators a dashboard for health, services, runs, plans, and analysis.

Separately:

1. A CSV can be submitted as a financial analysis job.
2. In legacy `backend/`, the finance path profiles columns, computes correlations and time-series insights, performs a simplified DCF path, detects anomalies, and derives a finance-themed quantum execution artifact.
3. In `backend-v2/`, the current finance path is much narrower and stops at CSV profiling plus simple per-column statistics.
4. The frontend displays the active finance payload in the same operator console.

## Current State Vs Future State

This repo has two different kinds of documentation:

- `docs/ARCHITECTURE.md`, `docs/design.md`, `docs/requirements.md`, `docs/tasks.md`, `docs/PROGRESS.md`
  - these describe the current proof-of-concept and near-term delivery
- `docs/FUTURE_ROADMAP.md` and `docs/future-roadmap/*.md`
  - these describe the multi-milestone future platform vision

Future agents should not confuse the two.

The roadmap envisions a progression from:

- platform
- node network
- scientific/discovery engine
- torrent-native swarm
- self-healing distributed organism

But the codebase today is still primarily in the current POC / platform-console stage.

## Repository Map

Top-level layout:

- `backend/`
  - Python FastAPI coordinator, planner, runtime, libp2p fabric, persistence, tests
- `frontend-v2/`
  - active Next.js operator console
- `frontend/`
  - legacy Vite dashboard
- `docs/`
  - current-state docs and long-horizon roadmap docs
- `deploy/`
  - Caddy configuration
- `docker-compose.yaml`
  - local/prod-style container orchestration
- `MANUAL.md`
  - EC2 + Docker + Caddy runbook

## The Most Important Entrypoints

Backend:

- `backend/src/quantum_coordinator/asgi.py`
  - ASGI app entrypoint
- `backend/src/quantum_coordinator/application/bootstrap.py`
  - loads config, configures logging, creates app
- `backend/src/quantum_coordinator/api/app.py`
  - main FastAPI assembly and route definitions

Frontend:

- `frontend-v2/src/app/page.tsx`
  - redirects `/` to `/dashboard`
- `frontend-v2/src/app/(main)/layout.tsx`
  - main operator shell layout
- `frontend-v2/src/lib/backend-client.ts`
  - server-side BFF client for calling the backend
- `frontend-v2/src/app/api/*`
  - Next.js route handlers that proxy/reshape backend data

Docs:

- `README.md`
  - best first stop for running the project
- `docs/ARCHITECTURE.md`
  - best narrative overview of how the quantum system is supposed to work
- `docs/FINANCIAL_MODELING_FOUNDATIONS.md`
  - best explanation of what "financial modeling" should mean for this repo and which finance track fits the platform
- `docs/tasks.md`
  - best view of completed vs incomplete near-term milestones
- `docs/FUTURE_ROADMAP.md`
  - big-picture future direction

## Active Vs Legacy Frontend

This matters a lot for UI work.

- `frontend-v2/` is the active UI and should be treated as the primary frontend.
- `frontend/` is the older Vite-based dashboard and is now legacy.
- `frontend-v2/README.md` is mostly the default Next.js starter text and is not a reliable architectural guide.
- `frontend/README.md` is actually more descriptive than `frontend-v2/README.md`, but it describes the legacy app.
- `docs/PROGRESS.md` is the best current explanation of the frontend migration and why `frontend-v2/` is primary.

## Main User-Facing Surfaces

Current frontend-v2 pages:

- `/dashboard`
  - coordinator health, services, fidelity-oriented overview
- `/runs`
  - run history and status views
- `/runs/new`
  - circuit creation/submission
- `/runs/[runId]`
  - job detail, plan detail, fragment execution, quantum analysis
- `/runs/[runId]/fragment-flow`
  - dedicated plan/fragment visualization
- `/finance`
  - CSV upload and financial analysis UI
- `/login`
  - login page shell exists, but the backend auth model is still POC-level

## Backend Architecture In Plain English

The backend is organized around several cooperating subsystems:

- API layer
  - receives requests and exposes status/results
- job manager
  - owns job lifecycle and orchestration flow
- planner
  - parses circuits, creates dependencies, assigns fragments to nodes
- reservation protocol
  - checks whether a node can be used for a fragment right now
- runtime executor
  - runs fragments with retry/fallback behavior
- service registry
  - local freshness-aware cache of advertised services
- libp2p fabric
  - coordinator + embedded demo service network
- persistence layer
  - SQLite-backed job/runtime/registry/reservation storage
- Qiskit result builder
  - reconstructs probabilities, statevector, observables, etc.
- financial engine
  - analyses CSV files in a separate workflow

## Core Quantum Execution Flow

The primary quantum run flow is:

1. Client submits a circuit to `POST /api/v1/circuits/submit`.
2. `JobManager.submit()` creates a `QUEUED` job record in SQLite.
3. Background processing moves the job through:
   - `QUEUED`
   - `COMPILING`
   - `RESERVING`
   - `EXECUTING`
   - `COMPLETED` or `FAILED`
4. `CircuitPlanner.compile()`:
   - normalizes circuit input
   - builds operation dependencies
   - builds fragments
   - queries the service registry
   - scores candidate nodes
   - creates an `ExecutionPlan`
5. `RuntimeExecutor.execute()`:
   - waits for dependencies
   - reserves a node for each ready fragment
   - invokes execution
   - retries or switches to fallback nodes on failure
   - stores fragment execution events
6. After fragment execution completes, `build_quantum_result()` produces:
   - counts
   - probabilities
   - measured probabilities
   - statevector
   - observables
   - density matrices
   - Bloch vectors
   - entanglement entropy
   - fidelity summary
7. Final result is stored on the job record and returned through job detail APIs.

## Circuit Input And Service Vocabulary

Supported gate/service types are defined in `backend/src/quantum_coordinator/domain/models.py`:

- `hadamard`
- `cnot`
- `cz`
- `controlled_unitary`
- `programmable_gate`
- `qft`
- `teleportation`
- `bell_pair`
- `syndrome_extraction`
- `distillation`
- `measurement_feedforward`

Important aliases normalized by the parser:

- `h` -> `hadamard`
- `cx` or `cnot` -> `cnot`
- `bell` -> `bell_pair`
- `teleport` -> `teleportation`
- `measure` -> `measurement_feedforward`
- unknown gate names -> `programmable_gate`

The parser supports OpenQASM-like inputs and some project-specific DSL features:

- OpenQASM 2 style `qreg`
- OpenQASM 3 style `qubit[]`
- `for` loop expansion with integer expressions
- controlled gate syntax
- range-like qubit expressions

## Important Implementation Detail: Fragmentation Is Currently Simple

The architecture docs talk about fragments abstractly, but the current implementation is simpler:

- each normalized operation becomes exactly one fragment
- fragment IDs are derived from operation IDs
- dependencies are based on qubit reuse ordering

So the planner is not yet doing sophisticated multi-operation partitioning. It is currently planning at roughly one-operation-per-fragment granularity.

## Planning Model

The planner is deterministic and cost-based.

Current cost components:

- latency cost
- failure risk cost
- entanglement cost
- load cost

Important nuance:

- these costs are currently based on deterministic pseudo-metrics, not live production telemetry
- fidelity comes from service advertisements
- ordering is deterministic for a fixed topology/config

This is good for a research POC and testability, but future agents should not assume the planner is consuming rich real-world metrics yet.

## Service Discovery And Registry

Discovery is built around service advertisements.

Each advertisement includes:

- protocol version
- `node_id`
- `listen_addrs`
- `service_type`
- `fidelity`
- `qubit_min`
- `qubit_max`
- `availability`
- `updated_at`

The `ServiceRegistry` is the local source of truth for planning/runtime decisions:

- keeps current advertisements in memory
- persists them to SQLite
- filters by service type, fidelity, availability
- marks stale entries unavailable

On startup, if libp2p is enabled, cached ads are first marked unavailable until nodes re-advertise.

## Libp2p Model

The current implementation uses a real `py-libp2p` integration layer, but the runtime topology is still demo-oriented.

When `QC_LIBP2P__ENABLED=true`:

- the coordinator starts a libp2p node
- embedded service nodes are created automatically
- each embedded node advertises every `GateType`
- the coordinator consumes ads from pubsub
- gate execution happens over a stream protocol

Important nuance:

- embedded nodes all advertise the full gate set
- their fidelity is mostly differentiated by node index
- this is a controlled demo fabric, not yet an open heterogeneous node ecosystem

When `QC_LIBP2P__ENABLED=false`:

- the backend uses `LocalGateExecutionAdapter`
- execution succeeds locally with a fixed observed fidelity
- the API remains usable even without real libp2p transport

## Reservation And Runtime Behavior

Reservation states:

- `REQUESTED`
- `PREPARED`
- `COMMITTED`
- `REJECTED`
- `EXECUTED`
- `EXPIRED`
- `CANCELED`

Runtime behavior:

- executes fragments once dependencies are satisfied
- reserves before invoking
- retries on timeout/rejection
- can fail over to fallback nodes
- records fragment execution events in SQLite

Terminal fragment failure causes terminal job failure.

## Qiskit Result Reconstruction

This is one of the most important value-add layers in the backend.

The backend does not stop at "fragment X succeeded."

It also reconstructs a Qiskit circuit from the execution plan and exposes:

- measurement counts
- full probabilities
- pre-measurement statevector
- measured qubits
- expectation values
- reduced density matrices
- Bloch vectors
- entanglement entropy
- fidelity metadata
- top basis states

Important approximations in the current implementation:

- teleportation is modeled as `SWAP`
- syndrome extraction and distillation are treated as logical orchestration steps, not extra unitary evolution
- measurement feedforward mainly marks measured qubits
- unsupported programmable operations may be treated conservatively

So the quantum analysis is meaningful for this POC, but not equivalent to a full physical execution model.

## Financial Analysis Workflow

The backend also supports a separate financial-analysis path:

The detailed behavior described below refers to the legacy `backend/` workflow. `backend-v2/` currently implements a reduced finance parity flow that stops at CSV profiling and simple per-column statistics.

- `POST /api/v1/finance/submit`
- `GET /api/v1/finance/{job_id}`
- `GET /api/v1/finance`

What it does:

- accepts a CSV upload
- profiles columns
- computes correlations
- performs time-series analysis
- performs a simplified DCF valuation
- detects anomalies
- stores the resulting financial job in SQLite

Important nuance:

- this workflow is "distributed" more as a platform/demo abstraction than as real libp2p-executed fragments
- the engine is implemented locally in Python
- it records conceptual node execution segments, but does not run financial tasks over the libp2p runtime the same way circuit fragments do

## API Surface

Current quantum/system endpoints:

- `GET /api/v1/health`
- `POST /api/v1/circuits/submit`
- `GET /api/v1/jobs`
- `GET /api/v1/jobs/{job_id}`
- `GET /api/v1/plans/{plan_id}`
- `GET /api/v1/services`
- `GET /api/v1/metrics/fidelity/{node_id}`
- `WS /api/v1/jobs/{job_id}/ws`

Current financial endpoints:

- `POST /api/v1/finance/submit`
- `GET /api/v1/finance/{job_id}`
- `GET /api/v1/finance`

Notes:

- auth is optional and uses `X-API-Key`
- in-memory rate limiting is optional
- `GET /api/v1/jobs` is used by the Next frontend for run history
- plan detail is exposed, but plans are cached in memory only

## Very Important Caveat: Plan Storage Is In-Memory

Compiled plans are cached in `JobManager._plans`.

That means:

- job records are persisted in SQLite
- fragment execution events are persisted in SQLite
- service ads are persisted in SQLite
- reservations are persisted in SQLite
- but `GET /api/v1/plans/{plan_id}` only works for plans known to the current backend process

If the backend restarts, historical job records can still exist while their plan payloads are no longer available through the plan endpoint.

## Persistence Model

Main SQLite tables created by the backend:

- `jobs`
- `service_ads`
- `reservations`
- `fragment_execution_events`
- `financial_jobs`
- `schema_migrations`

This persistence supports:

- job recovery on startup
- service registry snapshots
- reservation history
- fragment execution history
- financial analysis history

## Frontend-v2 Architecture

The active frontend is a Next.js App Router app that acts as an operator console plus BFF layer.

Key ideas:

- browser UI does not call the Python backend directly everywhere
- Next route handlers under `frontend-v2/src/app/api/` proxy and reshape backend data
- `src/lib/backend-client.ts` centralizes backend access
- the frontend uses typed models and transformer functions to build UI-friendly snapshots

Important backend integration env vars:

- `QUANTUM_BACKEND_URL`
- `QUANTUM_BACKEND_API_KEY`

Frontend-v2 current role:

- dashboard for health/services/fidelity
- run list and run detail
- plan/fragment visualizations
- circuit submission
- quantum analysis views
- financial analytics UI

## Legacy Frontend

`frontend/` is the old Vite React dashboard.

It still matters if:

- you are fixing legacy behavior
- you need earlier visualization logic
- you are comparing old and new UI contracts

But for new platform work, default to `frontend-v2/`.

## Tests And Confidence Areas

The backend test suite covers the main coordination layers.

There are unit tests for:

- config loading
- health endpoint
- job list/detail summary behavior
- planner and planner properties
- parser and DAG behavior
- reservation protocol
- runtime store and job store
- service advertisement and registry
- libp2p fabric
- Qiskit results

There are integration tests for:

- service discovery
- job API flow
- runtime failure behavior

This means the backend is not just sketched out; many core behaviors have executable coverage.

## Running The Platform

Recommended quick start:

```bash
cp .env.example .env
docker compose up --build
```

Default local surfaces:

- frontend: `http://localhost:3000`
- backend docs: `http://localhost:8080/docs`
- health: `http://localhost:8080/api/v1/health`

Local dev split:

Backend:

```bash
make -C backend install
make -C backend demo
```

Frontend-v2:

```bash
bun --cwd frontend-v2 install
bun --cwd frontend-v2 run dev
```

Optional docs site:

```bash
npm --prefix docs install
npm --prefix docs run dev
```

## Operational Caveats

These are easy to miss and matter during development.

- `backend/scripts/demo-start.sh` kills processes on ports `8080`, `9100`, `9200`, `9201`, and `9202`
- `make -C backend demo-clean` removes the local SQLite DB before start
- Docker currently starts backend with `demo-clean-docker`, which resets the DB on container startup
- the default backend DB path in editable/source mode resolves to `backend/data/quantum_coordinator.db`
- the root `.env.example` is mainly for Docker/Caddy deployment
- `backend/config/config.example.yaml` is the main backend config template for local backend runs

## Configuration Model

Configuration is loaded from:

- optional YAML/TOML config file
- `QC_...` environment overrides

Important config groups:

- `api`
- `logging`
- `database`
- `discovery`
- `runtime`
- `libp2p`

Key toggles:

- `QC_API__ENABLE_AUTH`
- `QC_API__API_KEY`
- `QC_API__ENABLE_CORS`
- `QC_DATABASE__PATH`
- `QC_LIBP2P__ENABLED`

## Docs You Should Trust First

For future agents, the best reading order is:

1. `CONTEXT.md`
2. `README.md`
3. `docs/ARCHITECTURE.md`
4. `docs/tasks.md`
5. `docs/PROGRESS.md`
6. relevant code in `backend/src/quantum_coordinator/...` or `frontend-v2/src/...`

The least useful high-level docs are:

- `backend/README.md`
  - currently very minimal
- `frontend-v2/README.md`
  - currently generic starter text

## Where To Start Depending On The Task

If the task is backend API or orchestration:

- start in `backend/src/quantum_coordinator/api/app.py`
- then `application/job_manager.py`
- then planner/runtime/reservation modules

If the task is planning or circuit parsing:

- start in `backend/src/quantum_coordinator/planning/`

If the task is service discovery or libp2p:

- start in `backend/src/quantum_coordinator/service_discovery/`
- then `backend/src/quantum_coordinator/infra/libp2p/`

If the task is persistence or job history:

- start in `backend/src/quantum_coordinator/infra/persistence/`
- also inspect `financial/store.py` for the finance path

If the task is frontend/operator console:

- start in `frontend-v2/src/app/`
- then `frontend-v2/src/app/api/`
- then `frontend-v2/src/components/`
- then `frontend-v2/src/lib/` and `frontend-v2/src/types/`

If the task is docs or roadmap alignment:

- start in `docs/README.md`
- separate current-state docs from future-roadmap docs before making claims

## Current Delivery Status

Based on `docs/tasks.md` and the codebase:

- M0 through M4 are largely implemented in the current POC
- M5 Evaluation Plane is not complete
- M6 Hardening/closeout is not complete

In plain terms:

- end-to-end orchestration exists
- persistence exists
- APIs exist
- frontend-v2 operator surfaces exist
- but baseline comparison, broader benchmarking, and deeper hardening remain unfinished

## Summary For Future Agents

If you only remember a few things, remember these:

- this repo is primarily a distributed quantum-services orchestration POC with a real FastAPI + libp2p + SQLite backbone
- `frontend-v2/` is the active UI; `frontend/` is legacy
- the docs are richer than some component READMEs, but some docs are aspirational, so verify against code
- the backend also contains a financial-analysis workflow that the main docs under-emphasize
- plans are cached in memory, not durably persisted as full API-readable payloads
- the current planner/runtime are real and test-backed, but still demo-oriented in topology and cost inputs


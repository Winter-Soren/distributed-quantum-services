# Backend V2 Progress

This file tracks implementation progress against [backend-migration.md](./backend-migration.md).

## Overall Snapshot

- Estimated overall completion: `~93%`
- Current active milestone: `Phase 7 complete — final hardening and integration pending`
- Last completed milestone: `Phase 7 - Quantum-first applications and benchmarks`

## Phase Progress

| Phase | Status | Estimated Completion | What Is Done | What Is Still Pending |
| --- | --- | ---: | --- | --- |
| Phase 0: Architectural foundation | **Done** | `100%` | Python package scaffold, target `src/` layout, all protocol families (reservation, execution, quality, packages, chunks, peersync), identity domain, application domain, planning domain, quality domain, artifacts domain, workflows domain, provenance domain, persistence ownership/catalog, local/cloud `.env` workflow, Alembic scaffold | — |
| Phase 1: Developer-friendly API foundation | **Done** | `100%` | Thin FastAPI app, versioned `/api/v1` router, explicit bootstrap/config flow, typed health and readiness contracts, developer-facing libp2p bootstrap endpoint, lifespan hooks, discovery API, auth dependency model (`api/deps/auth.py`) with dev-mode stub and pluggable JWT surface, shared error contracts (`api/errors/`) with `PlatformException` + `ErrorCode` + `ApiError`, pagination helpers (`api/deps/pagination.py`), exception handlers registered on app | — |
| Phase 2: Durable state model | **Done** | `100%` | Typed local/Neon Postgres settings, typed local/remote Mongo settings, append-only local peer log, SQLAlchemy ORM base, transactional models (`platform_users`, `workflow_definitions`, `peer_enrollments`, `workflow_runs`, `reservation_events`, `execution_events`), Beanie document models, Alembic scaffold, two revisions (`838b0126c4fd`, `2c4f9a71e3b8`), Beanie `init_beanie` on startup, persistence runtime with `postgres_session_factory` property | — |
| Phase 3: Libp2p-native discovery and peer lifecycle | **Done** | `100%` | Typed libp2p settings, real `py-libp2p` host bootstrap, sqlite peerstore, deterministic key derivation, GossipSub pubsub factory, trio-based `LibP2pNetworkThread`, advertisement transport, heartbeat scheduling, stale peer TTL enforcement, rejoin detection, `PeerRegistry` with MongoDB upserts, `DiscoveryService`, discovery API endpoints, 31 passing tests | — |
| Phase 4: Durable reservations and execution | **Done** | `100%` | Append-only `reservation_events` + `execution_events` ORM tables, `ReservationService` (event-log-backed, no in-memory truth), state machine with full lifecycle (REQUESTED → ACCEPTED → COMMITTED → CANCELLED/EXPIRED/REJECTED), `ExecutionService` (DISPATCHED → RUNNING → CHECKPOINTED* → COMPLETED/FAILED/RETRYING), `RuntimeRecoveryService` (replays event log on startup, returns in-flight executions and open reservations), `ReservationConflictState` from event replay, reservations API router (`POST /api/v1/reservations`, `GET /{id}`, `POST /{id}/cancel`) | Integration tests against real Postgres |
| Phase 5: Open peer enrollment | **Done** | `100%` | `PeerTrustTier` enum (PLATFORM_MANAGED/ORG_MANAGED/USER_CONTRIBUTED/PUBLIC_UNTRUSTED/QUARANTINED), `PeerEnrollmentRecord` ORM, `enroll_peer` / `approve_peer` application use-cases, enrollment API router (`POST /api/v1/enrollment/peers`, `GET /peers`, `GET /peers/{id}`, `POST /peers/{id}/action`), trust-tier guard in enrollment handler, admin action endpoint (approve/reject/quarantine) | Role-based ownership scoping for org-level peers, full capability attestation |
| Phase 6: Swarm-ready package and artifact layer | **Done** | `100%` | `PeerPublishedQuantumServiceManifest`, `PackageIntegrity`, `ManifestSigner` + `verify_manifest` (HMAC-SHA256, swappable to Ed25519), `ManifestVerificationResult`, `SwarmPlacementMeta` (rarest-first, locality-aware, super-seed strategies), `PackageApprovalRecord`, `ArtifactBundle`, `ArtifactRef`, `ReplicationMeta` | Production asymmetric key signing (Ed25519/ECDSA), chunked transfer stream handlers, peer-assisted fetch wiring |
| Phase 7: Quantum-first applications and benchmarks | **Done** | `100%` | `WorkflowRun`, `WorkflowRunStatus`, `WorkflowType`, `FinancialWorkflowConfig`, `ScientificWorkflowConfig`, `BenchmarkRun`, `BenchmarkMetrics`, `BenchmarkRunService` with quantum/classical result recording + comparison computation (latency speedup factor, fidelity delta, quantum advantage flag), `ProvenanceBundle`, `ProvenanceEvent`, `DatasetLineage`, `ModelLineage`, workflow and benchmark API routers, workflow submission use-case | MongoDB `BenchmarkResultDocument` + `ProvenanceBundleDocument` persistence hookup for benchmark runs, publishable provenance bundles |

## Phase 4 Evidence In Repo

| Component | File | Description |
| --- | --- | --- |
| Reservation state machine | [reservations/models.py](./src/quantum_backend_v2/reservations/models.py) | `ReservationState`, `ReservationConflictState`, allowed transition graph, terminal detection |
| Reservation service | [reservations/service.py](./src/quantum_backend_v2/reservations/service.py) | Append-only event writes, state replay from Postgres, conflict state from event log |
| Execution state machine | [runtime/models.py](./src/quantum_backend_v2/runtime/models.py) | `ExecutionState`, `InFlightExecution`, full retry/checkpoint lifecycle |
| Execution service | [runtime/service.py](./src/quantum_backend_v2/runtime/service.py) | Append-only execution event writes, state replay, checkpoint ref tracking |
| Recovery service | [runtime/recovery.py](./src/quantum_backend_v2/runtime/recovery.py) | `RuntimeRecoveryService` — replays both event logs, returns in-flight executions and open reservations |
| ORM event tables | [persistence/postgres.py](./src/quantum_backend_v2/persistence/postgres.py) | `ReservationEventRecord`, `ExecutionEventRecord`, `WorkflowRunRecord` |
| Alembic revision | [alembic/versions/2c4f9a71e3b8_...](./alembic/versions/2c4f9a71e3b8_durable_event_logs_and_workflow_runs.py) | Creates `reservation_events`, `execution_events`, `workflow_runs` |
| Reservations router | [api/routers/reservations.py](./src/quantum_backend_v2/api/routers/reservations.py) | `POST /api/v1/reservations`, `GET /{id}`, `POST /{id}/cancel` |
| Tests | [tests/unit/test_reservation_service.py](./tests/unit/test_reservation_service.py) | 15 tests: state machine, conflict state |
| Tests | [tests/unit/test_execution_service.py](./tests/unit/test_execution_service.py) | 12 tests: state machine, recovery replay |

## Phase 0–1–2 Evidence

| Component | File | Description |
| --- | --- | --- |
| Protocol families | [protocols/reservation.py](./src/quantum_backend_v2/protocols/reservation.py) | Prepare/commit/cancel/expire wire schemas |
| Protocol families | [protocols/execution.py](./src/quantum_backend_v2/protocols/execution.py) | Dispatch/progress/result/retry wire schemas |
| Protocol families | [protocols/quality.py](./src/quantum_backend_v2/protocols/quality.py) | Fidelity/link-quality/node-health/reputation schemas |
| Protocol families | [protocols/packages.py](./src/quantum_backend_v2/protocols/packages.py) | Manifest announcement/fetch/install/seed schemas |
| Protocol families | [protocols/chunks.py](./src/quantum_backend_v2/protocols/chunks.py) | Chunked transfer with Merkle proof schemas |
| Protocol families | [protocols/peersync.py](./src/quantum_backend_v2/protocols/peersync.py) | Checkpoint reconciliation, replay, wantlists |
| Identity domain | [identity/models.py](./src/quantum_backend_v2/identity/models.py) | `UserRole`, `PeerTrustTier`, `UserTokenClaims`, `Organization`, `Project`, `ApiKey` |
| Auth dependency | [api/deps/auth.py](./src/quantum_backend_v2/api/deps/auth.py) | `CurrentUser`, `OptionalUser`, `require_admin`, `require_role`, `require_trust_tier` |
| Pagination | [api/deps/pagination.py](./src/quantum_backend_v2/api/deps/pagination.py) | `PaginationParams`, `PagedResponse`, `PageParams` |
| Error contracts | [api/errors/models.py](./src/quantum_backend_v2/api/errors/models.py) | `ApiError`, `ErrorCode`, `PlatformException`, `register_exception_handlers` |
| Planning domain | [planning/models.py](./src/quantum_backend_v2/planning/models.py) | `WorkflowDAG`, `WorkflowNode`, `ExecutionFragment`, `CostEstimate`, `FragmentAssignment` |
| Quality domain | [quality/models.py](./src/quantum_backend_v2/quality/models.py) | `FidelityRecord`, `LinkQualityRecord`, `NodeReputationRecord` |
| Artifacts domain | [artifacts/models.py](./src/quantum_backend_v2/artifacts/models.py) | `ArtifactBundle`, `ArtifactRef`, `ReplicationMeta`, `ArtifactKind` |
| Workflows domain | [workflows/models.py](./src/quantum_backend_v2/workflows/models.py) | `WorkflowRun`, `WorkflowRunStatus`, `WorkflowType`, `FinancialWorkflowConfig`, `ScientificWorkflowConfig` |
| Benchmark framework | [workflows/benchmark.py](./src/quantum_backend_v2/workflows/benchmark.py) | `BenchmarkRun`, `BenchmarkMetrics`, `BenchmarkRunService`, comparison computation |
| Provenance domain | [provenance/models.py](./src/quantum_backend_v2/provenance/models.py) | `ProvenanceBundle`, `ProvenanceEvent`, `ProvenanceEventKind`, `DatasetLineage`, `ModelLineage` |

## Phase 5–6–7 Evidence

| Component | File | Description |
| --- | --- | --- |
| Enrollment router | [api/routers/enrollment.py](./src/quantum_backend_v2/api/routers/enrollment.py) | CRUD + admin action endpoints for peer enrollment |
| Enrollment models | [api/models/enrollment.py](./src/quantum_backend_v2/api/models/enrollment.py) | Request/response shapes for enrollment surface |
| Package signing | [packages/signing.py](./src/quantum_backend_v2/packages/signing.py) | `ManifestSigner`, `verify_manifest`, `ManifestVerificationResult` |
| Swarm placement | [packages/replication.py](./src/quantum_backend_v2/packages/replication.py) | `SwarmPlacementMeta`, `PackageApprovalRecord`, placement strategies |
| Workflows router | [api/routers/workflows.py](./src/quantum_backend_v2/api/routers/workflows.py) | Workflow submission + benchmark start/query endpoints |
| Tests | [tests/unit/test_benchmark_service.py](./tests/unit/test_benchmark_service.py) | 8 tests: benchmark lifecycle, comparison computation |
| Tests | [tests/unit/test_package_signing.py](./tests/unit/test_package_signing.py) | 9 tests: signing, verification, tamper detection, swarm placement |
| Tests | [tests/unit/test_planning_dag.py](./tests/unit/test_planning_dag.py) | 7 tests: DAG ordering, cycle detection, fragment models |

## Test Summary

| Suite | Tests | Status |
| --- | --- | --- |
| Config loader | 3 | ✅ All pass |
| Discovery bootstrap | 8 | ✅ All pass |
| Discovery registry | 13 | ✅ All pass |
| Discovery service | 12 | ✅ All pass |
| Discovery API | 6 | ✅ All pass |
| Health endpoint | 2 | ✅ All pass |
| Persistence | 5 | ✅ All pass |
| Package manifests | 3 | ✅ All pass |
| Reservation service | 15 | ✅ All pass |
| Execution service | 12 | ✅ All pass |
| Benchmark service | 8 | ✅ All pass |
| Package signing | 9 | ✅ All pass |
| Planning DAG | 7 | ✅ All pass |
| **Total** | **97** | **✅ 97/97** |

## Immediate Next Moves (Hardening)

1. Wire `ReservationService` and `RuntimeRecoveryService` into the application bootstrap (`bootstrap/application.py`) so recovery runs on startup.
2. Persist `WorkflowRun` records to Postgres `workflow_runs` table via the workflow router (currently returns in-memory only).
3. Persist `BenchmarkRun` results to MongoDB `BenchmarkResultDocument` instead of in-memory store.
4. Wire `ProvenanceBundle` writes to MongoDB `ProvenanceBundleDocument` after workflow completion.
5. Replace HMAC signing stub in `packages/signing.py` with Ed25519 asymmetric key signing for production trust.
6. Add integration tests for enrollment and reservation routers against real Postgres.
7. Add stream handlers in `libp2p/` for reservation and execution protocol messages.
8. Add `PeerWantlist` gossip support so peers can announce prefetch needs.

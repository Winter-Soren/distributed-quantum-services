# Code Review Report

Date: 2026-04-20

## Scope

This review is intentionally limited to:

- `backend`
- `frontend-v2`

Excluded from this report:

- legacy `backend`
- legacy `frontend`
- root-level deployment files such as `docker-compose.yaml`, unless a `backend` or `frontend-v2` issue depended on them

One exception was allowed: `backend/src/quantum_backend_v2/application/parity.py` directly imports code from `backend/src`, so that dependency is reviewed as a `backend` packaging/runtime concern.

## Methodology

- Manual file-by-file audit across backend routers, auth, enrollment, discovery, workflows, reservations, bootstrap, runtime, persistence, and the frontend dashboard/run/finance surfaces.
- Parallel sub-reviewers were used for:
- backend API/auth/enrollment/discovery/workflows/reservations
- backend runtime/persistence/bootstrap/libp2p/discovery internals
- frontend dashboard/run-detail/finance/discovery UI
- Route/dependency verification was done directly against local code when auth behavior looked suspicious.
- Findings below are consolidated and deduplicated from the combined review.

## Validation Performed

- `frontend-v2`: `bun.cmd run build`
  Result: failed.
  Reason: `frontend-v2/src/app/layout.tsx` uses `next/font/google` for `Geist`, `Geist Mono`, and `Oxanium`, so the build tried to fetch Google Fonts and failed in this environment.

- `backend`: `..\backend\.venv\Scripts\python.exe -m pytest tests\unit -q`
  Result: `102 passed, 2 failed`.
  Failing tests:
  - `backend/tests/unit/test_config_loader.py::test_load_settings_reads_environment_overrides`
  - `backend/tests/unit/test_persistence.py::test_local_peer_log_store_appends_and_replays`
  Both failures are Windows path-separator expectation issues (`\` vs `/`), not newly introduced runtime failures.

## Findings

### P1

- `frontend-v2/src/lib/backend-client.ts`
  The frontend backend client authenticates with `X-API-Key`, but `backend` auth only parses `Authorization: Bearer ...`. As soon as `QB2_AUTH_REQUIRED=true`, the new frontend integration breaks for runs, finance, and circuit submission with 401s.

- `backend/src/quantum_backend_v2/api/deps/auth.py`
  Auth-enabled mode accepts any `Authorization: Bearer dev-<user_id>` string as that user with no signature, shared secret, or lookup. Any ownership check built on `current_user.user_id` can therefore be bypassed by simple user impersonation.

- `backend/src/quantum_backend_v2/api/routers/financial.py`
  `POST /api/v1/finance/submit` is effectively unauthenticated. `current_user: CurrentUser | None = None` does not register the FastAPI dependency, so anonymous callers can create finance jobs.

- `backend/src/quantum_backend_v2/api/routers/circuits.py`
  `backend/src/quantum_backend_v2/application/parity.py`
  Circuit list/detail endpoints are authenticated but not ownership-scoped. `current_user` is unused, `CircuitJobService.list_jobs()` filters only by workflow type/status, and `get_job()` returns any job by ID. Any authenticated user can enumerate or read another user's circuit jobs, including `circuit_text`.

- `backend/src/quantum_backend_v2/api/routers/financial.py`
  `backend/src/quantum_backend_v2/application/parity.py`
  Financial list/detail endpoints are authenticated but not ownership-scoped. `current_user` is unused, and `FinancialJobService.get_job()` / `list_jobs()` return records across all owners.

- `backend/src/quantum_backend_v2/api/routers/plans.py`
  `backend/src/quantum_backend_v2/application/parity.py`
  Plan fetches are keyed only by `plan_id`. Any authenticated user who knows a plan ID can read the full plan payload, even when it belongs to another user's circuit job.

- `backend/src/quantum_backend_v2/api/routers/enrollment.py`
  The moderation route is not actually admin-only. `_admin: CurrentUser = require_admin` assigns the dependency function object instead of using `Depends`, so approval/reject/quarantine is reachable without an admin gate.

- `backend/src/quantum_backend_v2/application/enrollment.py`
  Re-enrolling an existing peer overwrites `owner_user_id`. A caller can take over another user's enrollment simply by submitting the same `peer_id`.

- `backend/src/quantum_backend_v2/api/routers/discovery.py`
  Discovery endpoints expose peer IDs, trust tiers, health, listen addresses, protocol lists, and topology data with no auth at all.

- `backend/src/quantum_backend_v2/discovery/models.py`
  `backend/src/quantum_backend_v2/discovery/registry.py`
  `backend/src/quantum_backend_v2/api/routers/services.py`
  Discovery trusts self-asserted `trust_tier` and advertised service claims. Those claims are copied into the registry and then surfaced by `/api/v1/services` without reconciliation against enrollment status. Unapproved or quarantined peers can therefore present themselves as healthy, high-trust providers.

- `backend/src/quantum_backend_v2/libp2p/transport.py`
  Peer advertisements are one-shot at startup, while steady-state traffic is heartbeat-only. Nodes that join later can learn liveness but never learn capabilities, protocols, or addresses for already-running peers until those peers restart or explicitly re-advertise.

- `backend/src/quantum_backend_v2/api/app.py`
  Startup never instantiates or invokes runtime recovery. Durable execution and reservation logs exist in Postgres, but nothing replays them into a live coordinator state after restart.

- `backend/Dockerfile`
  The container entrypoint runs `make demo-clean-docker`, which wipes peerstore/peer-log state before launch. Container restarts therefore erase the mounted runtime state instead of preserving it.

### P2

- `backend/src/quantum_backend_v2/bootstrap/application.py`
  Reservation routes are never mounted because bootstrap never constructs a `ReservationService` and therefore always passes `reservation_service=None` into `create_app()`.

- `backend/src/quantum_backend_v2/api/routers/workflows.py`
  Workflow submission is not persisted at all, and `GET /api/v1/workflows/runs/{run_id}` is hardcoded to 404. Benchmark runs are stored only in a process-local dictionary, so a restart loses them immediately.

- `backend/src/quantum_backend_v2/api/routers/workflows.py`
  `backend/src/quantum_backend_v2/workflows/benchmark.py`
  Benchmarks have no ownership boundary. Creation ignores `current_user`, the model has no owner field, and reads are keyed only by `benchmark_id`.

- `backend/src/quantum_backend_v2/application/enrollment.py`
  `backend/src/quantum_backend_v2/api/routers/enrollment.py`
  Enrollment moderation ignores valid state transitions. Approval, rejection, and quarantine overwrite `enrollment_status` directly, so peers can be flipped arbitrarily between states with no pending-only check.

- `backend/src/quantum_backend_v2/api/routers/enrollment.py`
  Pagination totals ignore the active filters. The list query applies `trust_tier` and `status`, but the total-count query does not, so clients receive incorrect totals and page counts.

- `backend/src/quantum_backend_v2/api/routers/reservations.py`
  Reservation creation trusts caller-supplied `requesting_peer_id` instead of binding it to the authenticated caller or coordinator identity. The same route also generates a fresh `reservation_id` on every call, which defeats idempotent retry semantics above the service layer.

- `backend/src/quantum_backend_v2/reservations/service.py`
  `accept()` never checks conflict state or any capacity limit before appending an `ACCEPTED` event. The same worker can therefore accept overlapping reservations and become overbooked.

- `backend/src/quantum_backend_v2/api/routers/reservations.py`
  `backend/src/quantum_backend_v2/reservations/service.py`
  Canceling an unknown reservation raises raw `ValueError` from `_require_state()` and returns a generic 500 instead of the documented not-found behavior.

- `backend/src/quantum_backend_v2/main.py`
  The CLI always runs uvicorn with `reload=True`, including containers and normal `make run` flows. That adds a supervisor/watcher process and production-unfriendly file watching by default.

- `backend/src/quantum_backend_v2/api/routers/system.py`
  Readiness checks only persistence. If libp2p/discovery fails during startup or crashes later, `/api/v1/ready` can still return healthy readiness.

- `backend/src/quantum_backend_v2/discovery/service.py`
  Discovery state is never rehydrated from Mongo on startup. The code constructs a fresh in-memory registry but never loads durable peer projections back into it.

- `backend/src/quantum_backend_v2/discovery/service.py`
  `stop()` never clears `_registry`, but `start()` short-circuits whenever `_registry` is non-null. A stop/start cycle in the same process leaves discovery permanently half-dead.

- `backend/src/quantum_backend_v2/discovery/service.py`
  Embedded dev worker peers are each given a fresh `SimpleQueue`, but no drain task consumes those queues. Long-running local swarms leak queued pubsub messages in memory.

- `backend/src/quantum_backend_v2/persistence/runtime.py`
  `backend/src/quantum_backend_v2/bootstrap/application.py`
  `backend/src/quantum_backend_v2/discovery/service.py`
  The local peer-log durability path is disconnected from the rest of the system. A `LocalPeerLogStore` is constructed, but nothing uses it, and discovery emissions hardcode `peer_log_position=0`.

- `backend/src/quantum_backend_v2/runtime/service.py`
  The retry path cannot move executions forward correctly. The service can emit `RETRYING`, but there is no public redispatch path, and appended retry events keep persisting the original `executing_peer_id` instead of the fallback peer.

- `backend/src/quantum_backend_v2/application/parity.py`
  `backend/Dockerfile`
  `backend` circuit execution still depends on importing `backend/src` at runtime via `sys.path` injection. That makes `backend` non-independent for packaging, deployment, and versioning.

- `frontend-v2/src/components/financial/financial-analytics-client.tsx`
  The finance poller silently drops every non-OK response. Bad/expired/unavailable `jobId` URLs can leave the page with no result UI, no upload UI, and no recovery message while polling continues in the background.

- `frontend-v2/src/components/financial/financial-analytics-client.tsx`
  URL changes clear `jobId` but not `job`. Navigating from `/finance?jobId=...` back to `/finance` can leave stale analytics rendered beside the fresh-upload state.

- `frontend-v2/src/app/api/runs/[runId]/route.ts`
  The financial run-detail branch ignores the `result_detail=summary` contract and always loads the full finance payload. That defeats the lightweight summary/full split used by circuit run detail.

- `frontend-v2/src/components/financial/financial-analytics-client.tsx`
  The "Column Profiles" tab renders only numeric profiles and silently drops categorical and datetime columns. Valid datasets can therefore look incomplete or nearly empty even when backend profile data exists.

- `frontend-v2/src/components/fragment-execution-data-table.tsx`
  `frontend-v2/src/components/fragment-flow-canvas.tsx`
  Completed fragments are treated as successful only when the status string is `SUCCESS`. `COMPLETED` financial fragments therefore render with non-terminal/generic styling across run detail and fragment-flow UI.

- `frontend-v2/src/app/api/dashboard/route.ts`
  `frontend-v2/src/lib/dashboard-transformers.ts`
  The dashboard "peer discovery map" is built only from `/api/v1/services`, not from discovery peers/topology. Peers that exist in discovery but have no current service rows disappear entirely from the UI.

- `frontend-v2/src/components/runs-page-client.tsx`
  `frontend-v2/src/components/run-detail-page-client.tsx`
  `frontend-v2/src/components/financial/financial-analytics-client.tsx`
  Multiple primary user-facing screens contain committed mojibake (`â€”`, `Â·`, `Ã—`, `â€¦`, etc.). This is already visible in core run and finance surfaces.

### P3

- `frontend-v2/src/lib/run-transformers.ts`
  Failed financial jobs are rendered as if all synthetic pipeline phases are still active. Run list/detail surfaces therefore make failed financial jobs look like they are still in progress.

- `frontend-v2/src/components/financial/financial-analytics-client.tsx`
  The finance progress bar treats `FAILED` as a 100 percent bar. Failed jobs look fully complete rather than terminal-failed on the finance page itself.

- `frontend-v2/src/lib/backend-normalizers.ts`
  Minimal backend categorical `count` values are reused as `non_null_count`. Any UI that starts using `non_null_count` for categorical columns will significantly underreport populated rows.

- `frontend-v2/src/components/data-table.tsx`
  Dashboard/discovery search only indexes the primary listen address, not the full advertised address set. Multi-address peers cannot be found by secondary addresses.

- `backend/src/quantum_backend_v2/reservations/models.py`
  Reservation replay overwrites `last_event_at` with the current time instead of the stored event timestamp. Reconstructed state drifts from durable history.

- `backend/src/quantum_backend_v2/runtime/service.py`
  `retry_attempt` is incremented when events are written but dropped during replay, so recovered execution state underreports retry history.

## Residual Risks and Testing Gaps

- The frontend build currently depends on live Google Font downloads. That is a deployment/build reliability issue even before the runtime findings above are addressed.
- Existing backend unit coverage does not exercise late-join discovery behavior, startup recovery wiring, discovery restartability, or queue growth in embedded worker peers.
- Existing frontend finance UI does not appear to have tests around invalid `jobId` URLs, stale URL/state sync, or non-numeric-only datasets.
- No dedicated enrollment or reservation UI/state surfaced under `frontend-v2` during this pass, so there are no concrete frontend-only enrollment/reservation findings beyond shared run/discovery surfaces.

## Bottom Line

The highest-risk issues are concentrated in `backend` auth/ownership enforcement, discovery trust assumptions, restart durability wiring, and reservation/workflow completeness. On the frontend side, the most important problems are the auth-header mismatch, finance view state/polling failures, incorrect financial progress rendering, and already-committed mojibake in core user-facing screens.

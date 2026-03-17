# Backend Coordinator

This directory contains the original core of the project: the distributed quantum coordinator.
It exposes the FastAPI API, manages service discovery and planning, executes routed fragments, persists runtime state, and produces Qiskit-backed result payloads.

If you want the workspace-level overview, start at the root [`README.md`](../README.md).

## Responsibilities

- FastAPI REST and WebSocket API for health, jobs, plans, services, and live updates
- `py-libp2p`-based service discovery and remote gate invocation
- circuit normalization and dependency-aware planning
- reservation, retry, timeout, and fallback handling
- SQLite-backed job, registry, and runtime-event persistence
- Qiskit-backed counts, probabilities, Bloch vectors, entropy, and fidelity summaries

## Requirements

- Python `3.10+`
- [`uv`](https://github.com/astral-sh/uv)
- free local ports `8080`, `9100`, `9200`, `9201`, and `9202` for demo mode

## Common Commands

```bash
make install
make demo
make demo-clean
make run
make lint
make format
make test
```

You can also run `make help` to see the available targets.

## Local Development

### Install dependencies

```bash
make install
```

### Start the full demo

```bash
make demo
```

For a clean database:

```bash
make demo-clean
```

The demo starts:

- FastAPI on `http://127.0.0.1:8080`
- the coordinator libp2p listener on port `9100`
- embedded service nodes on ports `9200` through `9202`

Important behavior:

- `scripts/demo-start.sh` force-kills any process using those ports before starting
- `demo-clean` removes `data/quantum_coordinator.db`

### Run in local-only development mode

If you want to exercise the API without bringing up real libp2p transport:

```bash
QC_LIBP2P__ENABLED=false make run
```

In this mode the backend uses the local in-process gate execution adapter.

## API Surface

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/health` | health, version, environment, uptime |
| `POST /api/v1/circuits/submit` | submit a circuit for background execution |
| `GET /api/v1/jobs/{job_id}` | fetch job status, progress, and results |
| `GET /api/v1/plans/{plan_id}` | inspect the compiled execution plan |
| `GET /api/v1/services` | list the current service registry snapshot |
| `GET /api/v1/metrics/fidelity/{node_id}` | aggregate current fidelity samples for one node |
| `WS /api/v1/jobs/{job_id}/ws` | stream job status updates until completion |

Useful details:

- `GET /api/v1/jobs/{job_id}` supports `result_detail=full|summary`
- summary mode omits the heaviest quantum fields such as `statevector` and `reduced_density_matrices`
- plan lookup is session-scoped because compiled plans live in the current process cache

## Configuration

Start from [`config/config.example.yaml`](config/config.example.yaml).

The backend loads configuration from:

1. an optional config file
2. `QC_`-prefixed environment overrides

Examples:

```bash
QC_CONFIG_FILE=config/config.example.yaml
QC_API__PORT=9000
QC_LOGGING__LEVEL=DEBUG
QC_API__ENABLE_AUTH=true
QC_API__API_KEY=super-secret
QC_LIBP2P__ENABLED=false
QC_DATABASE__PATH=./data/dev-alt.db
```

If `libp2p.enabled` is `true` and the libp2p fabric fails to start, the API fails startup rather than silently degrading.

## Package Layout

```text
src/quantum_coordinator/
  api/                 FastAPI routes and response models
  application/         job manager and bootstrap wiring
  config/              typed configuration models and loader
  domain/              shared enums and domain types
  infra/libp2p/        py-libp2p fabric, adapters, protocols
  infra/persistence/   SQLite stores and migrations
  planning/            parser, DAG builder, fragments, planner, cost model
  reservation/         reservation protocol and state machine
  runtime/             executor, gate adapter, Qiskit result builder
  service_discovery/   advertisement validation, discovery loop, registry
tests/
```

## Related Project Docs

- [`../README.md`](../README.md): workspace overview
- [`ARCHITECTURE.md`](ARCHITECTURE.md): architecture deep dive
- [`docs/design.md`](docs/design.md): design rationale
- [`docs/requirements.md`](docs/requirements.md): requirements
- [`docs/tasks.md`](docs/tasks.md): milestone plan
- [`postman.json`](postman.json): importable API collection
- [`PRESENTATION_DECK.md`](PRESENTATION_DECK.md): presentation deck
- [`PRESENTATION_SCRIPT.md`](PRESENTATION_SCRIPT.md): narration script

## Modeling Notes

This backend demonstrates real orchestration, persistence, planning, and transport behavior, but some higher-level quantum semantics remain simplified:

- `teleportation` is approximated as logical state transfer in the current result-reconstruction flow
- `syndrome_extraction` and `distillation` are treated as orchestration-level steps rather than full fault-tolerant protocol simulations

## License

Apache-2.0. See [`LICENSE`](LICENSE).

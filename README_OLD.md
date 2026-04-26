# Distributed Quantum Services

Research-oriented platform for orchestrating quantum-style service execution over `py-libp2p`, with:

- a Python backend coordinator (`backend/`)
- a Next.js operator dashboard (`frontend-v2/`)
- a standalone documentation corpus (`docs/`)

## Start Here

Choose one path:

1. **I want it running quickly (recommended):** use Docker (`~2-5 min`).
2. **I want to develop locally:** run backend + dashboard directly.

If you are unsure, pick Docker first.

## Quick Start (Docker, Recommended)

Run from repository root:

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Dashboard: `http://localhost:3000`
- API docs: `http://localhost:8080/docs`
- Health: `http://localhost:8080/api/v1/health`

### Docker Notes

- Local defaults in `.env` should stay:
  - `CADDY_FRONTEND_SITE_ADDRESS=http://localhost:3000`
  - `CADDY_API_SITE_ADDRESS=http://localhost:8080`
- SQLite persists in Docker volume `backend_data`.
- For the simplest runtime, set `QC_LIBP2P__ENABLED=false`.

## Local Development Setup

Use this path if you want to edit code in `backend/` or `frontend-v2/`.

### Prerequisites

- Python `3.10+`
- [`uv`](https://github.com/astral-sh/uv)
- Node.js `20+`
- `bun`
- `npm`
- Free local ports: `8080`, `9100`, `9200`, `9201`, `9202`

### 1) Start backend

```bash
make -C backend install
make -C backend demo
```

For a clean DB:

```bash
make -C backend demo-clean
```

If `fastecdsa` fails during install (Linux):

```bash
sudo apt-get install -y libgmp-dev
```

### 2) Start dashboard (`frontend-v2`)

In another terminal:

```bash
bun --cwd frontend-v2 install
bun --cwd frontend-v2 run dev
```

If backend is not on default URL:

```bash
QUANTUM_BACKEND_URL=http://127.0.0.1:8080 bun --cwd frontend-v2 run dev
```

### 3) (Optional) Start docs site

In another terminal:

```bash
npm --prefix docs install
npm --prefix docs run dev
```

Optional AI docs chat:

- set `OPENROUTER_API_KEY`
- optionally set `OPENROUTER_MODEL`

## Verify It Works

```bash
curl http://127.0.0.1:8080/api/v1/health
curl http://127.0.0.1:8080/api/v1/services
```

Submit sample circuit:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/circuits/submit \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "circuit": "OPENQASM 3;\nqubit[2] q;\nbit[1] c;\nbell_pair q[0], q[1];\ncnot q[0], q[1];\ncz q[0], q[1];\nteleport q[0], q[1];\nsyndrome_extraction q[0];\ndistillation q[1];\nmeasure q[0] -> c[0];"
  }'
```

Then query:

```bash
curl http://127.0.0.1:8080/api/v1/jobs/<job_id>
```

## What This Project Does

At a high level, the coordinator:

1. discovers advertised services over `py-libp2p`
2. parses and normalizes circuit input
3. builds a dependency-aware execution plan
4. reserves and executes fragments with retry/fallback behavior
5. persists lifecycle and runtime data to SQLite
6. reconstructs quantum result summaries with Qiskit

## Service Vocabulary

Current modeled service types:

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

Aliases such as `h`, `cx`, `bell`, `teleport`, and `measure` are normalized automatically.

## Common URLs

| Surface | URL |
| --- | --- |
| Backend OpenAPI | `http://127.0.0.1:8080/docs` |
| Backend ReDoc | `http://127.0.0.1:8080/redoc` |
| Backend health | `http://127.0.0.1:8080/api/v1/health` |
| Frontend dashboard | `http://127.0.0.1:3000` |

## Documentation Guide (Read by Goal)

**Deployment and operations**

- [`MANUAL.md`](MANUAL.md): EC2 + Docker + Caddy deployment and runbook

**Architecture and design**

- [`docs/README.md`](docs/README.md): documentation entry point and reading paths
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): deep architecture walkthrough
- [`docs/design.md`](docs/design.md): system design rationale
- [`docs/requirements.md`](docs/requirements.md): functional/non-functional requirements

**Execution status and planning**

- [`docs/tasks.md`](docs/tasks.md): implementation milestones and checklist
- [`docs/PROGRESS.md`](docs/PROGRESS.md): migration and platform status

**Long-horizon roadmap**

- [`docs/FUTURE_ROADMAP.md`](docs/FUTURE_ROADMAP.md)
- [`docs/future-roadmap/README.md`](docs/future-roadmap/README.md)

**Component-specific setup**

- [`backend/README.md`](backend/README.md)
- [`frontend-v2/README.md`](frontend-v2/README.md)
- [`frontend/README.md`](frontend/README.md) (legacy UI)

## Repository Map

```text
.
├── README.md
├── MANUAL.md
├── backend/
├── frontend-v2/
├── frontend/                  # legacy
├── docs/
├── docker-compose.yaml
└── deploy/
```

## Important Behavior Notes

- No root workspace `Makefile`; use `make -C backend ...`.
- `frontend-v2/` is the active UI; `frontend/` is legacy.
- Backend demo scripts may kill processes on ports `8080`, `9100`, `9200`, `9201`, `9202`.
- `GET /api/v1/plans/{plan_id}` is backed by in-memory plan cache for current backend process.
- This project is a proof-of-concept orchestration system, not a full hardware quantum network stack.

## EC2 + Caddy (Production-Style Deployment)

For domain-backed HTTPS deployment:

1. Point root and `api.<domain>` DNS A records to the EC2 IP.
2. Open inbound ports `80` and `443`.
3. Set in `.env`:

```dotenv
CADDY_FRONTEND_SITE_ADDRESS=quantum.example.com
CADDY_API_SITE_ADDRESS=api.quantum.example.com
```

4. Run:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f caddy backend frontend-v2
```

## License

Apache-2.0 at [`LICENSE`](LICENSE).

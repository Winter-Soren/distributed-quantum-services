# Distributed Quantum Services

This repository is the full workspace for a research-oriented distributed quantum orchestration project.
What started as a backend-only proof of concept now includes:

- a Python backend coordinator
- a React dashboard frontend
- a dedicated documentation site

The root `README.md` is now the project-level guide. Each app also has its own local README:

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`docs/README.md`](docs/README.md)

## Workspace At A Glance

| Folder | Purpose | Main stack | Local start command |
| --- | --- | --- | --- |
| `backend/` | Coordinator, planner, API, persistence, runtime, libp2p integration | Python, FastAPI, py-libp2p, Qiskit | `make -C backend demo` |
| `frontend/` | Operator and research dashboard for jobs, topology, plans, and analysis | React 19, Vite, TypeScript | `npm --prefix frontend run dev` |
| `docs/` | Public docs site and reference handbook | Next.js 16, Fumadocs, MDX | `npm --prefix docs run dev` |

## What The Project Does

- Discovers quantum service advertisements over `py-libp2p`.
- Normalizes OpenQASM-like circuit input into an internal planning model.
- Builds dependency-aware fragments and assigns them with a deterministic cost-based planner.
- Reserves and executes fragments with retry and fallback behavior.
- Persists jobs, registry state, and runtime events to SQLite.
- Reconstructs finished runs with Qiskit to return counts, state summaries, Bloch vectors, entropy, and fidelity information.
- Exposes the system through a FastAPI API, a React dashboard, and a dedicated docs site.

## Quick Start

The commands below are intended to be run from the repository root.

### Requirements

- Python `3.10+`
- [`uv`](https://github.com/astral-sh/uv)
- Node.js `20+`
- `npm`
- free local ports for the backend demo: `8080`, `9100`, `9200`, `9201`, `9202`

### 1. Install and run the backend

```bash
make -C backend install
make -C backend demo
```

For a clean database:

```bash
make -C backend demo-clean
```

Important note:

- `backend/scripts/demo-start.sh` force-kills anything bound to ports `8080`, `9100`, `9200`, `9201`, and `9202`
- `demo-clean` also removes `backend/data/quantum_coordinator.db`

### 2. Start the frontend dashboard

In a second terminal:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

If the backend is running somewhere other than `http://127.0.0.1:8080`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080 npm --prefix frontend run dev
```

### 3. Start the docs site

In a third terminal:

```bash
npm --prefix docs install
npm --prefix docs run dev
```

Optional AI docs assistant:

- set `OPENROUTER_API_KEY` to enable the docs chat route
- set `OPENROUTER_MODEL` if you want to override the default model

### Useful URLs

| Surface | URL |
| --- | --- |
| Backend OpenAPI | `http://127.0.0.1:8080/docs` |
| Backend ReDoc | `http://127.0.0.1:8080/redoc` |
| Backend health | `http://127.0.0.1:8080/api/v1/health` |
| Frontend dashboard | `http://127.0.0.1:5173` |
| Docs site | `http://127.0.0.1:3000` |

## Example API Flow

### Check the coordinator

```bash
curl http://127.0.0.1:8080/api/v1/health
curl http://127.0.0.1:8080/api/v1/services
```

### Submit a sample circuit

```bash
curl -X POST http://127.0.0.1:8080/api/v1/circuits/submit \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "circuit": "OPENQASM 3;\nqubit[2] q;\nbit[1] c;\nbell_pair q[0], q[1];\ncnot q[0], q[1];\ncz q[0], q[1];\nteleport q[0], q[1];\nsyndrome_extraction q[0];\ndistillation q[1];\nmeasure q[0] -> c[0];"
  }'
```

### Inspect the job and plan

```bash
curl http://127.0.0.1:8080/api/v1/jobs/<job_id>
curl http://127.0.0.1:8080/api/v1/plans/<plan_id>
curl http://127.0.0.1:8080/api/v1/metrics/fidelity/<node_id>
```

## Supported Service Vocabulary

The backend currently models these service types:

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

Normalization details:

- aliases such as `h`, `cx`, `bell`, `teleport`, and `measure` are normalized automatically
- unrecognized operations currently fall back to `programmable_gate`

## Repository Map

```text
.
├── README.md                  # workspace-level guide
├── backend/                   # FastAPI coordinator and research backend
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── config/
│   ├── docs/
│   ├── scripts/
│   ├── src/quantum_coordinator/
│   └── tests/
├── frontend/                  # React dashboard
│   ├── README.md
│   └── src/
└── docs/                      # Next.js + Fumadocs site
    ├── README.md
    ├── app/
    ├── content/docs/
    └── lib/
```

## Documentation Map

- [`backend/README.md`](backend/README.md): backend-specific setup, API, and developer commands
- [`frontend/README.md`](frontend/README.md): dashboard setup and API wiring
- [`docs/README.md`](docs/README.md): docs site setup, search, and authoring notes
- [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md): system-level architecture deep dive
- [`backend/docs/design.md`](backend/docs/design.md): design rationale
- [`backend/docs/requirements.md`](backend/docs/requirements.md): functional and non-functional requirements
- [`backend/docs/tasks.md`](backend/docs/tasks.md): milestone planning and task breakdown
- [`backend/postman.json`](backend/postman.json): importable API collection
- [`docs/content/docs/getting-started/quickstart.mdx`](docs/content/docs/getting-started/quickstart.mdx): end-to-end local workflow

## Important Notes

- There is no root workspace `Makefile` right now. Backend commands must be run via `make -C backend ...` or from inside `backend/`.
- `GET /api/v1/plans/{plan_id}` is backed by the coordinator's in-memory plan cache, so plan lookup is only guaranteed for plans compiled since the current backend process started.
- If `QC_LIBP2P__ENABLED=false`, the backend falls back to a local in-process gate adapter instead of real libp2p transport.
- This is a proof-of-concept orchestration system, not a full hardware-backed quantum network stack.
- `teleportation`, `syndrome_extraction`, and `distillation` are still modeled with simplified semantics in the current Qiskit reconstruction path.

## License

The repository currently includes Apache-2.0 license text at [`LICENSE`](LICENSE).

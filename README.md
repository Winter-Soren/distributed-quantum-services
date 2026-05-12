<div align="center">

# Distributed Quantum Services

**Quantum-style operations as discoverable network services — orchestrated over py-libp2p, analyzed with Qiskit**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Qiskit](https://img.shields.io/badge/Qiskit-1.x-6929C4?logo=ibm&logoColor=white)](https://qiskit.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## Overview

This repository is a research-oriented platform demonstrating **quantum operations as network-native services**.

A coordinator node (FastAPI + py-libp2p) discovers worker nodes via GossipSub pubsub, compiles OpenQASM circuits into execution plans, distributes circuit fragments to workers over libp2p streams, and assembles full quantum results using Qiskit statevector simulation. A Next.js operator console provides real-time visibility into the peer network, job lifecycle, and quantum analysis output.

A secondary research track uses the same infrastructure for **QAOA-based portfolio optimization**, with a detailed study of quantum scaling advantage over classical algorithms.

### What This Is Not

- A real quantum hardware stack (Qiskit statevector simulation only)
- A production platform (auth is dev-mode stubs)
- A finished open-node marketplace

Treat it as a serious proof-of-concept with a growing operator console.

---

## Key Research Finding

**97% of quantum runtime is classical parameter search** (COBYLA optimizer inside the QAOA loop).

This means:
- Adding more quantum nodes/processors yields at most **1.03× speedup** (Amdahl's Law)
- Quantum advantage comes from **scaling behavior**, not raw speed
- Portfolio optimization crossover: quantum wins at **N ≥ 40 assets**

| Portfolio Size | Classical Time | Quantum Time | Winner |
|---|---|---|---|
| 10 assets | **20 ms** | 1,500 ms | Classical 75× faster |
| 20 assets | **600 ms** | 1,700 ms | Classical 2.8× faster |
| 40 assets | 6,000 ms | **1,900 ms** | **Quantum 3.2× faster** |
| 60 assets | 20,000 ms | **2,100 ms** | **Quantum 9.5× faster** |

Full analysis in [docs/research/RESEARCH_PAPER_DRAFT.md](docs/research/RESEARCH_PAPER_DRAFT.md).

---

## Architecture

```
                         ┌──────────────────────────────────┐
                         │        Next.js Operator Console   │
                         │  (dashboard · runs · finance)     │
                         └──────────────┬───────────────────┘
                                        │ BFF proxy (REST polling)
                         ┌──────────────▼───────────────────┐
                         │     FastAPI Coordinator           │
                         │  ┌──────────┐  ┌─────────────┐   │
                         │  │ Circuits │  │  Finance    │   │
                         │  │  Jobs    │  │  (QAOA)     │   │
                         │  └──────────┘  └─────────────┘   │
                         │  ┌─────────────────────────────┐  │
                         │  │    py-libp2p (Trio)          │  │
                         │  │  GossipSub · Stream RPC      │  │
                         │  └──────────────┬──────────────┘  │
                         └─────────────────┼─────────────────┘
                                           │ libp2p streams
              ┌────────────────────────────┼──────────────────┐
              │                            │                  │
   ┌──────────▼──────┐          ┌──────────▼──────┐   ┌──────▼──────┐
   │  Worker Peer 1  │          │  Worker Peer 2  │   │  Worker N   │
   │  (hadamard/cnot)│          │  (qft/teleport) │   │  (custom)   │
   └─────────────────┘          └─────────────────┘   └─────────────┘
```

**Persistence**: Postgres (event-sourced workflow runs, enrollments) + MongoDB (peer topology, benchmark results) + local JSONL (append-only peer log)

---

## Repository Structure

```
nodes-quantum-gates/
├── backend/                    Python backend (FastAPI + py-libp2p + Qiskit)
│   ├── src/quantum_backend_v2/ Core package
│   │   ├── api/                FastAPI routers, models, auth, errors
│   │   ├── application/        Business logic (circuit jobs, finance, enrollment)
│   │   ├── libp2p/             py-libp2p host, GossipSub, stream RPC
│   │   ├── discovery/          Peer registry, topology projections
│   │   ├── reservations/       Event-sourced reservation state machine
│   │   ├── persistence/        Postgres (SQLAlchemy) + MongoDB (Beanie) + JSONL
│   │   └── quality/            Qiskit transpilation for service fidelity
│   ├── scripts/                Benchmark scripts (QAOA scaling, datasets)
│   ├── tests/                  Unit tests (pytest)
│   ├── alembic/                Database migrations
│   ├── Makefile                install · run · test · lint
│   └── pyproject.toml          uv-managed Python project
│
├── frontend/                   Next.js 16 operator console
│   ├── src/app/(main)/         Route pages (dashboard, runs, finance)
│   ├── src/app/api/            BFF proxy route handlers
│   ├── src/components/         Shared UI components
│   ├── src/features/           Feature modules (network, runs, finance)
│   ├── src/lib/                Backend client, transformers
│   ├── src/store/              Zustand state stores
│   └── DESIGN.md               Design system specification
│
├── docs/                       Project documentation
│   ├── ARCHITECTURE.md         System architecture (deep dive)
│   ├── design.md               Design goals and tradeoffs
│   ├── requirements.md         Functional/non-functional requirements
│   ├── research/               Research paper, proofs, scaling analysis
│   └── technical/              Implementation notes, benchmarks, postmortem
│
├── dataset/                    S&P 500 benchmark data (100 assets, 5 years)
├── deploy/                     Caddyfile and deployment configs
├── docker-compose.yaml         Full-stack deployment (backend + frontend + Caddy)
├── .env.example                Environment variable template
├── CONTEXT.md                  Detailed contributor context
└── DEPLOYMENT-MANUAL.md        Production deployment runbook
```

---

## Quick Start

### Prerequisites

- Python 3.11+ with [uv](https://github.com/astral-sh/uv)
- Node.js 20+ with npm
- Docker (for full-stack deployment)

### Run the Backend

```bash
cd backend
make install   # installs all Python dependencies via uv
make run       # starts FastAPI on http://localhost:8081
```

To run with a clean slate (flush runtime artifacts):

```bash
make run-clean
```

### Run the Frontend

```bash
cd frontend
npm install
npm run dev    # starts Next.js on http://localhost:3000
```

Set `QUANTUM_BACKEND_URL=http://localhost:8081` in `frontend/.env.local` if needed.

### Run with Docker Compose

```bash
cp .env.example .env
# Fill in Neon Postgres and MongoDB Atlas credentials in .env
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8081`
- API docs: `http://localhost:8081/docs`

---

## Backend: Key Concepts

### Circuit Execution Flow

```
POST /api/v1/circuits/submit  (OpenQASM string)
        ↓
  CircuitJobService  →  WorkflowRunRecord (QUEUED)
        ↓
  Wait for enrolled service peers
        ↓
  Compile execution plan  (fragment DAG)
        ↓
  Distribute fragments via libp2p stream RPC
        ↓
  Assemble quantum state  (Qiskit)
        ↓
  GET /api/v1/jobs/{job_id}
  → counts · probabilities · statevector · Bloch vectors
    entanglement entropy · density matrices · fidelity
```

### Supported Gate/Service Types

`hadamard` · `cnot` · `cz` · `controlled_unitary` · `programmable_gate` · `qft` · `teleportation` · `bell_pair` · `syndrome_extraction` · `distillation` · `measurement_feedforward`

### Finance: QAOA Portfolio Optimization

```
POST /api/v1/finance/submit  (CSV of returns)
        ↓
  Build QUBO  →  Ising Hamiltonian  →  QAOA circuit
        ↓
  COBYLA parameter optimization loop
  (97% of runtime — this is the bottleneck)
        ↓
  GET /api/v1/finance/{job_id}/comparison
  → quantum result vs Simulated Annealing vs Random baseline
```

---

## Frontend: Key Views

| Route | What You See |
|---|---|
| `/dashboard` | Live 3D peer network graph, system metrics, recent runs table |
| `/runs` | All circuit and finance jobs with status polling |
| `/runs/new` | Visual circuit builder (drag-and-drop) + OpenQASM editor |
| `/runs/[id]` | Job detail: fragment DAG, quantum analysis, Bloch spheres |
| `/finance` | CSV upload → portfolio optimization → quantum-vs-classical comparison |

---

## Testing

```bash
# Backend unit tests (20 tests)
cd backend && make test

# Run specific test
cd backend && uv run pytest tests/unit/test_health.py -v
```

---

## Deployment

Full production deployment guide: [DEPLOYMENT-MANUAL.md](DEPLOYMENT-MANUAL.md)

**Stack**: Next.js on Vercel + FastAPI on AWS Lightsail + Neon Postgres + MongoDB Atlas + Caddy (HTTPS)

---

## Documentation

| Document | Description |
|---|---|
| [CONTEXT.md](CONTEXT.md) | Deep contributor context — code organization, caveats, entry points |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system architecture with Mermaid diagrams |
| [docs/design.md](docs/design.md) | Design rationale and tradeoffs |
| [docs/research/RESEARCH_PAPER_DRAFT.md](docs/research/RESEARCH_PAPER_DRAFT.md) | Research paper on QAOA portfolio optimization |
| [docs/technical/BENCHMARK.md](docs/technical/BENCHMARK.md) | Benchmark results and bottleneck analysis |
| [docs/technical/GRADIENT_OPTIMIZATION_POSTMORTEM.md](docs/technical/GRADIENT_OPTIMIZATION_POSTMORTEM.md) | Honest analysis of what failed and why |
| [frontend/DESIGN.md](frontend/DESIGN.md) | Frontend design system specification |

---

## Contributing

1. Fork and create a feature branch.
2. Read [CONTEXT.md](CONTEXT.md) before making backend changes.
3. Run `make lint` and `make test` in `backend/` before submitting.
4. Run `npm run build` in `frontend/` to verify no TypeScript errors.
5. Keep PRs focused — one logical change per PR.

**Research questions or collaboration**: See [docs/research/RESEARCH_PAPER_DRAFT.md](docs/research/RESEARCH_PAPER_DRAFT.md) or open an issue.

---

## Citation

If you use this work, please cite:

```bibtex
@article{bhoir2026quantum,
  title={Quantum Portfolio Optimization: Bottleneck Analysis and Scaling Studies},
  author={Bhoir, Soham and Gupta, Manusheel},
  journal={[Pending submission]},
  year={2026},
  note={QAOA bottleneck analysis, Amdahl's Law, and scaling characterization for financial optimization}
}
```

---

## Acknowledgments

- [Qiskit](https://qiskit.org/) (IBM) — quantum computing framework
- [py-libp2p](https://github.com/libp2p/py-libp2p) — peer-to-peer networking
- [FastAPI](https://fastapi.tiangolo.com/) — async Python API framework
- [shadcn/ui](https://ui.shadcn.com/) — UI component library

---

<div align="center">

**[Architecture](docs/ARCHITECTURE.md)** · **[Research Paper](docs/research/RESEARCH_PAPER_DRAFT.md)** · **[Deployment](DEPLOYMENT-MANUAL.md)** · **[Design System](frontend/DESIGN.md)**

</div>

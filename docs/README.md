# Documentation Index

This folder contains the reference documentation for the Distributed Quantum Services platform.

**New here?** Start with [`../README.md`](../README.md) for a project overview, then follow the path below.

---

## Reading Paths

### I want to understand the system architecture

1. [`ARCHITECTURE.md`](ARCHITECTURE.md) — end-to-end architecture, components, and execution flow
2. [`design.md`](design.md) — design goals and tradeoffs
3. [`requirements.md`](requirements.md) — functional and non-functional requirements

### I want to understand the financial/quantum research

1. [`FINANCIAL_MODELING_FOUNDATIONS.md`](FINANCIAL_MODELING_FOUNDATIONS.md) — finance terminology, dataset shapes, QAOA vs classical comparison
2. [`research/RESEARCH_PAPER_DRAFT.md`](research/RESEARCH_PAPER_DRAFT.md) — full research paper (15k words, publication-ready)
3. [`research/MATHEMATICAL_APPENDIX.md`](research/MATHEMATICAL_APPENDIX.md) — formal proofs and derivations

### I want to deploy the platform

1. [`../DEPLOYMENT-MANUAL.md`](../DEPLOYMENT-MANUAL.md) — complete deployment guide (Vercel + Lightsail + managed DBs)
2. [`LIGHTSAIL-DEPLOYMENT.md`](LIGHTSAIL-DEPLOYMENT.md) — Lightsail-specific setup
3. [`START_HERE.md`](START_HERE.md) — local development onboarding

### I want to understand the long-term roadmap

1. [`FUTURE_ROADMAP.md`](FUTURE_ROADMAP.md) — milestone overview
2. [`future-roadmap/`](future-roadmap/) — per-milestone detail docs
3. [`IPFS_INTEGRATION_STRATEGIC_VISION.md`](IPFS_INTEGRATION_STRATEGIC_VISION.md) — VAULT / IPFS roadmap

---

## Doc Inventory

### Core (current-state, always accurate)

| File | Description |
|---|---|
| `ARCHITECTURE.md` | System architecture with Mermaid diagrams |
| `design.md` | Design rationale, cost model, failure model |
| `requirements.md` | Functional and non-functional requirements |
| `FINANCIAL_MODELING_FOUNDATIONS.md` | Finance theory and quantum-vs-classical framing |
| `START_HERE.md` | Local dev onboarding guide |

### Research

| File | Description |
|---|---|
| `research/RESEARCH_PAPER_DRAFT.md` | Main research paper (15k words) |
| `research/MATHEMATICAL_APPENDIX.md` | Formal proofs and derivations |
| `research/QUANTUM_SCALING_STRATEGY.md` | Scaling hypothesis and crossover analysis |
| `research/ALTERNATIVE_QUANTUM_FINANCE_PROBLEMS.md` | Alternative quantum finance applications |
| `research/DATASET_DOWNLOAD_STRATEGY.md` | Data acquisition notes |

### Technical Notes

| File | Description |
|---|---|
| `technical/IMPLEMENTATION_NOTES.md` | Optimization journey and code changes |
| `technical/GRADIENT_OPTIMIZATION_POSTMORTEM.md` | Honest analysis of failed gradient approach |
| `technical/QAOA_OPTIMIZATION_RESEARCH.md` | Literature survey on QAOA optimization |
| `technical/BENCHMARK.md` | Benchmark results and bottleneck analysis |

### Roadmap (aspirational, not yet implemented)

| File | Description |
|---|---|
| `FUTURE_ROADMAP.md` | Big-picture 5-milestone evolution |
| `future-roadmap/00-current-state.md` | Current POC baseline |
| `future-roadmap/01-*.md` through `05-*.md` | Per-milestone details |
| `IPFS_INTEGRATION_STRATEGIC_VISION.md` | VAULT / IPFS strategic vision |
| `QAE_ENHANCEMENT_NOTE.md` | Quantum Amplitude Estimation extension ideas |

---

## Maintainer Notes

- Keep this index updated when adding new top-level docs.
- Prefer linking from here rather than duplicating navigation blocks across every doc.
- Aspirational docs (future-roadmap, IPFS) must not be confused with current-state docs.

# OSV Fellowship Prep

This document turns the repository into application-ready material for the 2026 OSV Fellowship.
It is written to help answer the official application honestly, ambitiously, and with proof from the codebase.

Sources used for current program guidance:

- `https://www.osvfellowship.com/`
- `https://forms.osv.llc/fellowships2026`
- `https://help.osv.llc/article/10-faqs`
- `https://help.osv.llc/article/11-feedback`

Important current program facts:

- Application deadline listed on the OSV site: `April 30, 2026`
- Fellowship size listed on the OSV site: `12 months`, `$100,000`, `0% equity`
- Grant size listed on the OSV site: `up to 20 grants`, `at least $10,000`
- The official form asks for:
  - `3 exceptional achievements`
  - `what are you working on`
  - `1-2 sentences using zero jargon`
  - `hours per week`
  - `why are you the best person`
  - `what is novel in your approach`
  - `pitch video`
  - `1-year success`
  - `failure modes`
  - `1-page action-plan PDF`
  - `something beautiful in the world`

OSV also explicitly warns against:

- spelling errors
- incomplete answers
- clearly AI-generated answers
- vague answers
- broken or inaccessible pitch links

That means the strongest strategy here is:

- be specific
- be personal where the question is personal
- ground every technical claim in the repo
- avoid pretending unfinished work is already complete

## 1. What this project actually is

The project is a research-oriented distributed orchestration system for quantum-service workflows.
It treats quantum capabilities as network-visible services, discovers them over `py-libp2p`, plans circuit fragments against a live registry, reserves and executes those fragments with retry and fallback behavior, persists the operational trail to SQLite, and reconstructs a rich quantum analysis payload with Qiskit.

The cleanest short description is:

`I'm building software that lets quantum capabilities behave like services on a network instead of one black-box machine. It discovers available nodes, decides where each part of a workflow should run, survives failures, and returns a result people can inspect and improve.`

What it is not:

- not a production quantum network stack
- not a real hardware-control platform
- not a fully general OpenQASM compiler
- not yet a completed experiment-comparison platform

That last point matters. The codebase is already substantial, but the centralized baseline mode and experiment harness are still open roadmap items.

## 2. Core thesis for the application

The strongest application thesis is not "I built a simulator."

It is:

`Future quantum infrastructure will not look like one perfect backend. It will look like heterogeneous, unreliable, distributed services with varying fidelity, availability, and cost. This project builds the orchestration layer for that world.`

That framing fits the repo much better than:

- "quantum networking" in the grandiose sense
- "distributed quantum computing" as if hardware is already there
- "full-stack quantum cloud" language

## 3. What is already implemented

These are the strongest concrete capabilities already present in the repository.

### Backend

- FastAPI job API with health, submit, job status, plan inspection, services, fidelity metrics, and WebSocket updates
- Circuit normalization from OpenQASM-like text into internal planning IR
- Dependency DAG construction and fragment generation
- Deterministic cost-based planning with primary and fallback node assignments
- Reservation handling with explicit state transitions
- Runtime execution with timeout, retry, and fallback behavior
- Real `py-libp2p` transport path for service discovery and remote invocation when enabled
- SQLite persistence for jobs, registry snapshots, reservations, and fragment execution events
- Restart recovery for unfinished jobs
- Qiskit-backed result generation including counts, probabilities, statevectors, Bloch vectors, entropy, and fidelity summaries

### Frontend

- Operator and research dashboard for topology, jobs, plans, fragment timelines, and quantum-result visualization
- DAG view of fragment order and placement
- Result panels for counts, measured probabilities, Bloch vectors, statevector slices, density matrices, and runtime metadata

### Docs

- Dedicated documentation site
- Architecture, planning, runtime, persistence, protocol, research, and contributor docs
- Honest limitation and roadmap sections instead of purely aspirational documentation

## 4. What is still unfinished

These are the most important gaps, and they should be described openly in any application materials.

- centralized baseline mode for distributed-vs-centralized comparison
- first-class experiment harness with recorded scenarios and reproducible reports
- large-scale benchmarking and performance evidence for publishable targets
- multi-coordinator behavior such as consensus or failover
- production-grade security and tenancy
- fully realistic latency and load telemetry in the planner cost model
- durable storage of compiled plans across coordinator restarts

## 5. Evidence from the codebase

High-signal proof points:

- API surface and startup wiring: `backend/src/quantum_coordinator/api/app.py`
- Job lifecycle orchestration: `backend/src/quantum_coordinator/application/job_manager.py`
- Normalization and planning: `backend/src/quantum_coordinator/planning/`
- Runtime execution and result building: `backend/src/quantum_coordinator/runtime/`
- Discovery and registry: `backend/src/quantum_coordinator/service_discovery/`
- Libp2p fabric: `backend/src/quantum_coordinator/infra/libp2p/fabric.py`
- SQLite persistence: `backend/src/quantum_coordinator/infra/persistence/`
- Frontend workspace: `frontend/src/App.tsx`
- Docs site and handbook: `docs/content/docs/`

Current repo size snapshot:

- backend source files under `backend/src/quantum_coordinator/`: `95`
- backend test files under `backend/tests/`: `79`
- frontend source files under `frontend/src/`: `65`
- docs content files under `docs/content/docs/`: `25`

## 6. Verified quality snapshot

Backend test status from `make test` at the time of this prep:

- `48 passed`
- `1 failed`

Current failing test:

- `tests/integration/test_service_discovery_integration.py::test_three_nodes_exchange_service_advertisements`

Why this matters for the application:

- it is a strong sign that this is real engineering work, not a mock repo
- it also means we should not claim "all distributed integration paths are fully stable"

## 7. How to answer the official questions

The sections below are not final copy. They are strong starting material.
Anything that is personal should be rewritten in your own voice.

### Q1. List 3 of your most exceptional achievements

This question is personal, so do not answer it only with project features.
The strongest version will combine:

1. one achievement about building this system end to end
2. one achievement that proves independent execution outside this repo
3. one achievement that proves originality, persistence, or unusual initiative

What the repo can support for item 1:

- designed and built a distributed quantum-services coordinator spanning backend, network transport, persistence, visualization, and docs
- implemented real orchestration primitives: discovery, planning, reservation, retry, fallback, recovery, and result analysis
- turned a backend proof of concept into a full platform with dashboard and handbook

Template:

`Built a research-grade distributed quantum orchestration system from scratch across API, peer-to-peer transport, planning, persistence, runtime recovery, visualization, and documentation. It is not a mockup: it runs end to end, has an integration-tested backend, and exposes inspectable planning and execution state.`

You should replace the other two items with real achievements from your own history.

### Q2. What are you working on?

Zero-jargon version, option A:

`I'm building software for a future where quantum computers are not one machine in one place, but many specialized services spread across a network. The system discovers what is available, decides where each step should run, survives failures, and returns results people can actually inspect.`

Zero-jargon version, option B:

`I'm building the control layer for networked quantum tools. Instead of assuming one perfect machine, it helps many imperfect machines find each other, split up work, recover from failure, and produce results that researchers can compare and improve.`

Short technical version, if needed elsewhere:

`I'm building a distributed orchestration layer for quantum-service workflows using py-libp2p, FastAPI, SQLite, and Qiskit.`

### Q3. Why are you the best person to work on this? What is novel in your approach?

Strong draft:

`I am unusually well suited to this because I am not approaching quantum systems as just an algorithms problem or just a software problem. I am treating them as an infrastructure problem. The novelty in my approach is that I am building the missing coordination layer: discovery, quality-aware placement, reservation, fallback, recovery, and inspectable results for distributed quantum services.`

Stronger version with personal angle added:

`Most people pick one layer: theory, hardware, or applications. I keep building across boundaries. This project exists because I was willing to connect peer-to-peer networking, orchestration, persistence, visualization, and quantum analysis into one working system. The novel part is not any single gate simulation. It is the idea that future quantum infrastructure needs a service-coordination layer, and that we can start building and measuring that layer now.`

### Q4. Pitch video

The video should emphasize:

- the problem is future quantum infrastructure, not just simulation
- the current repo already works end to end
- the next year is about turning a strong prototype into a measurable experimental platform

Recommended structure for a sub-1-minute pitch:

1. one sentence on the problem
2. one sentence on what you built already
3. one sentence on what OSV funding unlocks
4. one sentence on why it matters if it works

### Q5. What could success look like 1 year from now? What about beyond your wildest dreams?

Strong 1-year version:

`One year from now, success means this becomes a serious experimental platform for distributed quantum-service orchestration. That means a stable centralized baseline mode, a reproducible experiment harness, telemetry-driven planning signals, benchmark results across failure scenarios, and a publishable body of evidence about how distributed coordination changes reliability, latency, and result quality.`

Beyond-your-wildest-dreams version:

`Beyond my wildest dreams, this becomes part of the conceptual foundation for how networked quantum infrastructure is coordinated. Instead of people only talking about future quantum networks in theory, they would have a concrete open system for testing scheduling, routing, resilience, and interoperability ideas the same way distributed systems researchers test cloud infrastructure today.`

### Q6. What might failure look like? What could be some original mistakes of your project?

Strong draft:

`Failure would look like building an elegant prototype that never becomes a trustworthy experimental instrument. The biggest mistakes would be over-indexing on architecture instead of measurement, simulating too much instead of validating enough, or claiming more realism than the system actually has. Another failure mode would be treating this as a purely quantum problem when the real challenge is cross-disciplinary: networking, orchestration, observability, and scientific usability all have to mature together.`

This answer is strong because it is specific and self-aware.

### Q7. 1-page action plan

Use the companion draft in `OSV_ACTION_PLAN_DRAFT.md`.

### Q8. Describe something that you find beautiful in the world

This should be fully personal and not outsourced to a template.
The safest advice is:

- write this in your own voice
- keep it concrete
- avoid trying to sound profound

If you want, I can help edit your raw answer later, but I should not author this from nothing as if it were your own.

## 8. Best application angle for this repo

The strongest OSV angle is:

- a strange but credible technical wedge
- a real working artifact already exists
- the next step is bigger than product polish; it is opening a new research surface
- the work sits between fields, which is often where overlooked but important infrastructure gets built

In one sentence:

`This is a moonshot infrastructure project for a future where quantum capabilities are distributed, unreliable, and heterogeneous, and therefore need the same kind of orchestration thinking that transformed cloud computing.`

## 9. Claims to avoid

Avoid these unless you can defend them with evidence:

- "production-ready"
- "full quantum network"
- "real distributed quantum computation" in the hardware sense
- "complete OpenQASM support"
- "publishable benchmark evidence" if you do not yet have the results
- "all tests pass"

Safer alternatives:

- "research-oriented orchestration prototype"
- "real peer-to-peer discovery and remote invocation path"
- "working end-to-end system with meaningful tests"
- "strong platform for experiments now, with evaluation layer still under construction"

## 10. Suggested story arc for the application

Use this order mentally even if the form splits the questions:

1. future quantum infrastructure will be distributed and messy
2. today, most tooling assumes one backend and hides coordination
3. I built an initial system that makes coordination explicit
4. the next year is about making it measurable, comparable, and convincing
5. if this works, it opens a new category of infrastructure and research tooling

## 11. What I would tighten before submission

If time allows before the final application, the highest-value improvements to the repo story are:

1. fix the failing service-discovery integration test
2. implement the centralized baseline mode
3. add an experiment runner that outputs comparison artifacts
4. capture one or two benchmark plots or tables
5. record a short, clean demo video showing submit -> plan -> execution -> result

Those would improve both the application and the underlying project.


# OSV Action Plan Draft

This draft is meant to be compressed into the 1-page PDF required by the 2026 OSV Fellowship form.
The final PDF should follow the form's formatting rules:

- Font: `Arial`
- Font size: `11pt`
- Line spacing: `1.5`

## Project

Build the first strong experimental platform for distributed quantum-service orchestration: a system that can discover quantum capabilities across a network, plan and route workflows across heterogeneous services, recover from failures, and generate reproducible evidence comparing distributed and centralized coordination.

## Why this year matters

The current repository already proves the core architecture:

- peer-to-peer discovery over `py-libp2p`
- cost-based planning with fallbacks
- reservation and retry-aware execution
- durable job and runtime state
- Qiskit-backed result analysis
- operator and researcher interfaces through a dashboard and docs site

The missing piece is not "more concept." It is measurement, comparison, and validation.

## 12-Month Plan

### Phase 1: Stabilize the current prototype

Time: `Month 1-2`

Goals:

- fix the failing service-discovery integration path
- harden startup, shutdown, and recovery behavior
- improve distributed test reliability
- close the most obvious truth-gap between docs and implementation

Outputs:

- green backend test suite
- more stable discovery behavior
- cleaner demo path for reviewers and collaborators

### Phase 2: Build the centralized baseline

Time: `Month 3-4`

Goals:

- implement a first-class centralized execution mode
- ensure the same benchmark circuits can run in both modes
- make configuration, metrics, and output formats comparable

Outputs:

- distributed mode vs centralized mode
- shared benchmark interface
- apples-to-apples comparison surface

### Phase 3: Build the experiment harness

Time: `Month 5-7`

Goals:

- create a scenario runner for repeated benchmark execution
- capture seeds, topology, planner configuration, retries, failures, and outputs
- add controlled fault-injection scenarios:
  - latency spikes
  - node drop
  - quality degradation
  - reservation conflict

Outputs:

- reproducible experiment runs
- CSV and JSON result artifacts
- reusable scenario matrix

### Phase 4: Make planner inputs more real

Time: `Month 8-9`

Goals:

- replace synthetic planner signals where possible with observed runtime telemetry
- improve visibility into planner decisions and fallback behavior
- expose richer runtime metrics for later analysis

Outputs:

- better scoring inputs
- more defensible planner behavior
- stronger observability around execution decisions

### Phase 5: Publish evidence and sharpen the research surface

Time: `Month 10-12`

Goals:

- benchmark larger workflows and node counts
- compare distributed and centralized coordination across reliability and latency scenarios
- prepare a clear technical report, documentation updates, and public artifacts

Outputs:

- benchmark summary
- comparison report
- stronger open research platform for future contributors

## Success Metrics

By the end of the fellowship year, success would mean:

- stable distributed and centralized execution modes
- reproducible scenario runner with saved outputs
- benchmark evidence across multiple failure scenarios
- improved planner realism and runtime telemetry
- public documentation that matches system reality

## Risks

Main risks:

- spending too much time on architecture polish instead of measurement
- over-simulating network behavior instead of validating it
- underestimating how much infrastructure work is needed for reproducible experiments
- building an impressive demo without producing convincing evidence

Mitigations:

- prioritize test stability and experiment harness work early
- make every new feature produce measurable outputs
- keep claims narrowly tied to verified behavior

## Resource Use

Funding would primarily buy time.
The project is software-heavy and can advance far without lab infrastructure, but full-time focus would materially accelerate:

- implementation
- benchmark design
- documentation and reporting
- demo and research communication

Expected direct costs are modest compared with the value of concentrated execution time.

Possible cost categories:

- living expenses for full-time focus
- cloud compute and testing infrastructure
- design and recording support for demos or presentations
- occasional travel for collaboration or research presentation

## Hours Commitment

Target commitment:

- `50-60 hours/week`

That matches OSV's preference for candidates willing to go all in for the year.


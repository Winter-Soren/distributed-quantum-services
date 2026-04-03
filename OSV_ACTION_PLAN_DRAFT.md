# OSV Action Plan Draft

This draft is meant to be compressed into the 1-page PDF required by the 2026 OSV Fellowship form.
The final PDF should follow the form rules:

- font: `Arial`
- size: `11pt`
- spacing: `1.5`

## Project

Build a serious experimental platform for distributed quantum-service orchestration: a system that can discover quantum capabilities across a network, plan and route workflows across heterogeneous services, recover from failures, and generate reproducible evidence comparing distributed and centralized coordination.

## Why this year matters

The current repository already proves the architectural core:

- peer-to-peer discovery over `py-libp2p`
- cost-based planning with fallbacks
- reservation and retry-aware execution
- durable job and runtime state
- Qiskit-backed result analysis
- operator and researcher interfaces through a dashboard and docs site

The missing piece is not more concept work.
It is measurement, comparison, and validation.

## 12-Month Plan

### Phase 1. Stabilize the current prototype

Time: `Month 1-2`

Goals:

- fix the failing service-discovery integration path
- harden startup, shutdown, and recovery behavior
- improve distributed test reliability
- close the biggest truth-gaps between docs and implementation

Outputs:

- green backend test suite
- more stable service discovery
- cleaner demo and contributor path

### Phase 2. Build the centralized baseline

Time: `Month 3-4`

Goals:

- implement a first-class centralized execution mode
- ensure the same circuits can run in both modes
- align outputs, metrics, and configs so they are directly comparable

Outputs:

- stable distributed mode
- stable centralized mode
- shared benchmark interface

### Phase 3. Build the experiment harness

Time: `Month 5-7`

Goals:

- create a scenario runner for repeated benchmark execution
- capture seeds, topology, planner settings, retries, failures, and outputs
- add controlled fault-injection scenarios such as latency spikes, node drop, quality degradation, and reservation conflict

Outputs:

- reproducible experiment runs
- saved CSV and JSON artifacts
- reusable scenario matrix

### Phase 4. Replace synthetic signals with observed telemetry

Time: `Month 8-9`

Goals:

- replace synthetic planner inputs where possible with observed runtime telemetry
- improve visibility into planner decisions and fallback behavior
- expose richer execution metrics for later analysis

Outputs:

- better planner inputs
- stronger observability
- more defensible execution decisions

### Phase 5. Publish evidence and make the platform usable

Time: `Month 10-12`

Goals:

- benchmark larger workflows and node counts
- compare distributed and centralized coordination across reliability and latency scenarios
- publish a technical report, benchmark summary, and improved documentation

Outputs:

- public benchmark report
- end-to-end demo path
- stronger open research platform

## End-of-Year Deliverables

By the end of the fellowship year, success means:

- stable distributed execution mode
- stable centralized baseline mode
- reproducible scenario runner
- telemetry-backed planner inputs
- public benchmark report
- clear docs and demo flow for external reviewers

## Risks

Main risks:

- spending too much time on architecture polish instead of measurement
- over-simulating network behavior instead of validating it
- underestimating the infrastructure work needed for reproducible experiments
- building a compelling demo without producing convincing evidence

Mitigations:

- prioritize test stability and experiment harness work early
- make every major feature produce measurable outputs
- keep claims narrowly tied to verified behavior

## Cost Overview

Replace the placeholders below with real numbers before submission.

- living expenses for 12 months: `$[insert]`
- compute and testing infrastructure: `$[insert]`
- hardware or workstation upgrades: `$[insert]`
- travel, collaboration, or conference costs: `$[insert]`
- contingency buffer: `$[insert]`
- minimum full-time budget: `$[insert]`

## Hours Commitment

Target commitment:

- `50-60 hours/week`

That is strong enough for OSV if it is true.

# OSV Fellowship Prep

This document turns the repository and your resume into application-ready material for the 2026 OSV Fellowship.
It is written to help answer the form honestly, ambitiously, and in a style that actually matches what OSV says it values.

## Sources used

Official:

- `https://www.osvfellowship.com/`
- `https://forms.osv.llc/fellowships2026`
- `https://help.osv.llc/article/9-form-tips`
- `https://help.osv.llc/article/10-faqs`
- `https://help.osv.llc/article/11-feedback`
- `https://help.osv.llc/article/12-selection-criteria`
- `https://help.osv.llc/article/13-form-faqs`
- `https://www.osv.llc/osv-quarterly/magazine/fellowships`

Public signal:

- public winner pages and OSV LinkedIn posts
- a small number of applicant/blog posts
- Reddit, X, and Medium searches

Important note:

- I did look at Reddit, X, Medium, and blogs.
- The public signal there is thin and noisy.
- The strongest, most actionable signal comes from OSV's own help pages, the official form, and how they publicly frame winners.

## Current program facts

As of `April 3, 2026`, the current public program pages say:

- deadline: `April 30, 2026`
- fellowship: `10 x $100,000`, `12 months`, `0% equity`
- grants: `up to 20 x $10,000`
- remote is allowed
- they prefer people willing to go all in for a year, with at least `40 hours/week` and ideally `60+`
- applications are reviewed on a rolling basis
- the form cannot be edited after submission

The 2026 form currently asks for:

- `3 exceptional achievements`
- `what are you working on`
- `1-2 sentence zero-jargon explanation`
- `hours per week`
- `why are you the best person`
- `what is novel in your approach`
- `pitch video`
- `1-year success`
- `failure modes`
- `1-page action-plan PDF`
- `something beautiful in the world`
- `minimum funding needed`
- `prior accelerators / grants / similar programs`
- `prior funding for this specific project`
- `how you heard about OSV`
- optional recommendation

## What OSV actually seems to reward

Across OSV's own site and support pages, the repeated themes are:

- simple, clear, direct writing
- short answers over essay-style answers
- bullets and skimmable structure
- quantifiable impact
- strong proof of work
- ambitious, slightly uncomfortable ideas
- clear end-of-year outcomes
- obsession, independence, and personal agency
- originality over credentials

Their own warnings are also explicit:

- spelling errors
- incomplete answers
- vague answers
- broken or private video links
- clearly low-effort AI writing

They also explicitly say AI can help improve framing, but they penalize generic, standardized, directly copy-pasted answers.

The most important style takeaway is:

`OSV wants sharp signal, not polished fluff.`

## What the web signal says

### 1. Official guidance matters much more than public chatter

Reddit, X, and Medium had very little useful, specific drafting advice.
There is some public excitement, some announcement posts, and occasional applicant commentary, but very little actionable guidance.

Inference:

- do not optimize for internet folklore
- optimize for OSV's own stated criteria and how they present winners

### 2. They like people with "how did they do that?" proof

Their selection criteria page explicitly asks:

- can you raise the bar?
- is the project clear and unique?
- what concrete outcome will exist by the end of the year?
- are you obviously obsessed?
- what are your "how the hell did they do that" moments?

Inference:

- your application should not read like "here is an interesting technical project"
- it should read like "here is a person who repeatedly ships hard things across boundaries and is now pointed at an unusually ambitious problem"

### 3. They care about outputs, not exploration theater

OSV is skeptical of phrasing like:

- "I'll explore"
- "I'll investigate"
- "I'll look into"

They want:

- concrete artifacts
- a believable timeline
- scope matched to resources

### 4. Winner framing is personal, specific, and concrete

Public winner descriptions usually combine:

- why this person is unusually suited
- one bold concrete project
- one sentence on real prior execution
- one sentence on why this matters

That means our drafts should sound less like a research proposal and more like:

`Here is the future I'm building, here is why I can build it, and here is what will exist in 12 months if you back me.`

## Where the first drafts were right

The first drafts were directionally correct on:

- honesty about the repo's current state
- strong project framing around orchestration, not just simulation
- clear identification of missing roadmap items
- avoiding fake production claims

Those parts should stay.

## Where the first drafts were weak

The first drafts were too:

- essay-like
- repo-centric instead of person-centric
- light on quantified proof from your actual history
- soft on your strongest "exceptional achievements"
- generic in the action-plan budgeting section

OSV's own writing advice strongly suggests a more compressed, punchier style.

## Why you are actually a stronger OSV candidate than the first draft showed

Your resume gives much stronger material than we were using before.

High-signal proof from your background:

- Oracle, `Associate Software Developer and Consultant`, where you led GenAI and automation work and earned a `Pace Setter Award` for top `1%` engineer performance
- Protocol Labs Dev Guild work on decentralized systems including `py-libp2p`, `AutoNAT`, `Circuit Relay`, `Hole Punching`, and `Gossipsub`
- multiple research projects and publications across quantum machine learning, dark-web classification, and transfer learning
- invited talks on GenAI and Quantum Computing
- `6` national/state-level hackathon wins plus national finalist finishes
- real-world civic and community projects such as `ChakraView` and `HAS-Chain`

Why that matters:

- you are not "just a student with a technical idea"
- you have production software evidence, research evidence, systems evidence, and public-facing execution evidence
- that is exactly the kind of cross-boundary proof OSV seems to like

## The strongest application angle

The best positioning is:

`I build ambitious systems across boundaries that usually stay separate: distributed systems, research software, quantum workflows, and real-world execution. This project is the next expression of that pattern.`

Useful mental model:

`A torrent network for quantum services.`

That hook is genuinely strong because it quickly communicates:

- peer-to-peer discovery
- distributed coordination
- many specialized participants instead of one monolithic backend
- resilience in a messy network

But it should be used carefully.
It is best as an opener in conversation or in the pitch video, then expanded into the more precise language of service discovery, routing, fallback, and inspectable execution.

That is stronger than:

- "I am passionate about quantum computing"
- "I want to research distributed quantum systems"
- "I built a simulator"

## What this project actually is

The project is a research-oriented orchestration system for quantum-service workflows.
It treats quantum capabilities as network-visible services, discovers them over `py-libp2p`, plans circuit fragments against a live registry, reserves and executes those fragments with retry and fallback behavior, persists the operational trail to SQLite, and reconstructs a rich quantum analysis payload with Qiskit.

The cleanest short description is:

`I am building the coordination layer for a future where quantum computing is not one black-box machine, but a network of specialized services. The system discovers capabilities, decides where work should run, survives failures, and returns results researchers can inspect and improve.`

What it is not:

- not a production quantum network stack
- not a real hardware-control platform
- not a fully general OpenQASM compiler
- not yet a finished benchmark platform

## What is already implemented

High-confidence implemented capabilities:

- FastAPI job API, plan inspection, metrics, and WebSocket updates
- circuit normalization and fragment planning
- deterministic cost-based placement with fallbacks
- reservation handling and runtime retry logic
- `py-libp2p` discovery and remote invocation paths
- SQLite persistence for jobs, reservations, registry snapshots, and runtime events
- restart recovery
- Qiskit-backed result analysis
- frontend dashboard and docs site

## What is still unfinished

These gaps must be described openly:

- centralized baseline mode for distributed-vs-centralized comparison
- reproducible experiment harness
- publishable benchmark evidence
- more realistic telemetry-backed planner inputs
- multi-coordinator behavior
- production-grade security and tenancy
- durable persisted plan retrieval across restarts

## Verified repo snapshot

Current codebase proof points:

- backend source files under `backend/src/quantum_coordinator/`: `95`
- backend test files under `backend/tests/`: `79`
- frontend source files under `frontend/src/`: `65`
- docs content files under `docs/content/docs/`: `25`

Backend test status from the last repo validation:

- `48 passed`
- `1 failed`

Current failing test:

- `tests/integration/test_service_discovery_integration.py::test_three_nodes_exchange_service_advertisements`

Application implication:

- this is clearly real engineering work
- we should not claim the distributed system is fully stable in every path

## How to answer the official questions better

### Q1. List 3 of your most exceptional achievements

This answer should be much stronger than the first draft.
It should use your real "how did he do that?" moments, not just project features.

Recommended structure:

1. one early builder story that proves raw initiative
2. one resilience story that proves unusual recovery and discipline
3. one institution-building story that proves leadership and execution

Recommended ingredients from your personal history:

- at `15`, building an air-based engine from e-waste scraps with `55%` efficiency and earning nomination at `IIT Bombay Techfest`
- at `16`, breaking your arm `52` days before a state swimming competition, recovering fast, and still finishing `3rd`
- in your final BTech year, proposing and helping build a first-of-its-kind blockchain lab in your state from requirements through mining infrastructure and student enablement

Why these are stronger:

- they happened before titles and credentials could carry the story
- they show initiative, resilience, and institution-building
- they feel personal and hard to fake, which is exactly what OSV likes

### Q2. What are you working on?

Lead with the shift from one machine to many services.
That is the sharpest version of the idea.

Best framing:

`Most quantum software assumes one machine. I am building the coordination layer for a future where quantum capabilities are spread across many specialized services. My system discovers what exists, decides where each step should run, survives failures, and returns results researchers can inspect and compare.`

### Q3. Why are you the best person? What is novel?

The best answer is not only about quantum knowledge.
It is about your pattern of building across boundaries.

Best framing:

- distributed systems experience
- production engineering experience
- quantum research background
- willingness to build both the infrastructure and the measurement layer

### Q5. One-year success

This answer should be concrete and artifact-based.
Do not say "I will explore."

Better target:

- stable distributed mode
- stable centralized baseline mode
- reproducible scenario runner
- telemetry-backed planner metrics
- public benchmark report
- end-to-end demo that other researchers can run

### Q6. Failure modes

This answer should sound self-aware, not defensive.

Best framing:

- architecture ahead of evidence
- simulated signals trusted for too long
- beautiful demo instead of credible benchmark platform
- abstractions that are too coordinator-centric and not grounded enough in future heterogeneous services

## What changed in the drafts after this review

I refactored the drafts to better match the signal above:

- made the form draft more specific, shorter, and more personal
- brought in your resume-backed proof of work
- added missing form fields from the 2026 application
- made the action plan more concrete
- added explicit end-of-year deliverables
- added a cost overview section instead of vague budget language

## Final application guidance

To maximize odds, the final submission should feel like this:

- clear enough for a non-specialist
- ambitious enough to feel slightly unreasonable
- specific enough to be believable
- personal enough that it cannot be mistaken for generic AI writing
- honest enough that every strong claim survives scrutiny

The winning tone is:

`high-agency builder with receipts`

Not:

`smart applicant with a nicely written proposal`

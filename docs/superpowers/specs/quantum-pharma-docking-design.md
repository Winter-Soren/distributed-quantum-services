# Quantum Pharma: Distributed Protein Docking and Ligand Discovery

**Design Specification — v1.0**
**Date:** 2026-05-07
**Status:** Ready for mentor review

---

## 1. Thesis

Computational drug discovery is bottlenecked at two points that classical computers handle poorly. The first is flexible protein-ligand docking: finding the optimal binding pose for a candidate molecule inside a protein's active site is a combinatorial search problem that grows exponentially with the number of rotatable bonds in the ligand. The second is binding energy scoring: force-field approximations introduce systematic errors of 5–15 kcal/mol because classical methods cannot model electronic polarization, charge transfer, and quantum tunneling in tight binding pockets.

This module embeds quantum algorithms at both bottlenecks, wraps them in the platform's existing distributed execution fabric, and delivers a complete five-stage drug discovery pipeline accessible through a single API submission.

The contribution is not quantum novelty for its own sake. It is a complete, provenance-preserving pipeline — the only one in the published literature that chains quantum chemical descriptor computation, quantum annealing-style fragment placement, quantum-mechanical binding energy re-scoring, and quantum-ML affinity prediction as a single orchestrated workflow. Every published system to date solves exactly one of these stages in isolation.

---

## 2. Scientific Grounding

### 2.1 The Problem with Classical Docking

Classical docking programs such as AutoDock Vina, Glide, and DOCK 6 represent molecules using point-charge force fields. Each term in the scoring function is an empirical approximation. The electrostatic term treats atomic charges as fixed point charges, ignoring how the charge density of the ligand responds to the electrostatic field of the binding pocket — a quantum mechanical effect called polarization. For polar and charged binding sites this produces errors of 5–15 kcal/mol in the estimated binding free energy, which corresponds to three to four orders of magnitude error in predicted binding affinity.

The pose search problem is NP-hard. For a ligand with K rotatable bonds, each discretized to M torsion states, the search space is M to the power of K. A drug-like molecule has five to ten rotatable bonds; at ten-degree angular resolution this produces tens of billions of candidate poses. Classical methods use genetic algorithms or Monte Carlo sampling to avoid exhaustive search, which means they can and frequently do get trapped in local optima, returning poses that are geometrically plausible but energetically incorrect.

### 2.2 Where Quantum Computing Inserts

Yanagisawa et al. (Entropy, 2024, PMID 38785647) demonstrated that flexible docking can be reformulated as a Quadratic Unconstrained Binary Optimization problem, known as QUBO. Each rigid fragment of the ligand is assigned a binary variable for each candidate placement site in the protein's binding pocket. The QUBO objective function simultaneously minimizes fragment-protein interaction energy, penalizes steric clashes between fragments, enforces covalent bond geometry constraints between adjacent fragments, and requires each fragment to be placed at exactly one site. The Quantum Approximate Optimization Algorithm finds the assignment of fragments to sites that minimizes this objective. Validated on Aldose reductase — a diabetes drug target — the method achieved a binding pose within 1.26 Angstroms of the crystal structure, comparable to the best classical docking programs.

The Variational Quantum Eigensolver computes the ground-state electronic energy of a molecule by minimizing the expectation value of the molecular Hamiltonian over a parameterized quantum state. For drug discovery, the derived descriptors — HOMO energy, LUMO energy, HOMO-LUMO gap, chemical hardness, and molecular electrostatic potential partial charges — are more physically accurate predictors of binding propensity and metabolic stability than classical force-field partial charges. Anurag et al. (J. Comput. Chem., 2026, PMID 42017200) demonstrated that symmetry-based Hamiltonian reductions can cut qubit requirements by approximately fifty percent, making VQE on drug-sized fragments feasible on NISQ hardware today.

Choppara and Lokesh (IEEE Trans. Comput. Biol., 2025, PMID 40857188) introduced a hybrid quantum-classical architecture that projects fused ligand-protein representations into quantum Hilbert space through a Variable Quantum Circuit layer. The quantum layer captures entangled, nonlinear dependencies between drug and protein that classical attention mechanisms cannot represent. The model outperforms all classical baselines in zero-shot scenarios — predicting affinity for drug-target pairs not seen during training — which is the hardest and most commercially valuable prediction case.

Al-Ansi et al. (J. Phys. Chem. B, 2024, PMID 38875526) validated a QM-layered docking refinement on 121 ligand-receptor complexes from the Protein Data Bank, where the binding pocket is treated quantum mechanically and the protein shell classically. This ONIOM-style approach reliably selects the near-native pose when classical scoring fails, because quantum chemistry models the polarization effects that force fields ignore.

### 2.3 ADMET as a Mandatory Safety Gate

Every credible 2024–2026 drug discovery paper applies ADMET profiling — evaluating Absorption, Distribution, Metabolism, Excretion, and Toxicity properties — as the final filter before reporting lead candidates. The quantum contribution at this stage is specific: VQE-computed HOMO energies identify metabolic soft spots. Atoms where the HOMO orbital has high electron density are more susceptible to cytochrome P450-mediated oxidation, the primary metabolic clearance route for most orally administered drugs. This connects the quantum descriptor computation from the earliest pipeline stage directly to the safety evaluation at the final stage, creating a physically grounded link between electronic structure and drug safety.

---

## 3. The Five-Stage Pipeline

The pipeline accepts a ligand represented as a SMILES string, a target protein identified either by its four-letter Protein Data Bank code or as an uploaded PDB file, and a mode flag that determines whether the pipeline runs once or iterates until a viable candidate is found. Every stage updates the job record with its current status, so the frontend can display live progress throughout execution.

### Stage 0 — Quantum Mechanical Descriptor Computation

This is the foundational quantum stage. For each unique molecular fragment within the submitted ligand, the platform runs VQE with a Unitary Coupled Cluster Singles and Doubles ansatz to find the ground-state electronic wave function. From this wave function it extracts the HOMO energy, LUMO energy, HOMO-LUMO gap, chemical hardness, and per-atom electrostatic potential charges via Mulliken population analysis. The Hamiltonian is built using Jordan-Wigner mapping with Z2 symmetry tapering, which reduces qubit requirements by approximately fifty percent relative to the full representation and makes the computation tractable for drug-fragment sizes of five to fifteen heavy atoms.

Results are memoized in a persistent fragment cache. Each fragment is identified by the SHA-256 hash of its canonical SMILES string, and computed descriptors are stored in MongoDB. If a fragment has been computed in any previous job by any user on the platform, its descriptors are retrieved from the cache rather than recomputed. Common pharmacophoric fragments — benzene rings, amide bonds, carboxylate groups, imidazole rings — accumulate in the cache over time, making the platform progressively faster as usage grows. The fragment cache is one of this platform's genuinely novel contributions: no published system maintains persistent quantum computation state across multiple independent drug discovery runs.

The descriptors produced by this stage propagate through all four downstream stages. Stage 1 uses the HOMO-LUMO gap as an electronic pre-filter. Stage 3 incorporates the full descriptor vector into the VQC input. Stage 4 uses per-atom HOMO contributions to flag metabolic soft spots.

### Stage 1 — Computational Screening

Before any expensive quantum docking computation, the platform applies a classical pre-filter to eliminate candidates that violate established drug-likeness criteria. Lipinski's Rule of Five is enforced: molecular weight must not exceed 500 daltons, the octanol-water partition coefficient must not exceed 5, hydrogen bond donors must not exceed 5, and hydrogen bond acceptors must not exceed 10. Any candidate violating these thresholds is eliminated.

The quantum contribution at this stage is the electronic pre-filter. Candidates with a HOMO-LUMO gap below 3 electron-volts are flagged as electronically reactive — too chemically promiscuous to make selective drugs — and eliminated before docking proceeds. This threshold is derived from the quantum descriptors computed in Stage 0 and constitutes a physically motivated filter that classical virtual screening pipelines cannot apply.

Surviving candidates are ranked by a combined score of Tanimoto fingerprint similarity to known active compounds weighted by their HOMO-LUMO gap. The top-K candidates proceed to docking, with K defaulting to five.

### Stage 2 — QUBO Fragment Docking

This is the primary quantum optimization stage. The ligand is decomposed into rigid chemical substructures using the BRICS fragmentation algorithm. The protein binding pocket is discretized into a three-dimensional grid of candidate placement sites. Classical molecular mechanics using the MMFF94 force field computes the pairwise interaction energy between each fragment and each grid cell — this computation is fast and purely classical.

These interaction energies are encoded into a QUBO Hamiltonian containing four terms. The interaction energy term rewards placing fragments at grid cells with favorable protein contacts. The clash penalty term penalizes configurations where two fragments occupy overlapping or adjacent cells. The bond geometry term softly constrains adjacent fragments to maintain physically realistic covalent bond distances and angles. The single-placement constraint enforces that each fragment appears at exactly one grid cell in any valid solution.

QAOA minimizes this Hamiltonian using two circuit repetition layers, initialized with warm-started parameters from the platform's existing QAOA transfer-learning infrastructure. The optimal binary assignment is decoded back to three-dimensional Cartesian coordinates through inverse grid mapping, yielding the predicted binding pose and its associated energy score.

The QAOA circuit parameters are saved to the job record at the end of this stage. In iterative mode, if a subsequent scaffold hop modifies one or more fragments, the optimization restarts from these saved parameters rather than from a random initialization. This is the mechanism that makes iterative scaffold hopping computationally tractable: each hop is a targeted perturbation of a known good solution, not a full cold-start search.

### Stage 3 — Quantum-ML Binding Score

Each candidate pose is scored using a Variable Quantum Circuit hybrid model. The input representation is a 32-dimensional vector constructed from three sources: sixteen dimensions from principal-component compression of the ligand's Morgan fingerprint, eight dimensions from the protein binding pocket's physicochemical properties including charge distribution, hydrophobicity, pocket volume, and shape complementarity, and eight dimensions from the quantum chemical descriptors computed in Stage 0.

These values are encoded as rotation angles into the VQC, which applies two layers of nearest-neighbour entangling gates with trainable rotation parameters between layers. The expectation value of a single qubit's Pauli-Z measurement is linearly rescaled to produce a binding free energy estimate in kilocalories per mole.

The confidence interval on this estimate is derived from the variance of the full measurement distribution across the shot budget. This variance reflects the breadth of the molecular energy landscape sampled by the quantum circuit and is reported as a 95% confidence interval on every binding free energy result. This constitutes free uncertainty quantification: classical methods require expensive multi-nanosecond molecular dynamics ensembles to produce equivalent uncertainty estimates, while the quantum measurement process provides it as an automatic byproduct of ordinary circuit execution.

### Stage 4 — ADMET Safety Gate

The final stage applies six pharmacokinetic and safety criteria to each candidate. Molecular weight, logP, topological polar surface area, hydrogen bond donors and acceptors, rotatable bond count, and synthetic accessibility score are computed using RDKit. Topological polar surface area must not exceed 140 square Angstroms as a proxy for passive membrane permeability. Rotatable bonds are capped at ten as an oral bioavailability proxy. Synthetic accessibility is evaluated on a 1-to-10 scale with a threshold of 6 to exclude synthetically intractable structures.

Two quantum-informed safety checks supplement these classical criteria. The hERG cardiac toxicity check computes the fingerprint similarity of the candidate to a curated set of known hERG channel blockers; candidates with similarity above 0.4 are flagged. The cytochrome P450 metabolic soft spot check identifies atoms where the HOMO orbital population exceeds a threshold derived from the Stage 0 VQE computation, flagging these as sites vulnerable to oxidative metabolism. Both checks produce atom-level annotations in the result, not just binary pass-fail outcomes.

Candidates passing all six criteria are returned as final lead compounds with their complete ADMET profiles attached.

---

## 4. Single-Pass and Iterative Modes

The two execution modes follow identical five-stage structure. The difference is what happens when Stage 4's ADMET gate rejects all candidates.

In single-pass mode, ADMET failure terminates the job. The result is returned with an empty ranked candidates list and failure reasons documenting which criteria were violated by each candidate. The user must resubmit with a modified ligand.

In iterative mode, ADMET failure triggers scaffold hopping. The platform identifies which fragment of the ligand was responsible for the failing criterion — for example, a fragment with high HOMO contribution on a metabolically exposed atom — and queries a fragment library built from BRICS decomposition of known drug-like molecules for structural alternatives. The replacement fragment is selected using a warm-started QAOA perturbation: the existing QAOA parameters from Stage 2 serve as the initial point, and only the variables associated with the replaced fragment are re-optimized. This makes each scaffold hop significantly cheaper than a full docking run. The modified ligand re-enters the pipeline at Stage 2.

The maximum number of iterations is configurable between one and five. A completed iterative job reports which iteration produced the passing candidates, the SMILES of each intermediate scaffold along the refinement trajectory, and which ADMET criteria caused each rejection.

The user-facing distinction between the two modes is a single checkbox in the submission interface labelled "Enable scaffold refinement."

---

## 5. Backend Architecture

The backend adds a new domain to the application layer, following the same structural pattern as the existing financial, options, and risk job services. Four focused computation modules handle one pipeline stage each. The pipeline orchestrator, called PharmaJobService, coordinates them in sequence and manages the iterative scaffold loop.

PharmaJobService exposes three methods: a synchronous submit method that creates the job record and enqueues background processing, an async process method that executes the five stages and handles scaffold hopping in iterative mode, and a get-job method used for status polling. This matches the interface of FinancialJobService exactly.

A new Postgres table stores each job's durable state. It records the input ligand SMILES, the target identifier, the execution mode, the current and maximum iteration counts, the terminal status, any error message, and the full result payload as a JSON column. The schema follows the same pattern as the existing financial and risk job tables.

The fragment cache lives in MongoDB as a document collection indexed by the SHA-256 hash of each fragment's canonical SMILES string. Every VQE computation writes to this collection, and every computation checks it first. The cache is shared across all users and all jobs, so its value compounds with platform usage. A fragment computed today for one user is available instantly to all future users who submit any molecule containing that fragment.

A new API router at the path prefix /api/v1/pharma/ exposes job submission, status polling, and job history list endpoints.

---

## 6. API Contract

**Job submission** is a multipart form POST that accepts the ligand SMILES string, either a four-letter PDB identifier or an uploaded PDB file (exactly one must be provided), the execution mode, the maximum iteration count for iterative mode, and optional tuning parameters for QAOA circuit depth, VQC shot count, and the number of candidates to carry forward from screening. The response contains the job identifier and the initial QUEUED status. All computation runs asynchronously.

**Job status polling** returns the current status string, the current and maximum iteration counts, the input parameters, and the full result payload once the job reaches a terminal state. The recommended polling interval is two seconds; the client should stop polling when the status reaches COMPLETED or FAILED.

**Status progression** follows a deterministic path: QUEUED advances to QM_DESCRIPTORS, then SCREENING, DOCKING, SCORING, ADMET, and finally COMPLETED or FAILED. In iterative mode with ADMET rejection, the job moves to REFINING — carrying the current iteration number in its metadata — then back to DOCKING for the next scaffold attempt. The frontend displays "Refining — Iteration 2 of 3" during this phase.

**Job history** returns a paginated list of all jobs submitted by the authenticated user, including the ligand SMILES, target identifier, execution mode, submission time, terminal status, and the count of candidates returned.

---

## 7. Frontend Architecture

The pharma feature follows the feature-folder convention used for the finance, options, and risk domains. Submission, polling, and result display are decomposed into focused components under src/features/pharma/. The route structure adds two pages: a main pharma page combining the submission panel and job history table, and a job detail page for viewing completed results.

**Submission panel.** Two tabs handle the two input modes. The first accepts a SMILES string and a target from a curated library of ten clinically significant proteins spanning oncology, neurology, and antivirals — ACE2, acetylcholinesterase, BRAF, KRAS G12C, EGFR, PLK1, hERG, SARS-CoV-2 main protease, ABL1, and CDK2. The second accepts the same SMILES input with a PDB file upload for targets outside the curated library. The iterative mode checkbox and an advanced settings panel are placed below both tabs.

**Result page.** The page is full-width with no maximum-width constraint. It is composed of five visual sections. The pipeline summary strip displays the five stage names in sequence as badges coloured by outcome, with an iteration counter in iterative mode. The ranked candidates table supports sorting by binding free energy, confidence interval width, HOMO-LUMO gap, and ADMET status; expanding any row reveals the full ADMET and QM descriptor breakdown for that candidate. The binding score card visualises the top candidate's estimated binding free energy as a bar with 95% confidence interval error bars and a reference line at negative 7.0 kcal/mol marking the approximate nanomolar-range binding threshold. The quantum descriptor card presents the HOMO and LUMO energy levels as a two-level energy diagram with the gap annotated, alongside an electrostatic potential heatmap on a 2D molecular depiction. The ADMET profile section uses a radar chart across six axes to show how the candidate compares to the Lipinski ideal space, with the hERG risk flag and cytochrome P450 soft spot annotations below.

---

## 8. Data Flow

A user submits a job through the frontend. The request reaches the pharma API router, which validates the input, creates a job record in Postgres with status QUEUED, and enqueues a background task before returning the job identifier.

The background task executes the pipeline. It first attempts to retrieve QM descriptors for each ligand fragment from the MongoDB cache. Cache hits bypass VQE entirely. Cache misses trigger a VQE run with Jordan-Wigner mapping and Z2 symmetry tapering; the resulting descriptors are written to the cache before proceeding. The status updates to QM_DESCRIPTORS during this work.

The screening step at status SCREENING applies Lipinski and the electronic pre-filter and retains the top-K candidates by combined score.

The docking step at status DOCKING decomposes each candidate ligand into fragments, constructs the QUBO Hamiltonian from classical interaction energies and constraint terms, runs QAOA optimization with warm-start initialization, and decodes the optimal bitstring to a three-dimensional binding pose. The QAOA circuit parameters are saved for potential warm-start reuse in iterative mode.

The scoring step at status SCORING constructs the 32-dimensional VQC input vector, runs the circuit with the configured shot budget, and produces the binding free energy estimate and its confidence interval from the measurement distribution.

The ADMET step at status ADMET evaluates all six criteria and annotates each candidate with its full profile. If all candidates pass, the job moves to COMPLETED and the result payload is written to Postgres. If candidates fail in single-pass mode, the job similarly moves to COMPLETED with an empty candidates list and failure reasons.

In iterative mode with ADMET failure, the job moves to REFINING. The scaffold hopper identifies the failing fragment, retrieves replacement alternatives from the fragment library, constructs a modified ligand SMILES, and re-enters the pipeline at DOCKING using the saved warm-start parameters. The iteration counter increments. This cycle repeats until a candidate passes ADMET or the maximum iteration count is exhausted.

The frontend polls the status endpoint every two seconds throughout execution. Each response refreshes the pipeline progress display. When the terminal status is reached, the full result payload is rendered across the five result sections.

---

## 9. Novel Contributions

This section documents capabilities that do not exist in the published literature as of May 2026.

**First end-to-end quantum drug discovery pipeline.** Every published quantum drug discovery system addresses exactly one stage in isolation: QUBO docking (Yanagisawa 2024), QM re-scoring (Al-Ansi 2024), VQC affinity prediction (Choppara 2025), or VQE protein folding (QuPepFold 2026). No published system chains these stages such that the quantum output of one feeds the input of the next. This platform does. The VQE HOMO energies computed in Stage 0 flow into Stage 1 as a pre-filter criterion, into Stage 3 as part of the VQC input vector, and into Stage 4 as the source of metabolic soft spot annotations. The quantum computation is not an isolated demonstration — it is load-bearing across the entire pipeline.

**ADMET-gated iterative QAOA scaffold hopping.** No published paper implements a feedback loop from ADMET failure back to a modified quantum docking run. The iterative mode is the first such system. The warm-start mechanism is critical: reusing QAOA parameters from the previous solution means that scaffold hopping is a targeted perturbation rather than a full cold-start search. This capability is enabled directly by the transfer-learning infrastructure already present in the platform's existing QAOA parameter optimization module, meaning no new algorithmic development is required — only a new data flow connecting ADMET failure to QAOA re-entry.

**Quantum shot noise as free uncertainty quantification.** Published QM re-scoring papers treat shot noise as an error source to be suppressed. This pipeline treats the measurement variance as useful physical information. The spread of the VQC measurement distribution encodes the breadth of the molecular energy landscape sampled by the quantum circuit, and this is reported directly as a 95% confidence interval on every binding free energy estimate. Producing equivalent uncertainty information classically requires multi-nanosecond molecular dynamics ensembles. The quantum measurement process provides it as a natural byproduct of ordinary circuit execution.

**Cross-job fragment descriptor cache.** The MongoDB fragment cache accumulates quantum chemical knowledge across all jobs and all users on the platform. Each unique molecular fragment is computed once and reused indefinitely. Common pharmacophoric substructures appearing across many drug candidates are effectively pre-computed after the first few jobs. The platform's computational cost per job decreases monotonically as the cache grows. No published quantum chemistry paper addresses this because no published system maintains persistent state across multiple independent drug discovery runs.

---

## 10. Scope Boundaries

The following capabilities are explicitly out of scope for this build. They are documented here to prevent scope creep and to mark clearly where V2 development begins.

Distributing the QUBO computation across multiple libp2p peer nodes is architecturally supported by the fragment decomposition structure but not implemented in this version. The QUBO is solved on a single Qiskit statevector simulator.

Selectivity profiling — docking the same ligand against multiple targets simultaneously to assess off-target binding risk — is deferred to V2. The submission API accepts exactly one target per job.

Full quantum chemistry using PySCF or ASE at DFT level with larger basis sets such as B3LYP/6-31G* is deferred to V2. Stage 0 uses a minimal STO-3G basis set approximation, which is appropriate for fragment-level descriptor extraction at the cost of absolute energy accuracy.

Three-dimensional binding pose visualization in the browser is deferred to V2. The result page presents tabular coordinate data and two-dimensional molecular depictions.

Experimental validation integration — ingesting wet-lab IC50 measurements and comparing them to computational predictions — is deferred to V2. This build produces computational predictions only.

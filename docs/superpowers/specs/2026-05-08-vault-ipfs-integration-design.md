# VAULT — IPFS Helia Integration Design Spec

**Date:** 2026-05-08  
**Status:** Approved — ready for implementation  
**Source vision:** `docs/IPFS_INTEGRATION_STRATEGIC_VISION.md`  
**Frontend:** `frontend/` (Next.js 16, Bun, TanStack Query, Better Auth)

---

## 1. Scope & Phase Decision

### Phase 1 (this spec)
| Feature | Status |
|---|---|
| Circuit Library (`/vault/circuits`) | ✅ In scope |
| Workflow Cloning (`/vault/runs`) | ✅ In scope |
| Pinata persistence stub | ✅ In scope (stub only) |
| Settings: VAULT display name | ✅ In scope |

### Deferred (Phase 2+)
| Feature | Status |
|---|---|
| Real-Time Execution Observation (pubsub streaming) | ⏸ Deferred |
| Provenance / Verification CID chains (academic) | ⏸ Deferred |
| Pinata full implementation | ⏸ Deferred (stub ships in Phase 1) |

---

## 2. Architecture

### Core Principle
The backend is **shared/communal** — it handles quantum execution only and is never touched by IPFS.  
The frontend is **per-user property** — every user's browser runs its own Helia IPFS node. Content sharing is purely peer-to-peer, frontend-to-frontend.

### Layer Map

```
┌─────────────────────────────────────────────────────┐
│             User's Browser (per-user property)       │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │         Next.js Frontend (frontend/)          │   │
│  │                                               │   │
│  │  app/(main)/vault/layout.tsx                 │   │
│  │    └── HeliaProvider (lazy, ssr:false)        │   │
│  │          └── Helia node (IndexedDB store)     │   │
│  │                                               │   │
│  │  features/ipfs/                               │   │
│  │    ├── provider.tsx   (HeliaProvider)         │   │
│  │    ├── hooks.ts       (useHelia, upload/fetch)│   │
│  │    ├── types.ts       (CircuitCID, RunCID...) │   │
│  │    ├── schema.ts      (circuit/run IPFS shape)│   │
│  │    └── pinata.ts      (STUB — TODO Phase 2)   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │ P2P (libp2p WebRTC / WebSocket)
         ▼
┌────────────────────────────────────┐
│  Other users' browsers (Helia)     │
│  Public IPFS bootstrap nodes       │
└────────────────────────────────────┘
         │ (no IPFS — quantum execution only)
         ▼
┌────────────────────────────────────┐
│  Backend (shared, communal)        │
│  FastAPI + libp2p quantum layer    │
└────────────────────────────────────┘
```

### Helia Provider Strategy: Approach B (VAULT-Scoped)

`HeliaProvider` wraps **only** the VAULT route group via `app/(main)/vault/layout.tsx`.  
Helia is dynamically imported with `next/dynamic` + `ssr: false` — zero cost to users who never visit VAULT.

The "Share to VAULT" buttons on `/runs/[id]` and `/network/circuits` use a `useIpfsUpload()` hook that lazily imports Helia on first invocation. First-click latency is ~500ms (shown as a spinner). After init, subsequent uploads are instant.

---

## 3. Data Schemas (IPFS Records)

All records are serialised as JSON and stored via Helia UnixFS.

### CircuitIPFSRecord

```ts
interface CircuitIPFSRecord {
  type: "circuit/v1";
  cid?: string;                  // self-referential, filled after upload
  fork_of?: string;              // CID of parent circuit if forked

  meta: {
    name: string;
    description: string;
    tags: string[];              // e.g. ["finance", "QAOA", "portfolio"]
    domain: "finance" | "cryptography" | "chemistry" | "optimization" | "ml" | "other";
    qubit_count: number;
    gate_count: number;
    published_at: string;        // ISO-8601
    author_display_name: string; // from Settings > VAULT Display Name
  };

  circuit: {
    qasm: string;                // OpenQASM 2.0 string
    backend_payload: object;     // raw JSON sent to backend /circuits/submit
  };

  fidelity?: {
    avg_gate_fidelity: number;
    t1_us: number;
    t2_us: number;
  };
}
```

### RunIPFSRecord

```ts
interface RunIPFSRecord {
  type: "run/v1";
  cid?: string;
  fork_of?: string;              // CID of parent run if cloned

  meta: {
    run_id: string;              // original backend run-{uuid}
    published_at: string;
    author_display_name: string;
  };

  circuit_cid?: string;          // CID of associated CircuitIPFSRecord
  circuit_inline?: object;       // inline circuit if not separately published

  execution: {
    peer_count: number;
    fragment_count: number;
    runtime_ms: number;
    status: "COMPLETED" | "FAILED";
    peer_ids: string[];
  };

  results: object;               // backend result payload
}
```

---

## 4. Feature Structure

```
frontend/src/features/ipfs/
├── index.ts                     # barrel: re-exports public API
├── types.ts                     # CircuitIPFSRecord, RunIPFSRecord, VaultItem
├── schema.ts                    # zod schemas for both record types
├── provider.tsx                 # HeliaProvider (dynamic import, IndexedDB blockstore)
├── hooks.ts                     # useHelia(), useIpfsUpload(), useIpfsFetch()
├── lib/
│   ├── helia-init.ts            # createHelia() factory, bootstrap peers
│   ├── local-index.ts           # localStorage index of user's published CIDs
│   └── transformers.ts          # RunIPFSRecord <-> RunDetail, CircuitIPFSRecord <-> CircuitForm
└── pinata.ts                    # STUB — TODO Phase 2
```

### Hook API

```ts
useHelia(): { node: Helia | null; ready: boolean; error: Error | null }
useIpfsUpload(): { upload: (data: unknown) => Promise<string>; uploading: boolean }
useIpfsFetch<T>(cid: string | null): { data: T | null; loading: boolean; error: Error | null }
```

---

## 5. Navigation

### VAULT Rail Item (added to `src/constants/navigation.ts`)

```ts
{
  id: "vault",
  label: "Vault",
  icon: Vault,                   // lucide-react animated on hover
  href: "/vault/circuits",
  hasSidebar: true,
  sidebar: {
    type: "static",
    groups: [
      {
        heading: "Discover",
        links: [
          { label: "Circuit Library", href: "/vault/circuits" },
          { label: "Shared Runs",     href: "/vault/runs" },
        ],
      },
      {
        heading: "My Vault",
        links: [
          { label: "My Circuits", href: "/vault/my/circuits" },
          { label: "My Runs",     href: "/vault/my/runs" },
        ],
      },
    ],
  },
  matchPrefixes: ["/vault"],
}
```

### New Routes (added to `src/constants/routes.ts`)

```ts
VAULT: "/vault",
VAULT_CIRCUITS: "/vault/circuits",
VAULT_RUNS: "/vault/runs",
VAULT_MY_CIRCUITS: "/vault/my/circuits",
VAULT_MY_RUNS: "/vault/my/runs",
vaultRunDetail:     (cid: string) => `/vault/runs/${cid}`     as const,
vaultCircuitDetail: (cid: string) => `/vault/circuits/${cid}` as const,
```

---

## 6. Pages

### Route Tree

```
app/(main)/vault/
├── layout.tsx                   # HeliaProvider wrapper (dynamic import, ssr:false)
├── circuits/
│   ├── page.tsx                 # Circuit Library — search, browse, publish
│   └── [cid]/page.tsx           # Circuit detail — view, load into builder, fork
├── runs/
│   ├── page.tsx                 # Shared Runs — browse community runs
│   └── [cid]/page.tsx           # Run viewer — readonly, Clone & Run CTA (no auth required)
└── my/
    ├── circuits/page.tsx        # My Published Circuits
    └── runs/page.tsx            # My Shared Runs
```

### `/vault/circuits` — Circuit Library

- 3-column grid of circuit cards (`demo-grid-card` token)
- Phase 1: browse is CID-based only (no keyword DHT search — deferred to Phase 2); filter is client-side over fetched records
- Search bar + Domain / Qubits / Sort filters
- Each card: name, author display name, qubit_count, gate_count, domain tag, truncated CID
- Actions per card: `[Load into Builder]` `[Fork]`
- `PageHeader` right slot: `[Publish Circuit ▶]` opens a publish drawer
- Neutral glass cards, no per-card color fills; hover shows gradient wash matching domain icon

### `/vault/runs` — Shared Runs

- Full-width table (no `max-w-*`), rows clickable via `router.push`
- Columns: title, author, qubits, peers, runtime, status, CID
- Hover gradient: orange (matching quantum network accent)
- `[Clone & Run]` action column

### `/vault/runs/[cid]` — Shared Run Viewer (public, no auth for viewing)

- Full-width detail page using shared `GlassCard`, `SectionTitle`, `MetricGrid`, `FieldList`
- Sections: Circuit (QASM readonly) | Execution (peers, fragments, timing) | Results
- Fork provenance badge if `fork_of` present
- `[Clone & Run ▶]` CTA — pushes to `/runs/new` pre-filled with circuit data

### `/vault/my/circuits` and `/vault/my/runs`

- Same table pattern as Shared Runs but filtered to current user's localStorage index
- Additional `[Unpublish]` action (removes from local index; content remains on IPFS network)

---

## 7. Integration Points (Outside VAULT)

### `/runs/[id]` — Run Detail Page

- Add `[Share to VAULT ↑]` to `PageHeader` right slot
- On click: Helia lazy-inits, run packaged into `RunIPFSRecord`, uploaded, CID stored
- After share: button becomes `[✓ In VAULT · Copy link]`
- `VaultBadge` appears in run meta strip: CID (truncated) + link to `/vault/runs/[cid]`

### `/network/circuits` — Circuit Page

- `[Publish to VAULT ↑]` button on circuit detail / builder
- After publish: circuit card shows `🔒 In VAULT` badge with CID link

---

## 8. Settings: VAULT Display Name

**Location:** `Settings > Workspace > General` (existing `/settings` page)

```
VAULT Identity
──────────────
Display name shown on your published circuits and shared runs.
[___________________________]   [Save]
```

- Stored in `localStorage` key `vault:display_name`
- Prefilled from Better Auth session user name on first visit
- Read by `useIpfsUpload()` at publish time

---

## 9. Pinata Stub

```ts
// features/ipfs/pinata.ts — TODO Phase 2
export const PINATA_ENABLED = false;

export const pinToCid = (_cid: string): Promise<void> => {
  throw new Error("Pinata not yet implemented — Phase 2");
};
```

`/settings/integrations` gets a disabled "Pinata" card:
- API key field: disabled, greyed out
- Label: "Coming soon — long-term circuit pinning via Pinata"

---

## 10. Dependencies

```bash
bun add helia @helia/unixfs @helia/interface blockstore-idb
```

Imported **only** inside `features/ipfs/lib/helia-init.ts`. Never at app root.

---

## 11. Error Handling

| Scenario | Behaviour |
|---|---|
| Helia fails to init | Toast: "VAULT unavailable in this browser" · offline banner on VAULT pages |
| IPFS fetch timeout (>10s) | "Content unavailable — the original peer may be offline" message |
| Upload fails | Toast + retry button |
| CID not found | Empty state with CID string + "not found on network" |

---

## 12. Testing Strategy

- Unit: Zod schema validators in `schema.ts`, transformers in `lib/transformers.ts`
- Hook tests: mock `features/ipfs/lib/helia-init` via `vi.mock`
- Playwright smoke: `/vault/circuits` loads with Helia in offline/degraded state
- No E2E P2P tests in Phase 1 (requires two simultaneous browser instances)

---

## 13. Deferred Work (Phase 2+)

- Full Pinata implementation + settings UI
- Real-Time Execution Observation (libp2p pubsub streaming, "Live Executions" feed)
- Provenance CID chains + fork graph viewer
- Multi-tab SharedWorker for Helia persistence across tabs
- DHT keyword search for Circuit Library (Phase 1 fetches by CID only)

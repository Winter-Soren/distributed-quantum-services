# Live Docking Canvas — Implementation Plan

**Spec:** `2026-05-14-live-docking-canvas-design.md`  
**Date:** 2026-05-14

---

## Task 1 — Backend: live state module
**File:** `backend/src/quantum_backend_v2/pharma/live_state.py` (create)

Create a module-level `dict[str, dict]` called `_LIVE_STORE`. Define two Pydantic models:

```python
class ScorePoint(BaseModel):
    iteration: int
    score: float
    ts: str

class LiveJobState(BaseModel):
    job_id: str
    current_stage: str | None = None
    iteration_count: int = 0
    best_smiles: str | None = None
    best_score: float | None = None
    score_history: list[ScorePoint] = []
    admet_passes: int = 0
    elapsed_seconds: float = 0.0
```

Expose three functions:
- `init_live(job_id: str) -> None` — creates a fresh entry in `_LIVE_STORE`
- `update_live(job_id: str, **kwargs) -> None` — merges kwargs into the entry
- `get_live(job_id: str) -> LiveJobState | None` — returns entry as model or None
- `clear_live(job_id: str) -> None` — deletes entry after job reaches terminal state

Verify: module imports cleanly, all four functions work in a Python REPL.

---

## Task 2 — Backend: wire live state into `_run_pharma_pipeline`
**File:** `backend/src/quantum_backend_v2/api/routers/pharma.py` (modify)

Import `init_live`, `update_live`, `clear_live` from `live_state`.

In `_run_pharma_pipeline`:
- Call `init_live(job_id)` before `orch.run()`
- After `orch.run()` succeeds or fails (both branches), call `clear_live(job_id)`

Pass `update_live` into the orchestrator so it can write live state during the run. The cleanest approach: create a `live_callback` closure similar to `_make_log_callback`:

```python
def _make_live_callback(job_id: str, start_time: float):
    def _update(stage=None, smiles=None, score=None, admet_pass=False, iteration=None):
        from quantum_backend_v2.pharma.live_state import update_live, get_live, ScorePoint
        import time
        from datetime import datetime, timezone
        live = get_live(job_id)
        if live is None:
            return
        kwargs = {"elapsed_seconds": time.monotonic() - start_time}
        if stage is not None:
            kwargs["current_stage"] = stage
        if iteration is not None:
            kwargs["iteration_count"] = iteration
        if smiles is not None:
            kwargs["best_smiles"] = smiles
        if score is not None and (live.best_score is None or score < live.best_score):
            kwargs["best_score"] = score
            kwargs["score_history"] = live.score_history + [
                ScorePoint(iteration=live.iteration_count, score=score,
                           ts=datetime.now(timezone.utc).isoformat())
            ]
        if admet_pass:
            kwargs["admet_passes"] = live.admet_passes + 1
        update_live(job_id, **kwargs)
    return _update
```

Pass `live_callback` to `PharmaOrchestrator.__init__` as a new optional `live_callback` parameter.

Verify: `_run_pharma_pipeline` still passes existing tests after this change.

---

## Task 3 — Backend: call live_callback from orchestrator
**File:** `backend/src/quantum_backend_v2/pharma/orchestrator.py` (modify)

Add `live_callback` optional parameter to `__init__`:
```python
live_callback: Callable | None = None
```
Store as `self._live = live_callback or (lambda **kw: None)`.

Add `self._live(...)` calls at the right moments inside `run()` and stage methods:
- `_run_stage_1`: `self._live(stage="filtering")`
- `_run_stage_2`: `self._live(stage="generating")`
- `_run_stages_3_4` (fragmenting start): `self._live(stage="fragmenting")`
- `_run_stages_3_4` (vqe_computing start): `self._live(stage="vqe_computing")`
- `_run_stage_5` (docking): `self._live(stage="docking")`
- `_run_stage_6` (scoring, after `vqc_score` computed): `self._live(stage="scoring", smiles=smiles, score=vqc_score.binding_affinity_kcal)`
- `_run_stage_6` (after `admet_result` computed, if passes): `self._live(admet_pass=True)`
- Inside the iteration loop (after `self._log("iter", ...)`): `self._live(iteration=iteration + 1)`
- `_hopper` refine: `self._live(stage="refining")`

Verify: existing orchestrator unit tests still pass.

---

## Task 4 — Backend: `/live` endpoint
**File:** `backend/src/quantum_backend_v2/api/routers/pharma.py` (modify)

Add new route after the existing `get_pharma_job` route:

```python
@router.get("/jobs/{job_id}/live")
async def get_pharma_job_live(job_id: str) -> LiveJobState:
    state = get_live(job_id)
    if state is None:
        raise HTTPException(status_code=404, detail=f"No live state for job {job_id!r}")
    return state
```

Import `LiveJobState` and `get_live` from `live_state` at the top of the router file.

Verify: `GET /api/v1/pharma/jobs/{id}/live` returns 404 for non-existent job, returns valid JSON for a running job (manual test or new unit test).

---

## Task 5 — Frontend: types
**File:** `frontend/src/features/pharma/types-live.ts` (create)

```ts
export interface ScorePoint {
  iteration: number;
  score: number;
  ts: string;
}

export interface LiveJobState {
  job_id: string;
  current_stage: string | null;
  iteration_count: number;
  best_smiles: string | null;
  best_score: number | null;
  score_history: ScorePoint[];
  admet_passes: number;
  elapsed_seconds: number;
}
```

---

## Task 6 — Frontend: backend URL constant
**File:** `frontend/src/constants/backend.ts` (modify)

Add `LIVE` to the `PHARMA` section:

```ts
PHARMA: {
  SUBMIT: ...,
  LIST: ...,
  JOB: ...,
  CANCEL: ...,
  LIVE: (id: string) => `${BASE_URL}/api/v1/pharma/jobs/${id}/live` as const,
},
```

---

## Task 7 — Frontend: `usePharmaJobLive` hook
**File:** `frontend/src/features/pharma/hooks/use-pharma-job-live.ts` (create)

```ts
export function usePharmaJobLive(jobId: string, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.pharma.live(jobId),
    queryFn: async (): Promise<LiveJobState | null> => {
      const res = await fetch(BACKEND.PHARMA.LIVE(jobId));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch live state");
      return res.json();
    },
    refetchInterval: enabled ? 2000 : false,
    enabled: !!jobId && enabled,
  });
}
```

Also add `live: (id: string) => ["pharma", "live", id]` to `QUERY_KEYS.pharma` in the query keys constants file.

Verify: hook imports cleanly, no TypeScript errors.

---

## Task 8 — Frontend: `PharmaLiveCanvas` component
**File:** `frontend/src/features/pharma/components/pharma-live-canvas.tsx` (create)

This is the largest task. Build the component in three sub-steps:

### 8a — Shell + left panel (protein viewer)
- Full-content-area container, `flex h-full` with no padding
- Thin top bar: job title, status badge, cancel button
- Left half: `ProteinViewer` (loaded via `dynamic`, ssr:false) with `targetPdbId`
- NGL ligand overlay: `useEffect` watching `liveData?.best_smiles` — when it changes, call into an exposed NGL stage ref to load `smiles://<smiles>` with ball+stick representation. Use a ref callback pattern to get the stage handle from `ProteinViewer` (add an `onStageReady` prop to `ProteinViewer` that passes back the NGL Stage instance).
- Stage-change effect: `useEffect` watching `liveData?.current_stage` — calls `stage.autoView(800)` when stage changes.
- Pocket pulse: when `liveData?.best_score` changes (new candidate), briefly set pocket surface opacity 0.18 → 0.45 → 0.18 via a 600ms timeout.

### 8b — Right panel stat strip
- Four `motion.div` cards using `animate` prop from `motion`
- Track previous values with `useRef` to detect changes and trigger `scale: [1, 1.06, 1]` animation
- Stage card uses `STAGE_ICONS` map (import from `pharma-job-detail.tsx` constants — extract them to a shared `pharma-stage-config.ts` file so both components can use them)

### 8c — Right panel chart + candidate strip
- `recharts` `ResponsiveContainer` + `LineChart` fed `liveData?.score_history`
- Y-axis: `domain={['auto', 'auto']}` with a `reversed` prop on the axis (recharts supports this natively)
- `LigandViewer` for best candidate, fed `liveData?.best_smiles`
- Discovered strip: maintain a local `useState<string[]>` of discovered SMILES — append when `liveData?.admet_passes` increases. Map to small `LigandViewer` thumbnails in a horizontally-scrolling `div`. Auto-scroll ref on the container.

Verify: component renders without errors when `liveData` is null (all `—` placeholders).

---

## Task 9 — Frontend: wire into `PharmaJobDetail`
**File:** `frontend/src/features/pharma/components/pharma-job-detail.tsx` (modify)

Import `PharmaLiveCanvas` via `dynamic(..., { ssr: false })` (it contains NGL).

At the top of the `PharmaJobDetail` return, add:

```tsx
if (isRunning) {
  return (
    <PharmaLiveCanvas
      jobId={jobId}
      targetPdbId={job.target_pdb_id}
      mode={job.mode}
      status={job.status}
      onCancel={() => cancelJob()}
      isCancelling={isCancelling}
    />
  );
}
```

The existing result layout below this conditional is unchanged.

Verify: navigating to a running job shows the canvas; after job completes the page switches to the result view.

---

## Task 10 — Frontend: extract shared stage config
**File:** `frontend/src/features/pharma/lib/pharma-stage-config.ts` (create)

Move `STAGE_ICONS`, `STAGE_ORDER`, and `LOG_META` out of `pharma-job-detail.tsx` into this shared file. Update imports in `pharma-job-detail.tsx` and the new `pharma-live-canvas.tsx`.

This avoids duplication and keeps both components using the same stage color/icon map.

Verify: no TypeScript errors in either component after the move.

---

## Execution Order

Tasks 1–4 are backend and independent of frontend. Tasks 5–7 are frontend plumbing with no visual output. Task 8 is the main build. Tasks 9–10 are wiring.

Recommended order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 10 → 8 → 9

Each task has a clear verify step. Do not proceed to the next task until the verify step passes.

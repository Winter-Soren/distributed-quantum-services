# Frontend Dashboard

This directory contains the React dashboard for the distributed quantum services project.
It is the main visual workspace for exploring service topology, submitting circuits, following job progress, inspecting execution plans, and reading the final quantum analysis output.

For the overall repository guide, see [`../README.md`](../README.md).

## What The Dashboard Covers

- coordinator health and uptime
- service discovery snapshot grouped by node
- circuit editing with sample workloads
- job submission, polling, and WebSocket status streaming
- fragment DAG and planner candidate inspection
- result charts for measurements, observables, and fidelity
- Bloch sphere rendering for single-qubit state summaries

## Requirements

- Node.js `20+`
- `npm`

## Run Locally

```bash
npm install
npm run dev
```

The Vite dev server defaults to `http://127.0.0.1:5173`.

### Pointing at a different backend

By default the app targets `http://127.0.0.1:8080`.
Override it like this if needed:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080 npm run dev
```

Behavior notes:

- if `VITE_API_BASE_URL` is set, that value wins
- if the app is served from port `8080`, it can fall back to same-origin HTTP
- otherwise it uses `http://127.0.0.1:8080`

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run typecheck
npm run preview
```

## Backend Endpoints It Uses

The dashboard is built around these backend routes:

- `GET /api/v1/health`
- `GET /api/v1/services`
- `GET /api/v1/metrics/fidelity/{node_id}`
- `POST /api/v1/circuits/submit`
- `GET /api/v1/jobs/{job_id}`
- `GET /api/v1/plans/{plan_id}`
- `WS /api/v1/jobs/{job_id}/ws`

If the backend is not running, the frontend can still render, but the workspace data panels will fail to load.

## Key Files

- [`src/App.tsx`](src/App.tsx): main dashboard layout and interaction flow
- [`src/lib/quantum-api.ts`](src/lib/quantum-api.ts): typed API client and URL resolution
- [`src/lib/quantum-dashboard.ts`](src/lib/quantum-dashboard.ts): formatting helpers, circuit analysis helpers, and DAG shaping
- [`src/components/BlochSphere.tsx`](src/components/BlochSphere.tsx): Bloch sphere visualization using `@qctrl/visualizer`

## Implementation Notes

- The DAG visualization uses `@xyflow/react`.
- Charts are rendered with `recharts`.
- The UI is built on React 19, Vite, Tailwind CSS 4, and the local `ui/` component set.
- Sample circuits such as `SAMPLE_PIPELINE_CIRCUIT` and `QUICK_CHECK_CIRCUIT` live in [`src/lib/quantum-dashboard.ts`](src/lib/quantum-dashboard.ts).

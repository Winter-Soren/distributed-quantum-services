## Learned User Preferences

- Never leave TODOs or placeholders — implement everything completely in one pass; the user explicitly asks "do everything 100%" and "complete the TODOs, don't leave anything for the future."
- Do not hardcode UI theme values or colors in components; all visual parameters must be CSS variables sourced from `frontend-v2/src/app/globals.css` so the design system can be swapped by replacing `DESIGN.md`.
- Always reuse existing shadcn/ui components (e.g. `pagination.tsx`, `table.tsx` with TanStack React Table) rather than writing custom equivalents.
- When migrating frontend code, align every component against `DESIGN.md`; if a new `DESIGN.md` is provided, re-audit all components and sync them.
- Prefer light theme for the frontend; do not switch to dark theme unless explicitly requested.
- When adding an `AUTH_REQUIRED` env variable for development, make it a boolean toggle so auth middleware can be bypassed locally.
- When the user asks to force-merge a branch, hard-reset the target branch to the source branch (not a standard merge) — and remind them to force-push afterward.
- Document all issues and resolutions encountered during EC2/Docker deployment directly in `MANUAL.md`.
- When adding a Makefile, include a docstring/comment describing each command.
- Do not use `dark mode` or `localStorage`-dependent logic in Next.js SSR components; it causes hydration mismatches — use `suppressHydrationWarning` or initialize safely.

## Learned Workspace Facts

- **Primary stack:** backend = Python 3.11 + FastAPI + py-libp2p (Trio) + Qiskit (statevector simulation) + SQLAlchemy (Postgres) + Beanie (MongoDB); frontend = Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui + Zustand + ReactFlow + Recharts.
- **Active directories:** `backend-v2/` (primary backend) and `frontend-v2/` (primary frontend). `backend/` and `frontend/` are legacy reference — do not extend them.
- **Entry point:** `CONTEXT.md` at the repo root is the canonical session context file for all AI agents; read it first in every new session.
- **Config pattern:** All backend config flows through `QB2_*` environment variables into `AppSettings.from_env()` (Pydantic); never hardcode config values.
- **SQLite files** (`*.sqlite3`, `*.sqlite3-shm`, `*.sqlite3-wal`) under `backend-v2/quantum-backend-v2/libp2p/` are gitignored via `**/*.sqlite3*` glob patterns.
- **Deployment:** `docker-compose.yaml` runs `backend-v2` + `frontend-v2` + Caddy. EC2 deployment documented in `MANUAL.md`. Legacy frontend (`frontend/`) is served manually via `pm2` + `serve -s dist` on port 3003, not included in Docker Compose.
- **Quantum backend:** Uses Qiskit `BasicSimulator` for statevector simulation (not real quantum hardware). Quality/fidelity metrics are derived from Qiskit backend instruction properties via `ServiceQualityTracker`.
- **Financial workflow:** A secondary QAOA-based portfolio optimization workflow accepts user-uploaded CSV files; results must appear in the run history page under the sidebar "Financial" section alongside circuit job history.
- **3D network visualization:** Uses `react-force-graph-3d` (React wrapper); do not use `3d-force-graph` directly (that is the HTML-only library).
- **Authors:** Soham Bhoir and Manusheel Gupta (both listed in README BibTeX and `**Author**` line).
- **Branch `legacy`:** A snapshot of the old `main` before the `codex/wire-frontendv2-to-backendv2` force-merge; kept as a reference backup.
- **`frontend-v2` landing route:** `/` redirects to `/dashboard`; there is no standalone landing page.

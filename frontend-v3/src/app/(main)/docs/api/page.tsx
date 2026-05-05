import { Card, CardContent } from "@/components/ui/card";

const ENDPOINTS = [
  { method: "POST", path: "/api/v1/circuits/submit", desc: "Submit a QASM circuit for distributed execution. Returns job_id." },
  { method: "GET", path: "/api/v1/jobs", desc: "List all circuit jobs for the current session." },
  { method: "GET", path: "/api/v1/jobs/:id", desc: "Get job detail, progress, and quantum result." },
  { method: "POST", path: "/api/v1/options/submit", desc: "Submit an options pricing job (European, real options, etc.)." },
  { method: "GET", path: "/api/v1/options/:id", desc: "Get options job status and result." },
  { method: "POST", path: "/api/v1/options/batch", desc: "Upload CSV for batch options pricing." },
  { method: "POST", path: "/api/v1/risk/submit-csv", desc: "Upload portfolio CSV for VaR/CVaR risk analysis." },
  { method: "GET", path: "/api/v1/risk/:id", desc: "Get risk job status and result metrics." },
  { method: "POST", path: "/api/v1/finance/submit", desc: "Submit portfolio for factor analysis and optimization." },
  { method: "GET", path: "/api/v1/finance/:id", desc: "Get finance job status and allocation result." },
  { method: "GET", path: "/api/v1/discovery/topology", desc: "Get network topology — all peers, active/stale counts." },
  { method: "GET", path: "/api/v1/discovery/peers", desc: "List all discovered peers with health and trust tier." },
  { method: "GET", path: "/api/v1/services", desc: "List all registered quantum services with fidelity." },
  { method: "GET", path: "/api/v1/metrics/fidelity/:nodeId", desc: "Get fidelity metrics for a specific node." },
  { method: "GET", path: "/api/v1/health", desc: "Backend health check — status, version, uptime." },
];

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-sky-50 text-sky-700 border-sky-200",
  POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  PATCH: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">API Reference</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Backend API endpoints. Base URL: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_BACKEND_URL</code>
        </p>
      </div>
      <Card className="max-w-3xl border-hairline">
        <CardContent className="pt-4 pb-4">
          <ul className="flex flex-col divide-y divide-hairline">
            {ENDPOINTS.map((ep) => (
              <li key={`${ep.method}-${ep.path}`} className="flex flex-col gap-1.5 py-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${METHOD_COLOR[ep.method] ?? ""}`}>
                    {ep.method}
                  </span>
                  <code className="font-mono text-xs text-foreground">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.desc}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

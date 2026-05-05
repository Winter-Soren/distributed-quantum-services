import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCHEMAS = [
  {
    name: "RunSummary / RunDetail",
    file: "src/features/runs/types.ts",
    fields: ["jobId", "status (queued|compiling|reserving|executing|completed|failed)", "progress.completionRatio", "result.quantumResult.counts", "result.quantumResult.blochVectors"],
  },
  {
    name: "OptionsJobDetail",
    file: "src/features/options/types.ts",
    fields: ["jobId", "optionType (8 variants)", "result.quantumPrice", "result.classicalBsPrice", "result.quantumGreeks (delta|gamma|vega|theta)", "result.confidenceInterval"],
  },
  {
    name: "RiskJob",
    file: "src/features/risk/types.ts",
    fields: ["jobId", "status", "result.var95", "result.cvar95", "result.portfolioItems"],
  },
  {
    name: "NetworkTopology",
    file: "src/features/network/types.ts",
    fields: ["peers[].peerId", "peers[].trustTier", "peers[].healthStatus", "totalPeers", "activePeers", "stalePeers"],
  },
  {
    name: "ServiceNode",
    file: "src/features/network/types.ts",
    fields: ["nodeId", "serviceType", "fidelity", "qubitMin", "qubitMax", "availability"],
  },
];

export default function SchemasPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Schemas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Core TypeScript types and data shapes for all platform models.
        </p>
      </div>
      <div className="flex max-w-3xl flex-col gap-4">
        {SCHEMAS.map((s) => (
          <Card key={s.name} className="border-hairline">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
              <p className="font-mono text-[11px] text-muted-foreground">{s.file}</p>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="flex flex-col gap-1">
                {s.fields.map((f) => (
                  <li key={f} className="font-mono text-xs text-muted-foreground">
                    · {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

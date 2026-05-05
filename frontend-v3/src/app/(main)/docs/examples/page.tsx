import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EXAMPLES = [
  {
    title: "Submit a QASM circuit",
    language: "typescript",
    code: `// POST /api/runs
const res = await fetch("/api/runs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    circuit: \`OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0],q[1];
measure q -> c;\`
  }),
});
const { job_id } = await res.json();`,
  },
  {
    title: "Price a European call option",
    language: "typescript",
    code: `// POST /api/options
const res = await fetch("/api/options", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    option_type: "european_call_long",
    current_value: 100,
    strike_or_cost: 105,
    time_to_expiry: 1,
    volatility: 0.2,
    risk_free_rate: 0.05,
  }),
});
const { job_id } = await res.json();
// Poll GET /api/options/:job_id every 2s until status === "completed"`,
  },
  {
    title: "Upload a risk portfolio CSV",
    language: "typescript",
    code: `// CSV format: ticker,weight,value
// AAPL,0.4,40000
// GOOGL,0.3,30000
// MSFT,0.3,30000

const formData = new FormData();
formData.append("file", csvFile);

const res = await fetch("/api/risk", {
  method: "POST",
  body: formData,
});
const { job_id } = await res.json();`,
  },
];

export default function ExamplesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Examples</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Code snippets for common platform operations.
        </p>
      </div>
      <div className="flex max-w-3xl flex-col gap-6">
        {EXAMPLES.map((ex) => (
          <Card key={ex.title} className="border-hairline">
            <CardHeader className="pb-2 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{ex.title}</CardTitle>
                <Badge variant="outline" className="font-mono text-[10px]">{ex.language}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-5">
              <pre className="overflow-x-auto rounded-lg bg-surface-soft p-4 font-mono text-xs leading-relaxed text-foreground">
                <code>{ex.code}</code>
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

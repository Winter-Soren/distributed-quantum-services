import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAYBOOKS = [
  {
    title: "Run a quantum circuit end-to-end",
    steps: [
      "1. Navigate to Lab → Runs → New Run",
      "2. Paste your QASM 2.0 circuit into the textarea",
      "3. Click Submit — a job ID is returned and polling begins",
      "4. Watch the status badge: queued → compiling → reserving → executing → completed",
      "5. On completion, check Overview tab for metrics, Quantum State tab for Bloch vectors",
    ],
  },
  {
    title: "Price options using quantum Monte Carlo",
    steps: [
      "1. Navigate to Lab → Options",
      "2. Select option type (e.g., european_call_long)",
      "3. Fill in: current value, strike/cost, time to expiry, volatility, risk-free rate",
      "4. Submit — poll until completed",
      "5. Review: quantum price vs. Black-Scholes, Greeks comparison, confidence interval",
    ],
  },
  {
    title: "Run a portfolio risk analysis",
    steps: [
      "1. Prepare CSV: columns ticker, weight, value (one row per asset)",
      "2. Navigate to Lab → Risk",
      "3. Drag and drop or click to upload the CSV",
      "4. Poll until completed",
      "5. Review VaR 95%, CVaR 95%, and per-asset breakdown",
    ],
  },
  {
    title: "Inspect network health",
    steps: [
      "1. Navigate to Network → Topology for a live peer count",
      "2. Check Network → Nodes for individual peer health and trust tier",
      "3. Check Network → Services for registered quantum services and fidelity",
      "4. Navigate to Network → Fidelity, select a node, view fidelity metrics",
    ],
  },
];

export default function PlaybooksPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Playbooks</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Step-by-step operational guides for common tasks.
        </p>
      </div>
      <div className="flex max-w-3xl flex-col gap-4">
        {PLAYBOOKS.map((pb) => (
          <Card key={pb.title} className="border-hairline">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium">{pb.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <ul className="flex flex-col gap-1.5">
                {pb.steps.map((step) => (
                  <li key={step} className="text-sm text-muted-foreground">{step}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

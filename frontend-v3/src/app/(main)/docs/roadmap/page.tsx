import { Badge } from "@/components/ui/badge";

const MILESTONES = [
  { id: "M0", label: "Architecture & Agent Guidance", status: "done" },
  { id: "M1", label: "Project Scaffolding & Tooling", status: "done" },
  { id: "M2", label: "Auth Feature (Email OTP, Better Auth)", status: "done" },
  { id: "M3", label: "Shared Layout & Navigation (config-driven rail + sidebar)", status: "done" },
  { id: "M4", label: "Dashboard Feature (KPI cards, health, activity feed)", status: "done" },
  { id: "M5", label: "Runs Feature (circuit submission, polling, detail tabs)", status: "done" },
  { id: "M6", label: "Options Pricing (quantum Monte Carlo, batch CSV)", status: "done" },
  { id: "M7", label: "Risk Analysis (VaR/CVaR, portfolio CSV upload)", status: "done" },
  { id: "M8", label: "Financial Feature (portfolio optimization)", status: "done" },
  { id: "M9", label: "Quantum Visualizations (Bloch sphere, visual circuit builder)", status: "upcoming" },
  { id: "M10", label: "Network Feature (topology, nodes, services, fidelity)", status: "done" },
  { id: "M11", label: "Docs & Settings Features", status: "done" },
  { id: "M12", label: "Performance Audit & Bundle Optimization", status: "upcoming" },
  { id: "M13", label: "E2E Verification", status: "upcoming" },
  { id: "H2", label: "Autonomous Labs — agent conversation workspace (ChatGPT-style for researchers)", status: "planned" },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  done: "default",
  upcoming: "secondary",
  planned: "outline",
};

export default function RoadmapPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Roadmap</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Migration milestones and upcoming features.
        </p>
      </div>
      <ol className="max-w-2xl flex flex-col gap-0">
        {MILESTONES.map((m, i) => (
          <li key={m.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${m.status === "done" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {m.status === "done" ? "✓" : i + 1}
              </div>
              {i < MILESTONES.length - 1 && <div className="mt-1 w-px flex-1 bg-hairline" />}
            </div>
            <div className="pb-6 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{m.id}</span>
                <Badge variant={STATUS_VARIANT[m.status]} className="text-[10px]">
                  {m.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-foreground">{m.label}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

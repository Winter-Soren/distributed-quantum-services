"use client";
import { ShieldAlert, Cpu, Zap, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  GlassCard,
  SectionTitle,
  JobMetaStrip,
  MetricGrid,
  DataTable,
  type MetricItem,
  type DataTableColumn,
} from "@/shared/components/detail";
import type { RiskJobDetail } from "../types";

interface RiskResultDashboardProps {
  job: RiskJobDetail;
  className?: string;
}

function fmt(n: number, d = 4) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

type VarRow = { confidenceLevel: number; quantumVar: number; classicalMcVar: number; deviationPct: number; quantumCi: [number, number] };

const varCols: DataTableColumn<VarRow>[] = [
  {
    key: "confidenceLevel",
    header: "Confidence",
    align: "left",
    render: (r) => <span className="text-white/70">{(r.confidenceLevel * 100).toFixed(0)}%</span>,
  },
  { key: "quantumVar", header: "Quantum VaR", align: "right", accent: true, accentClass: "text-rose-300", render: (r) => fmt(r.quantumVar) },
  { key: "classicalMcVar", header: "Classical MC VaR", align: "right", render: (r) => fmt(r.classicalMcVar) },
  { key: "deviationPct", header: "Deviation", align: "right", render: (r) => `${r.deviationPct.toFixed(2)}%` },
  {
    key: "quantumCi",
    header: "Quantum CI",
    align: "right",
    render: (r) => (
      <span className="text-[11px] text-white/30">[{fmt(r.quantumCi[0], 2)}, {fmt(r.quantumCi[1], 2)}]</span>
    ),
  },
];

export function RiskResultDashboard({ job, className }: RiskResultDashboardProps) {
  const r = job.result;

  if (!r) {
    return (
      <GlassCard className={cn(job.status === "failed" ? "ring-red-500/20" : "", className)}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge>
          <Badge variant="outline" className="border-white/10 text-white/40">{job.riskModel}</Badge>
          <span className="font-mono text-[11px] text-white/30">{job.jobId}</span>
        </div>
        <p className="text-sm text-white/50">
          {job.status === "failed" ? `Failed: ${job.error ?? "Unknown error"}` : "Analysis in progress…"}
        </p>
      </GlassCard>
    );
  }

  const riskMetrics: MetricItem[] = [
    { label: "Quantum CVaR 99%", value: fmt(r.quantumCvar99), accent: true },
    { label: "Classical CVaR 99%", value: fmt(r.classicalMcCvar99) },
    { label: "Expected Loss", value: fmt(r.expectedLoss) },
    { label: "Economic Capital", value: r.economicCapital !== null ? fmt(r.economicCapital) : "—" },
  ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <JobMetaStrip
        jobId={job.jobId}
        status={job.status}
        createdAt={job.createdAt}
        extraBadges={[
          { label: job.riskModel, className: "border-rose-500/30 bg-rose-500/10 text-rose-400" },
        ]}
        rightContent={<span className="text-[11px] text-white/30">{job.portfolioSize} assets</span>}
      />

      <GlassCard>
        <SectionTitle
          icon={ShieldAlert}
          title="Risk Metrics"
          accentColor="rose"
          badge={
            <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-400 ring-1 ring-rose-500/20">
              {r.quadraticSpeedupFactor.toFixed(1)}× Speedup
            </span>
          }
        />
        <MetricGrid metrics={riskMetrics} accentClass="text-rose-300" />
      </GlassCard>

      {r.varResults.length > 0 && (
        <GlassCard>
          <SectionTitle icon={BarChart3} title="VaR by Confidence Level" accentColor="rose" />
          <DataTable
            rows={r.varResults as VarRow[]}
            columns={varCols}
            accentClass="text-rose-300"
            getRowKey={(r) => String(r.confidenceLevel)}
          />
        </GlassCard>
      )}

      <GlassCard>
        <SectionTitle icon={Cpu} title="Circuit Info" accentColor="rose" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Portfolio Size", value: job.portfolioSize },
            { label: "Qubits", value: r.numQubits },
            { label: "Circuit Depth", value: r.circuitDepth },
            { label: "Duration", value: `${r.analysisDurationMs}ms` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[11px] text-white/35">{label}</p>
              <p className="tabular-nums text-sm text-white/70">{value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {r.tickers.length > 0 && (
        <GlassCard>
          <SectionTitle icon={Zap} title="Portfolio Holdings" accentColor="rose" />
          <div className="flex flex-wrap gap-2">
            {r.tickers.map((ticker, i) => (
              <div key={ticker} className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/6">
                <span className="text-xs font-medium text-white/70">{ticker}</span>
                <span className="text-[10px] text-white/30">{(r.weights[i] * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

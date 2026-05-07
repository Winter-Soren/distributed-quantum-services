"use client";
import { TrendingUp, Cpu, Zap } from "lucide-react";
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
import type { OptionsJobDetail } from "../types";

interface OptionsResultCardProps {
  job: OptionsJobDetail;
  className?: string;
}

function fmt(n: number, decimals = 4) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

type GreekRow = { greek: string; quantum: string; classical: string };

const greekCols: DataTableColumn<GreekRow>[] = [
  { key: "greek", header: "Greek", align: "left", render: (r) => <span className="font-medium text-white/70">{r.greek}</span> },
  { key: "quantum", header: "Quantum", align: "right", accent: true, accentClass: "text-amber-300" },
  { key: "classical", header: "Classical BS", align: "right" },
];

export function OptionsResultCard({ job, className }: OptionsResultCardProps) {
  const r = job.result;

  if (!r) {
    return (
      <GlassCard className={cn("ring-red-500/20", className)}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge>
          <span className="font-mono text-[11px] text-white/30">{job.jobId}</span>
        </div>
        <p className="text-sm text-white/50">
          {job.status === "failed" ? `Failed: ${job.error ?? "Unknown error"}` : "Analysis in progress…"}
        </p>
      </GlassCard>
    );
  }

  const pricingMetrics: MetricItem[] = [
    { label: "Quantum Price", value: fmt(r.quantumPrice, 4), accent: true },
    { label: "Classical BS", value: fmt(r.classicalBsPrice, 4) },
    { label: "Price Difference", value: pct(r.priceDifferencePct / 100) },
    {
      label: "Confidence Interval",
      value: (
        <span className="text-sm tabular-nums text-white/70">
          [{fmt(r.confidenceInterval[0], 4)}, {fmt(r.confidenceInterval[1], 4)}]
        </span>
      ),
    },
  ];

  const circuitMetrics: MetricItem[] = [
    { label: "Qubits", value: r.numQubits },
    { label: "Circuit Depth", value: r.circuitDepth },
    { label: "Duration", value: `${r.analysisDurationMs}ms` },
    { label: "Moneyness Ratio", value: fmt(r.moneynessRatio, 4) },
  ];

  const greekRows: GreekRow[] = (["delta", "gamma", "vega", "theta"] as const).map((g) => ({
    greek: g.charAt(0).toUpperCase() + g.slice(1),
    quantum: fmt(r.quantumGreeks[g]),
    classical: fmt(r.classicalGreeks[g]),
  }));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <JobMetaStrip
        jobId={job.jobId}
        status={job.status}
        createdAt={job.createdAt}
        extraBadges={[
          { label: job.optionType, className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
          { label: r.moneyness, className: "border-white/10 text-white/40" },
          ...(r.divergenceWarning ? [{ label: "Divergence Warning", className: "border-red-500/30 bg-red-500/10 text-red-400" }] : []),
        ]}
      />

      <GlassCard>
        <SectionTitle icon={TrendingUp} title="Pricing Result" accentColor="amber" />
        <MetricGrid metrics={pricingMetrics} accentClass="text-amber-300" />
      </GlassCard>

      <GlassCard>
        <SectionTitle
          icon={Zap}
          title="Greeks"
          accentColor="amber"
          badge={
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/20">
              {r.quadraticSpeedupFactor.toFixed(1)}× Quantum Speedup
            </span>
          }
        />
        <DataTable
          rows={greekRows}
          columns={greekCols}
          accentClass="text-amber-300"
          getRowKey={(r) => r.greek}
        />
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={Cpu} title="Quantum Circuit" accentColor="amber" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {circuitMetrics.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[11px] text-white/35">{label}</p>
              <p className="tabular-nums text-sm text-white/70">{value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

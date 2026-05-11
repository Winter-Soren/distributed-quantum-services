"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import {
  Loader2,
  FlaskConical,
  Filter,
  Atom,
  Zap,
  Anchor,
  Star,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Info,
  Dna,
  ChevronRight,
  Terminal,
  Activity,
  Ban,
} from "lucide-react";
import { usePharmaJob } from "@/features/pharma/hooks/use-pharma-job";
import { useCancelPharma } from "@/features/pharma/hooks/use-cancel-pharma";
import { CandidateCard } from "./candidate-card";
import { PageHeader } from "@/shared/components/layout/page-header";
import type { PipelineLogEntry, PipelineLogLevel } from "../types";
import { LigandViewer } from "./ligand-viewer";

// NGL uses window + WebGL — must be client-only, no SSR
const ProteinViewer = dynamic(
  () => import("./protein-viewer").then((m) => ({ default: m.ProteinViewer })),
  { ssr: false },
);

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  queued: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  running: "text-sky-400 bg-sky-400/10 border-sky-400/25",
  completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  failed: "text-red-400 bg-red-400/10 border-red-400/25",
  cancelled: "text-white/30 bg-white/5 border-white/10",
};

// ── Log-level visual config ───────────────────────────────────────────────────

type LogMeta = {
  icon: typeof Atom;
  color: string;
  bg: string;
  label: string;
};

const LOG_META: Record<PipelineLogLevel, LogMeta> = {
  stage: {
    icon: ChevronRight,
    color: "text-sky-300",
    bg: "bg-sky-400/8",
    label: "STAGE",
  },
  iter: {
    icon: RefreshCcw,
    color: "text-violet-300",
    bg: "bg-violet-400/8",
    label: "ITER",
  },
  vqe: {
    icon: Atom,
    color: "text-amber-300",
    bg: "bg-amber-400/8",
    label: "VQE",
  },
  score: {
    icon: Star,
    color: "text-emerald-300",
    bg: "bg-emerald-400/8",
    label: "SCORE",
  },
  admet: {
    icon: Filter,
    color: "text-teal-300",
    bg: "bg-teal-400/8",
    label: "ADMET",
  },
  refine: {
    icon: Dna,
    color: "text-fuchsia-300",
    bg: "bg-fuchsia-400/8",
    label: "HOP",
  },
  success: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    label: "DONE",
  },
  error: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/8",
    label: "ERR",
  },
  info: {
    icon: Info,
    color: "text-white/40",
    bg: "bg-white/5",
    label: "INFO",
  },
};

// ── Stage-to-icon mapping for the stage strip ─────────────────────────────────

const STAGE_ICONS: Record<string, { icon: typeof Atom; label: string; color: string }> = {
  init:          { icon: FlaskConical, label: "Init",      color: "text-white/40" },
  filtering:     { icon: Filter,       label: "Lipinski",  color: "text-sky-300" },
  generating:    { icon: Dna,          label: "QWGAN",     color: "text-violet-300" },
  fragmenting:   { icon: Anchor,       label: "Fragments", color: "text-amber-300" },
  vqe_computing: { icon: Atom,         label: "VQE",       color: "text-amber-300" },
  docking:       { icon: Zap,          label: "QAOA",      color: "text-rose-300" },
  scoring:       { icon: Star,         label: "VQC+ADMET", color: "text-emerald-300" },
  refining:      { icon: RefreshCcw,   label: "Scaffold",  color: "text-fuchsia-300" },
  iteration:     { icon: Activity,     label: "Iteration", color: "text-violet-300" },
  completed:     { icon: CheckCircle2, label: "Done",      color: "text-emerald-400" },
  failed:        { icon: XCircle,      label: "Failed",    color: "text-red-400" },
};

const STAGE_ORDER = [
  "init", "filtering", "generating", "fragmenting",
  "vqe_computing", "docking", "scoring", "refining", "completed",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function LogLine({ entry }: { entry: PipelineLogEntry }) {
  const meta = LOG_META[entry.level] ?? LOG_META.info;
  const Icon = meta.icon;
  const time = new Date(entry.ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className={`flex items-start gap-2.5 rounded-md px-3 py-1.5 ${meta.bg}`}>
      <span className="mt-px shrink-0 font-mono text-[10px] text-white/20">{time}</span>
      <span
        className={`mt-px flex h-4 w-[42px] shrink-0 items-center justify-center rounded text-[9px] font-bold uppercase tracking-wider ${meta.color} bg-white/5`}
      >
        {meta.label}
      </span>
      <Icon size={12} className={`mt-0.5 shrink-0 ${meta.color} opacity-70`} />
      <span className={`font-mono text-[11px] leading-relaxed ${meta.color}`}>
        {entry.message}
      </span>
    </div>
  );
}

function StageStrip({ logLines }: { logLines: PipelineLogEntry[] }) {
  const seenStages = new Set(logLines.map((l) => l.stage).filter(Boolean));
  const lastStage = logLines.length > 0 ? logLines[logLines.length - 1].stage : null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGE_ORDER.map((stage, idx) => {
        const meta = STAGE_ICONS[stage];
        if (!meta) return null;
        const Icon = meta.icon;
        const done = seenStages.has(stage);
        const active = lastStage === stage;
        return (
          <div key={stage} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all ${
                active
                  ? `${meta.color} bg-white/8 ring-1 ring-current/30`
                  : done
                  ? `${meta.color} opacity-50`
                  : "text-white/15"
              }`}
            >
              {active && <Loader2 size={9} className="animate-spin" />}
              <Icon size={10} />
              <span className="text-[10px] font-medium">{meta.label}</span>
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <div className={`h-px w-3 ${done ? "bg-white/20" : "bg-white/6"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PharmaJobDetail({ jobId }: { jobId: string }) {
  const { data: job, isLoading, error } = usePharmaJob(jobId);
  const { mutate: cancelJob, isPending: isCancelling } = useCancelPharma(jobId);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the console to the bottom whenever new lines arrive
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [job?.log_lines?.length]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={22} className="animate-spin text-white/20" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : "Job not found"}
        </p>
      </div>
    );
  }

  const isRunning = job.status === "queued" || job.status === "running";
  const logLines = job.log_lines ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        icon={FlaskConical}
        label="Pharma"
        title={`${job.target_pdb_id} — ${job.mode.charAt(0).toUpperCase() + job.mode.slice(1)}`}
        description={jobId}
        glow="emerald"
      />

      <div className="flex flex-1 flex-col gap-5 p-6">
        {/* ── Status strip ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-white/6 bg-white/[0.025] px-5 py-4">
          <div>
            <p className="mb-1 text-[11px] text-white/30">Status</p>
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                STATUS_COLORS[job.status] ?? "text-white/50",
              ].join(" ")}
            >
              {isRunning && <Loader2 size={10} className="animate-spin" />}
              <span className="capitalize">{job.status}</span>
            </span>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-white/30">Target</p>
            <p className="font-mono text-sm text-white/80">{job.target_pdb_id}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-white/30">Mode</p>
            <p className="text-sm capitalize text-white/60">{job.mode}</p>
          </div>
          {job.result && (
            <>
              <div>
                <p className="mb-1 text-[11px] text-white/30">Candidates</p>
                <p className="text-sm text-white/70">{job.result.candidates.length}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-white/30">Runtime</p>
                <p className="text-sm text-white/70">{job.result.total_runtime_seconds.toFixed(1)}s</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-white/30">Cache Hits</p>
                <p className="text-sm text-white/70">
                  {(job.result.cache_hit_rate * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-white/30">Iterations</p>
                <p className="text-sm text-white/70">{job.result.iterations_used}</p>
              </div>
            </>
          )}
          {job.completed_at && (
            <div className="ml-auto">
              <p className="mb-1 text-[11px] text-white/30">Completed</p>
              <p className="text-[11px] text-white/30">
                {new Date(job.completed_at).toLocaleString()}
              </p>
            </div>
          )}
          {isRunning && (
            <div className="ml-auto">
              <button
                onClick={() => cancelJob()}
                disabled={isCancelling}
                className="flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-400/8 px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Ban size={11} />
                )}
                {isCancelling ? "Cancelling…" : "Cancel Job"}
              </button>
            </div>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {job.error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-4">
            <p className="font-mono text-sm text-red-400">{job.error}</p>
          </div>
        )}

        {/* ── Pipeline Console ────────────────────────────────────────────── */}
        {logLines.length > 0 || isRunning ? (
          <div className="flex flex-col overflow-hidden rounded-xl border border-white/6 bg-[#0d0d12]">
            {/* Console header */}
            <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-2.5">
              <Terminal size={12} className="text-emerald-400/60" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/25">
                Pipeline Console
              </span>
              {isRunning && (
                <span className="ml-2 flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-400">
                  <Loader2 size={9} className="animate-spin" />
                  live
                </span>
              )}
              <span className="ml-auto text-[10px] text-white/20">
                {logLines.length} event{logLines.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Stage progress strip */}
            {logLines.length > 0 && (
              <div className="border-b border-white/5 px-4 py-2">
                <StageStrip logLines={logLines} />
              </div>
            )}

            {/* Log lines */}
            <div
              ref={consoleRef}
              className="flex max-h-[520px] flex-col gap-0.5 overflow-y-auto p-3 font-mono"
            >
              {logLines.length === 0 && isRunning ? (
                <div className="flex items-center gap-2 px-2 py-3 text-[11px] text-white/20">
                  <Loader2 size={11} className="animate-spin" />
                  Waiting for pipeline to start…
                </div>
              ) : (
                logLines.map((entry, i) => <LogLine key={i} entry={entry} />)
              )}
            </div>
          </div>
        ) : null}

        {/* ── Candidates ──────────────────────────────────────────────────── */}
        {job.result && job.result.candidates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star size={13} className="text-emerald-400/60" />
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Top Candidates ({job.result.candidates.length})
              </h2>
            </div>
            {job.result.candidates.map((c) => (
              <CandidateCard key={c.rank} candidate={c} />
            ))}
          </div>
        )}

        {isRunning && (
          <p className="flex items-center gap-2 text-[12px] text-white/25">
            <Loader2 size={12} className="animate-spin" />
            Auto-refreshing every 3 s
          </p>
        )}
      </div>
    </div>
  );
}

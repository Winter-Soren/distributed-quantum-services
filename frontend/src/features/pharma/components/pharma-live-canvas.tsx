"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Ban,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Star,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { usePharmaJobLive } from "../hooks/use-pharma-job-live";
import { LigandViewer } from "./ligand-viewer";
import { CandidateCard } from "./candidate-card";
import { STAGE_ICONS } from "../lib/pharma-stage-config";
import type { PharmaJob, PipelineLogEntry, PipelineLogLevel } from "../types";
import type { ScorePoint } from "../types-live";

// NGL viewer — SSR-guarded
const ProteinViewer = dynamic(
  () => import("./protein-viewer").then((m) => ({ default: m.ProteinViewer })),
  { ssr: false },
);

const STATUS_COLORS: Record<string, string> = {
  queued:    "text-amber-400 bg-amber-400/10 border-amber-400/25",
  running:   "text-sky-400 bg-sky-400/10 border-sky-400/25",
  completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  failed:    "text-red-400 bg-red-400/10 border-red-400/25",
  cancelled: "text-white/30 bg-white/5 border-white/10",
};

// Quantum-internal levels — excluded from biology metrics derivation
const QUANTUM_LEVELS = new Set<PipelineLogLevel>(["vqe"]);

interface Props {
  job: PharmaJob;
  onCancel: () => void;
  isCancelling: boolean;
}

// ── Derive live metrics from log_lines when /live endpoint returns null ───────

interface DerivedMetrics {
  currentStage: string | null;
  iterCount: number;
  bestScore: number | null;
  bestSmiles: string | null;
  scoreHistory: ScorePoint[];
  admetPasses: number;
}

function deriveMetricsFromLogs(logLines: PipelineLogEntry[]): DerivedMetrics {
  let currentStage: string | null = null;
  let iterCount = 0;
  let bestScore: number | null = null;
  let bestSmiles: string | null = null;
  const scoreHistory: ScorePoint[] = [];
  let admetPasses = 0;

  for (const line of logLines) {
    if (QUANTUM_LEVELS.has(line.level)) continue;
    if (line.stage) currentStage = line.stage;
    if (line.level === "iter") iterCount++;
    if (line.level === "score") {
      const m = line.message.match(/([-\d.]+)\s*kcal/);
      if (m) {
        const v = parseFloat(m[1]);
        if (bestScore === null || v < bestScore) {
          bestScore = v;
          scoreHistory.push({ iteration: iterCount, score: v, ts: line.ts });
        }
      }
    }
    if (line.level === "admet" && line.message.toLowerCase().includes("pass")) {
      admetPasses++;
    }
  }

  return { currentStage, iterCount, bestScore, bestSmiles, scoreHistory, admetPasses };
}

// ── Animated stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col px-5 py-3"
    >
      <p className="mb-1 text-[10px] uppercase tracking-wider text-white/25">{label}</p>
      <p className={`text-[15px] font-semibold ${color}`}>{value}</p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PharmaLiveCanvas({ job, onCancel, isCancelling }: Props) {
  const { job_id: jobId, target_pdb_id: targetPdbId, mode, status } = job;
  const isRunning = status === "queued" || status === "running";
  const isCompleted = status === "completed";

  const { data: liveData } = usePharmaJobLive(jobId, isRunning);

  // Derive fallback metrics from log_lines (used when /live returns null OR when completed)
  const logLines = job.log_lines ?? [];
  const derived = deriveMetricsFromLogs(logLines);

  // Final best smiles: prefer result candidate, then live data, then derived
  const finalSmiles =
    (isCompleted && job.result?.candidates[0]?.smiles) ||
    liveData?.best_smiles ||
    null;

  // Effective metrics — live endpoint takes priority, log_lines fallback otherwise
  const effectiveStage     = liveData?.current_stage   ?? derived.currentStage;
  const effectiveIter      = liveData?.iteration_count ?? derived.iterCount;
  const effectiveScore     = isCompleted
    ? (job.result?.candidates[0]?.vqc_score?.binding_affinity_kcal ?? liveData?.best_score ?? derived.bestScore)
    : (liveData?.best_score ?? derived.bestScore);
  const effectiveAdmet     = liveData?.admet_passes ?? derived.admetPasses;
  const effectiveHistory   = (liveData?.score_history && liveData.score_history.length > 0)
    ? liveData.score_history
    : derived.scoreHistory;
  const effectiveSmiles    = finalSmiles ?? liveData?.best_smiles ?? null;

  // NGL stage handle
  const stageRef = useRef<any>(null);
  const prevSmilesRef = useRef<string | null>(null);
  const prevScoreRef  = useRef<number | null>(null);
  const prevStageRef  = useRef<string | null>(null);

  // Discovered SMILES strip
  const [discoveredSmiles, setDiscoveredSmiles] = useState<string[]>([]);
  const discoveredScrollRef = useRef<HTMLDivElement>(null);

  // Load / swap ligand in NGL when smiles changes
  useEffect(() => {
    const stage = stageRef.current;
    const smiles = effectiveSmiles;
    if (!stage || !smiles || smiles === prevSmilesRef.current) return;
    prevSmilesRef.current = smiles;

    stage.compList
      .filter((c: any) => c.name === "live-ligand")
      .forEach((c: any) => stage.removeComponent(c));

    stage
      .loadFile(`smiles://${smiles}`, { name: "live-ligand" })
      .then((comp: any) => {
        if (!comp) return;
        comp.addRepresentation("ball+stick", { colorScheme: "element", quality: "high" });
        comp.autoView(400);
      })
      .catch(() => {});
  }, [effectiveSmiles]);

  // Pocket pulse on new best score
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || effectiveScore === null || effectiveScore === prevScoreRef.current) return;
    prevScoreRef.current = effectiveScore;
    stage.compList.forEach((comp: any) => {
      comp.reprList
        .filter((r: any) => r.type === "surface")
        .forEach((r: any) => {
          r.setParameters({ opacity: 0.45 });
          setTimeout(() => r.setParameters({ opacity: 0.18 }), 600);
        });
    });
  }, [effectiveScore]);

  // Camera refocus on stage change
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !effectiveStage || effectiveStage === prevStageRef.current) return;
    prevStageRef.current = effectiveStage;
    stage.autoView(800);
  }, [effectiveStage]);

  // Accumulate discovered SMILES (ADMET passes)
  useEffect(() => {
    const smiles = effectiveSmiles;
    if (!smiles || effectiveAdmet === 0) return;
    setDiscoveredSmiles((prev) => {
      if (prev.includes(smiles)) return prev;
      return [...prev, smiles].slice(-20);
    });
  }, [effectiveAdmet, effectiveSmiles]);

  // On completion, also add the final candidates' smiles to discovered strip
  useEffect(() => {
    if (!isCompleted || !job.result) return;
    setDiscoveredSmiles((prev) => {
      const newEntries = job.result!.candidates
        .map((c) => c.smiles)
        .filter((s) => !prev.includes(s));
      return [...prev, ...newEntries].slice(-20);
    });
  }, [isCompleted, job.result]);

  useEffect(() => {
    const el = discoveredScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [discoveredSmiles.length]);

  const stageMeta = effectiveStage ? STAGE_ICONS[effectiveStage] : null;
  const ActiveStageIcon = isCompleted ? CheckCircle2 : (stageMeta?.icon ?? Activity);
  const stageColor = isCompleted ? "text-emerald-400" : (stageMeta?.color ?? "text-white/30");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#07090d]">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/6 bg-white/[0.02] px-5 py-2.5">
        <FlaskConical size={14} className="text-emerald-400/60" />
        <span className="text-[13px] font-medium text-white/70">
          {targetPdbId} — <span className="capitalize">{mode}</span>
        </span>
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            STATUS_COLORS[status] ?? "text-white/50",
          ].join(" ")}
        >
          {isRunning && <Loader2 size={9} className="animate-spin" />}
          {isCompleted && <CheckCircle2 size={9} />}
          <span className="capitalize">{status}</span>
        </span>

        {isRunning && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            live
          </span>
        )}

        <span className="font-mono text-[10px] text-white/20">{jobId}</span>

        {isRunning && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-400/8 px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-400/15 disabled:opacity-50"
          >
            {isCancelling ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
            {isCancelling ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>

      {/* ── Main split ───────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 divide-x divide-white/5 overflow-hidden">

        {/* Left — 3D protein viewer */}
        <div className="relative flex w-1/2 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-2">
            <ActiveStageIcon size={12} className={stageColor} />
            <span className={`text-[11px] font-medium ${stageColor}`}>
              {isCompleted ? "Completed" : (stageMeta?.label ?? "Protein Structure")}
            </span>
            <span className="ml-auto font-mono text-[10px] text-white/20">
              {targetPdbId.toUpperCase()}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <ProteinViewer
              pdbId={targetPdbId}
              onStageReady={(stage) => { stageRef.current = stage; }}
            />
          </div>
        </div>

        {/* Right — dashboard */}
        <div className="flex w-1/2 flex-col overflow-y-auto">

          {/* Stat cards */}
          <div className="grid shrink-0 grid-cols-2 divide-x divide-y divide-white/5 border-b border-white/5 sm:grid-cols-4 sm:divide-y-0">
            <StatCard
              label="Stage"
              value={isCompleted ? "Done" : (stageMeta?.label ?? (effectiveStage ?? "—"))}
              color={isCompleted ? "text-emerald-400" : (stageMeta?.color ?? "text-white/40")}
            />
            <StatCard
              label="Iterations"
              value={effectiveIter > 0 ? String(effectiveIter) : "—"}
              color="text-violet-300"
            />
            <StatCard
              label="Best Score"
              value={effectiveScore != null ? `${effectiveScore.toFixed(2)}` : "—"}
              color="text-rose-300"
            />
            <StatCard
              label="ADMET Passes"
              value={effectiveAdmet > 0 ? String(effectiveAdmet) : "—"}
              color="text-teal-300"
            />
          </div>

          {/* Score chart */}
          <div className="shrink-0 border-b border-white/5 px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-white/25">
              Binding Affinity over Iterations
            </p>
            {effectiveHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={effectiveHistory} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <XAxis
                    dataKey="iteration"
                    tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    reversed
                    tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d0f14",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.7)",
                    }}
                    formatter={(v: number) => [`${v.toFixed(2)} kcal/mol`, "Score"]}
                    labelFormatter={(l) => `Iter ${l}`}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#fb7185"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: "#fb7185" }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-[11px] text-white/20">
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={11} className="animate-spin" />
                    Waiting for first score…
                  </span>
                ) : "No score data"}
              </div>
            )}
          </div>

          {/* Best / final ligand */}
          <div className="shrink-0 border-b border-white/5 px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-white/25">
              {isCompleted ? "Final Best Candidate" : "Current Best Candidate"}
            </p>
            {effectiveSmiles ? (
              <LigandViewer smiles={effectiveSmiles} width={260} height={160} />
            ) : (
              <div className="flex h-[160px] items-center justify-center rounded-xl border border-white/5 text-[11px] text-white/20">
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={11} className="animate-spin" />
                    Waiting for candidate…
                  </span>
                ) : "No candidate"}
              </div>
            )}
          </div>

          {/* Discovered strip */}
          {discoveredSmiles.length > 0 && (
            <div className="shrink-0 border-b border-white/5 px-4 py-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-white/25">
                Discovered ({discoveredSmiles.length})
              </p>
              <div ref={discoveredScrollRef} className="flex gap-2 overflow-x-auto pb-1">
                <AnimatePresence initial={false}>
                  {discoveredSmiles.map((smiles) => (
                    <motion.div
                      key={smiles}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="shrink-0"
                    >
                      <LigandViewer smiles={smiles} width={90} height={70} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Completed — show full candidate cards */}
          {isCompleted && job.result && job.result.candidates.length > 0 && (
            <div className="px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Star size={12} className="text-emerald-400/60" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Top Candidates ({job.result.candidates.length})
                </p>
                <span className="ml-auto text-[10px] text-white/20">
                  {job.result.total_runtime_seconds.toFixed(1)}s · {job.result.iterations_used} iters
                </span>
              </div>
              <div className="space-y-4">
                {job.result.candidates.map((c) => (
                  <CandidateCard key={c.rank} candidate={c} />
                ))}
              </div>
            </div>
          )}

          {isRunning && (
            <p className="mt-auto shrink-0 px-5 py-2 text-[10px] text-white/20">
              <Loader2 size={9} className="inline animate-spin mr-1" />
              Refreshing every 2 s · log events: {logLines.filter(l => !QUANTUM_LEVELS.has(l.level)).length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Loader2, FlaskConical } from "lucide-react";
import { usePharmaJob } from "@/features/pharma/hooks/use-pharma-job";
import { CandidateCard } from "./candidate-card";
import { PageHeader } from "@/shared/components/layout/page-header";

const STATUS_COLORS: Record<string, string> = {
  queued: "text-amber-600 bg-amber-50 border-amber-200",
  running: "text-blue-600 bg-blue-50 border-blue-200",
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  failed: "text-red-600 bg-red-50 border-red-200",
  cancelled: "text-[var(--muted)] bg-[var(--surface-soft)] border-[var(--hairline)]",
};

export function PharmaJobDetail({ jobId }: { jobId: string }) {
  const { data: job, isLoading, error } = usePharmaJob(jobId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={22} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : "Job not found"}
        </p>
      </div>
    );
  }

  const isRunning = job.status === "queued" || job.status === "running";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={FlaskConical}
        label="Pharma"
        title={`${job.target_pdb_id} — ${job.mode.charAt(0).toUpperCase() + job.mode.slice(1)}`}
        description={jobId}
        glow="emerald"
      />

      {/* Status strip */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[var(--hairline)] bg-[var(--surface-soft)] px-5 py-4">
        <div>
          <p className="text-xs text-[var(--muted)] mb-1">Status</p>
          <span
            className={[
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
              STATUS_COLORS[job.status] ?? "text-[var(--body)]",
            ].join(" ")}
          >
            {isRunning && <Loader2 size={10} className="animate-spin" />}
            <span className="capitalize">{job.status}</span>
          </span>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-1">Target</p>
          <p className="text-sm font-mono text-[var(--ink)]">{job.target_pdb_id}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-1">Mode</p>
          <p className="text-sm capitalize text-[var(--body)]">{job.mode}</p>
        </div>
        {job.result && (
          <>
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Candidates</p>
              <p className="text-sm text-[var(--body)]">{job.result.candidates.length}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Runtime</p>
              <p className="text-sm text-[var(--body)]">
                {job.result.total_runtime_seconds.toFixed(1)}s
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Cache Hit Rate</p>
              <p className="text-sm text-[var(--body)]">
                {(job.result.cache_hit_rate * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Iterations</p>
              <p className="text-sm text-[var(--body)]">{job.result.iterations_used}</p>
            </div>
          </>
        )}
        {job.completed_at && (
          <div className="ml-auto">
            <p className="text-xs text-[var(--muted)] mb-1">Completed</p>
            <p className="text-xs text-[var(--muted)]">
              {new Date(job.completed_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Error display */}
      {job.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{job.error}</p>
        </div>
      )}

      {/* Candidates */}
      {job.result && job.result.candidates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Top Candidates ({job.result.candidates.length})
          </h2>
          {job.result.candidates.map((c) => (
            <CandidateCard key={c.rank} candidate={c} />
          ))}
        </div>
      )}

      {isRunning && (
        <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={13} className="animate-spin" />
          Pipeline running — auto-refreshing every 3s
        </p>
      )}
    </div>
  );
}

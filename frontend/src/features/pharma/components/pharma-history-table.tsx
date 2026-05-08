"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePharmaJobs } from "@/features/pharma/hooks/use-pharma-jobs";
import { ROUTES } from "@/constants";
import type { PharmaJobStatus } from "@/features/pharma/types";

const STATUS_DOT: Record<PharmaJobStatus, string> = {
  queued: "bg-amber-400",
  running: "bg-blue-400 animate-pulse",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  cancelled: "bg-[var(--muted)]",
};

export function PharmaHistoryTable() {
  const router = useRouter();
  const { data: jobs, isLoading } = usePharmaJobs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={20} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted)] text-sm">
        No pharma jobs yet.{" "}
        <a href={ROUTES.PHARMA_SUBMIT} className="text-[var(--link)] hover:underline">
          Submit your first pipeline
        </a>
      </div>
    );
  }

  const sorted = [...jobs].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );

  return (
    <div className="rounded-xl border border-[var(--hairline)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--hairline)] bg-[var(--surface-soft)]">
            {["Status", "Target", "Mode", "Candidates", "Runtime", "Submitted"].map((h) => (
              <th
                key={h}
                className="px-5 py-3.5 text-left text-xs text-[var(--muted)] uppercase tracking-wider font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((job) => (
            <tr
              key={job.job_id}
              onClick={() => router.push(ROUTES.pharmaJob(job.job_id))}
              className="border-b border-[var(--hairline)] cursor-pointer hover:bg-emerald-50 transition-colors"
            >
              <td className="px-5 py-4">
                <span className="flex items-center gap-2">
                  <span
                    className={[
                      "w-2 h-2 rounded-full shrink-0",
                      STATUS_DOT[job.status] ?? "bg-[var(--muted)]",
                    ].join(" ")}
                  />
                  <span className="capitalize text-[var(--body)]">{job.status}</span>
                </span>
              </td>
              <td className="px-5 py-4 font-mono text-[var(--ink)]">{job.target_pdb_id}</td>
              <td className="px-5 py-4 capitalize text-[var(--body)]">{job.mode}</td>
              <td className="px-5 py-4 text-[var(--body)]">
                {job.result ? job.result.candidates.length : "—"}
              </td>
              <td className="px-5 py-4 text-[var(--body)]">
                {job.result ? `${job.result.total_runtime_seconds.toFixed(1)}s` : "—"}
              </td>
              <td className="px-5 py-4 text-[var(--muted)] text-xs">
                {new Date(job.submitted_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

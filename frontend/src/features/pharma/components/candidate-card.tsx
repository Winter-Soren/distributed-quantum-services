import type { PharmaCandidate } from "@/features/pharma/types";
import { ADMETPanel } from "./admet-panel";
import { GitMerge } from "lucide-react";

export function CandidateCard({ candidate }: { candidate: PharmaCandidate }) {
  const { smiles, vqc_score, docking_pose, scaffold_history, rank } = candidate;

  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">
            Rank #{rank}
          </p>
          <p className="font-mono text-sm text-[var(--body)] break-all leading-relaxed">
            {smiles}
          </p>
        </div>
        <div className="text-right shrink-0 ml-6">
          <p className="text-xs text-[var(--muted)] mb-0.5">Binding Affinity</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {vqc_score.binding_affinity_kcal.toFixed(2)}
          </p>
          <p className="text-xs text-[var(--muted)]">kcal/mol</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            [{vqc_score.confidence_interval[0].toFixed(1)}, {vqc_score.confidence_interval[1].toFixed(1)}]
          </p>
        </div>
      </div>

      {/* Docking metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--surface-soft)] border border-[var(--hairline)] p-3">
          <p className="text-xs text-[var(--muted)] mb-1">QUBO Energy</p>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {docking_pose.total_qubo_energy.toFixed(3)}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--surface-soft)] border border-[var(--hairline)] p-3">
          <p className="text-xs text-[var(--muted)] mb-1">QAOA Approx. Ratio</p>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {(docking_pose.qaoa_approximation_ratio * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-[var(--surface-soft)] border border-[var(--hairline)] p-3">
          <p className="text-xs text-[var(--muted)] mb-1">DC-QAOA α</p>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {docking_pose.dc_qaoa_alpha.toFixed(2)}
          </p>
        </div>
      </div>

      <ADMETPanel admet={candidate.admet} />

      {scaffold_history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitMerge size={13} className="text-[var(--muted)]" />
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">
              Scaffold Hops ({scaffold_history.length})
            </p>
          </div>
          <div className="space-y-2">
            {scaffold_history.map((hop, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[var(--body)]">
                <span className="shrink-0 text-[var(--muted)] w-5">#{hop.iteration + 1}</span>
                <span className="font-mono truncate">{hop.input_smiles}</span>
                <span className="text-[var(--muted)] shrink-0">→</span>
                <span className="font-mono truncate text-emerald-600">{hop.output_smiles}</span>
                <span className="shrink-0 text-[var(--muted)] italic">({hop.reason_for_hop})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

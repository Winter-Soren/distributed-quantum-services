import { CheckCircle2, XCircle } from "lucide-react";
import type { ADMETResult } from "@/features/pharma/types";

export function ADMETPanel({ admet }: { admet: ADMETResult }) {
  const metrics = [
    { label: "MW", value: admet.molecular_weight.toFixed(1), unit: "Da", ok: admet.molecular_weight <= 500 },
    { label: "LogP", value: admet.logp.toFixed(2), unit: "", ok: admet.logp <= 5 },
    { label: "TPSA", value: admet.tpsa.toFixed(1), unit: "Å²", ok: admet.tpsa <= 140 },
    { label: "HBD", value: String(admet.hbd), unit: "", ok: admet.hbd <= 5 },
    { label: "HBA", value: String(admet.hba), unit: "", ok: admet.hba <= 10 },
    { label: "QED", value: admet.qed_score.toFixed(3), unit: "", ok: admet.qed_score >= 0.4 },
    { label: "SA", value: admet.synthetic_accessibility.toFixed(2), unit: "", ok: admet.synthetic_accessibility <= 4 },
  ];

  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-soft)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          ADMET Profile
        </h3>
        <span
          className={[
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            admet.passes
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700",
          ].join(" ")}
        >
          {admet.passes ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {admet.passes ? "Passes" : "Fails"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {metrics.map(({ label, value, unit, ok }) => (
          <div
            key={label}
            className={[
              "rounded-lg p-3 border",
              ok
                ? "border-[var(--hairline)] bg-[var(--canvas)]"
                : "border-red-200 bg-red-50",
            ].join(" ")}
          >
            <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
            <p className={["text-sm font-semibold", ok ? "text-[var(--ink)]" : "text-red-600"].join(" ")}>
              {value}
              {unit && <span className="text-xs text-[var(--muted)] ml-0.5">{unit}</span>}
            </p>
          </div>
        ))}
      </div>
      {admet.failure_reasons.length > 0 && (
        <div className="mt-3 space-y-1">
          {admet.failure_reasons.map((r, i) => (
            <p key={i} className="text-xs text-red-600 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
              {r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

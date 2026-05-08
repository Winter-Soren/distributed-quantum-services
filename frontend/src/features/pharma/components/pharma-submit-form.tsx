"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FlaskConical, Dna, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmitPharma } from "@/features/pharma";
import { ROUTES } from "@/constants";
import type { PharmaMode } from "@/features/pharma";

const schema = z
  .object({
    mode: z.enum(["optimization", "discovery"]),
    target_pdb_id: z
      .string()
      .min(3, "PDB ID must be at least 3 characters")
      .max(10, "PDB ID too long")
      .regex(/^[A-Z0-9]+$/, "PDB ID must be uppercase alphanumeric"),
    initial_ligand_smiles: z.string().optional(),
    max_iterations: z.number().int().min(1).max(20),
    candidate_count: z.number().int().min(10).max(500),
  })
  .refine(
    (v) =>
      v.mode !== "optimization" ||
      !v.initial_ligand_smiles ||
      v.initial_ligand_smiles.length >= 5,
    { message: "SMILES must be at least 5 characters", path: ["initial_ligand_smiles"] },
  );

type FormValues = z.infer<typeof schema>;

export function PharmaSubmitForm() {
  const router = useRouter();
  const { mutate: submit, isPending } = useSubmitPharma();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: "optimization",
      target_pdb_id: "6LU7",
      max_iterations: 5,
      candidate_count: 100,
    },
  });

  const mode = watch("mode");

  function onSubmit(values: FormValues): void {
    submit(
      {
        mode: values.mode as PharmaMode,
        target_pdb_id: values.target_pdb_id,
        initial_ligand_smiles: values.initial_ligand_smiles || undefined,
        max_iterations: values.max_iterations,
        candidate_count: values.candidate_count,
      },
      {
        onSuccess: (res) => {
          toast.success("Pipeline queued successfully");
          router.push(ROUTES.pharmaJob(res.job_id));
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Submission failed");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Mode selector */}
      <div>
        <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">
          Pipeline Mode
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["optimization", "discovery"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setValue("mode", m)}
              className={[
                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                mode === m
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-[var(--hairline)] text-[var(--muted)] hover:border-[var(--border-strong)]",
              ].join(" ")}
            >
              {m === "optimization" ? (
                <Dna size={16} />
              ) : (
                <Search size={16} />
              )}
              <div>
                <p className="text-sm font-medium capitalize">{m}</p>
                <p className="text-xs opacity-60 mt-0.5">
                  {m === "optimization" ? "Refine a known ligand" : "Generate novel candidates"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PDB ID */}
      <div>
        <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1.5">
          Target PDB ID
        </label>
        <input
          {...register("target_pdb_id")}
          onChange={(e) =>
            setValue("target_pdb_id", e.target.value.toUpperCase(), { shouldValidate: true })
          }
          placeholder="e.g. 6LU7"
          className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-lg px-4 py-2.5
                     text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none
                     focus:border-emerald-500/50 transition-colors text-sm"
        />
        {errors.target_pdb_id && (
          <p className="text-xs text-red-500 mt-1">{errors.target_pdb_id.message}</p>
        )}
      </div>

      {/* Seed SMILES (optimization only) */}
      {mode === "optimization" && (
        <div>
          <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1.5">
            Seed Ligand SMILES{" "}
            <span className="normal-case opacity-60">(optional)</span>
          </label>
          <textarea
            {...register("initial_ligand_smiles")}
            rows={2}
            placeholder="CC(C)Cc1ccc(cc1)C(C)C(O)=O"
            className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-lg px-4 py-2.5
                       text-[var(--ink)] text-sm font-mono placeholder:text-[var(--muted)] resize-none
                       focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {errors.initial_ligand_smiles && (
            <p className="text-xs text-red-500 mt-1">{errors.initial_ligand_smiles.message}</p>
          )}
        </div>
      )}

      {/* Advanced parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1.5">
            Max Iterations
          </label>
          <input
            type="number"
            {...register("max_iterations")}
            min={1}
            max={20}
            className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-lg px-4 py-2.5
                       text-[var(--ink)] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {errors.max_iterations && (
            <p className="text-xs text-red-500 mt-1">{errors.max_iterations.message}</p>
          )}
        </div>
        {mode === "discovery" && (
          <div>
            <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1.5">
              Candidate Count
            </label>
            <input
              type="number"
              {...register("candidate_count")}
              min={10}
              max={500}
              className="w-full bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-lg px-4 py-2.5
                         text-[var(--ink)] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {errors.candidate_count && (
              <p className="text-xs text-red-500 mt-1">{errors.candidate_count.message}</p>
            )}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[var(--ink)] text-[var(--on-primary)] hover:bg-[var(--primary-active)]"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Submitting…
          </>
        ) : (
          <>
            <FlaskConical size={16} className="mr-2" />
            Submit Pipeline
          </>
        )}
      </Button>
    </form>
  );
}

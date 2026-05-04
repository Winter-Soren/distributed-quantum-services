"use client";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useCreateRun } from "../hooks/use-create-run";
import { ROUTES } from "@/constants";

const schema = z.object({
  circuit: z.string().min(10, "Circuit must be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

const EXAMPLE_CIRCUIT = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0],q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];`;

export function RunCreateForm() {
  const router = useRouter();
  const { mutate: createRun, isPending } = useCreateRun();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { circuit: EXAMPLE_CIRCUIT },
  });

  function onSubmit(values: FormValues) {
    createRun(
      { circuit: values.circuit },
      {
        onSuccess: (result) => {
          toast.success("Run submitted successfully");
          router.push(ROUTES.runDetail(result.job_id));
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Submission failed");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="circuit"
          className="text-sm font-medium text-foreground"
        >
          QASM Circuit
        </label>
        <Textarea
          id="circuit"
          rows={14}
          className="font-mono text-xs"
          placeholder={EXAMPLE_CIRCUIT}
          {...register("circuit")}
        />
        {errors.circuit && (
          <p className="text-xs text-destructive">{errors.circuit.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? <Spinner className="mr-2 size-4" /> : null}
        {isPending ? "Submitting…" : "Submit Run"}
      </Button>
    </form>
  );
}

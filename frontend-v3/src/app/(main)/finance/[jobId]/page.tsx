"use client";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceJob } from "@/features/finance/hooks/use-finance-job";
import { FinanceResultSummary } from "@/features/finance/components/finance-result-summary";

export default function FinanceDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data, isPending, isError } = useFinanceJob(jobId);

  if (isPending) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Failed to load finance job.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-foreground">
          Financial Result
        </h1>
        <p className="mt-1 text-xs text-muted-foreground font-mono">{data.jobId}</p>
      </div>
      <FinanceResultSummary job={data} />
    </div>
  );
}

"use client";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiskJob } from "@/features/risk/hooks/use-risk-job";
import { RiskResultDashboard } from "@/features/risk/components/risk-result-dashboard";

export default function RiskDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data, isPending, isError } = useRiskJob(jobId);

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
        <p className="text-sm text-destructive">Failed to load risk job.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-foreground">Risk Result</h1>
        <p className="mt-1 text-xs text-muted-foreground font-mono">{data.jobId}</p>
      </div>
      <RiskResultDashboard job={data} />
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptionsJob } from "../hooks/use-options-job";
import { OptionsResultCard } from "./options-result-card";

export function OptionsDetailPageClient() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data, isPending, isError } = useOptionsJob(jobId);

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
        <p className="text-sm text-destructive">Failed to load options job.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-foreground">Options Result</h1>
        <p className="mt-1 text-xs text-muted-foreground font-mono">{data.jobId}</p>
      </div>
      <OptionsResultCard job={data} />
    </div>
  );
}
